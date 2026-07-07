import { blockTypeToSparkiLetter } from './sparkiCommands.js';
import { delayForSparkiLetter, inputMsForSparkiLetter, normalizeWaitMs } from './sparkiCalibration.js';

const MAX_INSTRUCTIONS = 512;
const MAX_REPEAT = 50;

function fieldWaitMs( block, fallback ) {

	return normalizeWaitMs( block.getFieldValue( 'WAIT_MS' ), fallback );

}

function inputNumber( block, name, fallback ) {

	const target = block.getInputTargetBlock( name );
	if ( ! target || target.type !== 'math_number' ) return fallback;

	const value = Number( target.getFieldValue( 'NUM' ) );
	if ( ! Number.isFinite( value ) ) return fallback;

	return value;

}

function pushInstruction( instructions, instruction ) {

	if ( instructions.length >= MAX_INSTRUCTIONS ) return false;
	instructions.push( instruction );
	return true;

}

function commandInstruction( block, command, x, z ) {

	return {
		type: 'step',
		command,
		x,
		z,
		settleMs: delayForSparkiLetter( command ),
		inputMs: inputMsForSparkiLetter( command ),
		blockId: block.id,
		label: blockLabel( block ),
		sparki: command,
	};

}

function blockLabel( block ) {

	switch ( block.type ) {

		case 'racing_drive':
			return block.getFieldValue( 'DIR' ) === 'BACKWARD' ? 'reculer' : 'avancer';
		case 'racing_turn':
			return block.getFieldValue( 'DIR' ) === 'RIGHT' ? 'tourner a droite' : 'tourner a gauche';
		case 'racing_wait':
			return 'attendre';
		case 'racing_stop':
			return 'stop';
		case 'racing_gripper':
			return block.getFieldValue( 'ACTION' ) === 'CLOSE' ? 'fermer pince' : 'ouvrir pince';
		case 'controls_repeat_ext':
			return 'repeter';
		case 'controls_if':
		case 'racing_if':
			return 'si / alors';
		default:
			return block.type;

	}

}

function compileStatementChain( firstBlock, instructions, meta ) {

	let block = firstBlock;

	while ( block ) {

		meta.usedBlocks.add( block.type );

		if ( ! compileBlock( block, instructions, meta ) ) return false;
		block = block.getNextBlock();

	}

	return true;

}

function compileBlock( block, instructions, meta ) {

	switch ( block.type ) {

		case 'racing_drive': {
			const dir = block.getFieldValue( 'DIR' );
			const direction = dir === 'BACKWARD' ? - 1 : 1;
			const command = blockTypeToSparkiLetter( 'racing_drive', dir );
			return pushInstruction( instructions, commandInstruction( block, command, 0, direction ) );
		}

		case 'racing_turn': {
			const dir = block.getFieldValue( 'DIR' );
			const steering = dir === 'RIGHT' ? 1 : - 1;
			const command = blockTypeToSparkiLetter( 'racing_turn', dir );
			return pushInstruction( instructions, commandInstruction( block, command, steering, 0 ) );
		}

		case 'racing_wait':
			return pushInstruction( instructions, {
				type: 'wait',
				x: 0,
				z: 0,
				settleMs: fieldWaitMs( block, 1000 ),
				inputMs: 0,
				blockId: block.id,
				label: blockLabel( block ),
				sparki: blockTypeToSparkiLetter( 'racing_wait' ),
			} );

		case 'racing_stop':
			return pushInstruction( instructions, commandInstruction( block, blockTypeToSparkiLetter( 'racing_stop' ), 0, - 1 ) );

		case 'racing_gripper': {
			const action = block.getFieldValue( 'ACTION' );
			const command = blockTypeToSparkiLetter( 'racing_gripper', action );
			return pushInstruction( instructions, commandInstruction( block, command, 0, 0 ) );
		}

		case 'controls_repeat_ext': {
			const count = Math.max( 0, Math.min( Math.floor( inputNumber( block, 'TIMES', 1 ) ), MAX_REPEAT ) );
			const body = [];

			compileStatementChain( block.getInputTargetBlock( 'DO' ), body, meta );

			return pushInstruction( instructions, {
				type: 'repeat',
				count,
				body,
				blockId: block.id,
				label: blockLabel( block ),
			} );
		}

		case 'controls_if':
		case 'racing_if': {
			const thenBranch = [];
			const elseBranch = [];

			compileStatementChain( block.getInputTargetBlock( 'DO0' ), thenBranch, meta );
			compileStatementChain( block.getInputTargetBlock( 'ELSE' ), elseBranch, meta );

			return pushInstruction( instructions, {
				type: 'if',
				condition: compileExpression( block.getInputTargetBlock( 'IF0' ) ),
				thenBranch,
				elseBranch,
				blockId: block.id,
				label: blockLabel( block ),
			} );
		}

		case 'variables_set':
			return pushInstruction( instructions, {
				type: 'setVariable',
				name: block.getFieldValue( 'VAR' ),
				value: compileExpression( block.getInputTargetBlock( 'VALUE' ) ),
				blockId: block.id,
				label: 'definir variable',
			} );

		default:
			return true;

	}

}

