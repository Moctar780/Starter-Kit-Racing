/** 1:1 Blockly block type + field value → Sparki serial letter. */
export const SPARKI_BLOCK_COMMANDS = {
	racing_drive: { FORWARD: 'F', BACKWARD: 'B' },
	racing_turn: { LEFT: 'L', RIGHT: 'R' },
	racing_stop: 'S',
	racing_gripper: { OPEN: 'O', CLOSE: 'C' },
	racing_wait: null,
};

export function blockTypeToSparkiLetter( blockType, fieldValue ) {

	const mapping = SPARKI_BLOCK_COMMANDS[ blockType ];
	if ( mapping === null ) return null;
	if ( typeof mapping === 'string' ) return mapping;
	return mapping?.[ fieldValue ] ?? null;

}

export function instructionToSparkiLetter( instruction ) {

	if ( ! instruction || ( instruction.type !== 'step' && instruction.type !== 'wait' ) ) return null;

	if ( Object.prototype.hasOwnProperty.call( instruction, 'sparki' ) ) {

		return instruction.sparki;

	}

	switch ( instruction.label ) {

		case 'avancer':
			return 'F';
		case 'reculer':
			return 'B';
		case 'tourner a droite':
			return 'R';
		case 'tourner a gauche':
			return 'L';
		case 'stop':
			return 'S';
		case 'ouvrir pince':
			return 'O';
		case 'fermer pince':
			return 'C';
		case 'attendre':
			return null;
		default:
			return null;

	}

}

export function programToSparkiLine( instructions ) {

	const letters = [];

	for ( const instruction of flattenInputInstructions( instructions ) ) {

		const letter = instructionToSparkiLetter( instruction );
		if ( letter ) letters.push( letter );

	}

	return letters.join( ' ' );

}

function flattenInputInstructions( instructions, out = [] ) {

	for ( const instruction of instructions ) {

		if ( instruction.type === 'step' || instruction.type === 'wait' ) out.push( instruction );
		if ( instruction.type === 'repeat' ) {

			for ( let i = 0; i < instruction.count; i ++ ) {

				flattenInputInstructions( instruction.body, out );

			}

		}
		if ( instruction.type === 'if' ) {

			flattenInputInstructions( instruction.thenBranch, out );
			flattenInputInstructions( instruction.elseBranch, out );

		}

	}

	return out;

}