function compileExpression( block ) {

	if ( ! block ) return () => false;

	switch ( block.type ) {

		case 'math_number': {
			const value = Number( block.getFieldValue( 'NUM' ) );
			return () => Number.isFinite( value ) ? value : 0;
		}

		case 'logic_boolean': {
			const value = block.getFieldValue( 'BOOL' ) === 'TRUE';
			return () => value;
		}

		case 'logic_compare': {
			const op = block.getFieldValue( 'OP' );
			const left = compileExpression( block.getInputTargetBlock( 'A' ) );
			const right = compileExpression( block.getInputTargetBlock( 'B' ) );

			return ( sensors ) => {

				const a = left( sensors );
				const b = right( sensors );

				switch ( op ) {

					case 'EQ': return a === b;
					case 'NEQ': return a !== b;
					case 'LT': return a < b;
					case 'LTE': return a <= b;
					case 'GT': return a > b;
					case 'GTE': return a >= b;
					default: return false;

				}

			};
		}

		case 'math_arithmetic': {
			const op = block.getFieldValue( 'OP' );
			const left = compileExpression( block.getInputTargetBlock( 'A' ) );
			const right = compileExpression( block.getInputTargetBlock( 'B' ) );

			return ( sensors ) => {

				const a = Number( left( sensors ) ) || 0;
				const b = Number( right( sensors ) ) || 0;

				switch ( op ) {

					case 'ADD': return a + b;
					case 'MINUS': return a - b;
					case 'MULTIPLY': return a * b;
					case 'DIVIDE': return b === 0 ? 0 : a / b;
					case 'POWER': return Math.pow( a, b );
					default: return 0;

				}

			};
		}

		case 'racing_sensor_speed':
			return ( sensors ) => sensors.speed();
		case 'racing_sensor_time':
			return ( sensors ) => sensors.time();
		case 'racing_sensor_wall_distance':
			return ( sensors ) => sensors.wallDistance();
		case 'racing_sensor_on_finish':
			return ( sensors ) => sensors.onFinish();
		case 'racing_sensor_drifting':
			return ( sensors ) => sensors.drifting();
		case 'racing_sensor_collision':
			return ( sensors ) => sensors.collision();
		case 'variables_get':
			return ( sensors ) => sensors.getVariable?.( block.getFieldValue( 'VAR' ) ) || 0;
		default:
			return () => false;

	}

}

export function compileWorkspace( workspace ) {

	const rootBlocks = workspace.getTopBlocks( true ).filter( ( block ) => block.type === 'racing_when_run' );

	if ( rootBlocks.length === 0 ) {

		throw new Error( 'Ajoutez un bloc "quand demarrer".' );

	}

	const meta = {
		blockCount: workspace.getAllBlocks( false ).length,
		usedBlocks: new Set( [ 'racing_when_run' ] ),
	};
	const instructions = [];
	compileStatementChain( rootBlocks[ 0 ].getInputTargetBlock( 'DO' ), instructions, meta );

	return {
		instructions,
		blockCount: meta.blockCount,
		usedBlocks: workspace.getAllBlocks( false ).map( ( block ) => block.type ),
	};

}
