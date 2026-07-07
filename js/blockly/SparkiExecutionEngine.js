import { ExecutionEngine } from './ExecutionEngine.js';
import { instructionToSparkiLetter } from './sparkiCommands.js';
import { sparkiBridge } from './sparkiBridge.js';
import { robotSettleMsForLetter } from './sparkiCalibration.js';

export class SparkiExecutionEngine extends ExecutionEngine {

	constructor( sensors ) {

		super( sensors );
		this.onAction = ( instruction ) => {

			if ( ! sparkiBridge.isRobotMode() ) {

				if ( window.SPARKI_DEBUG ) console.log( '[Sparki] onAction skipped (not robot mode)', instruction?.label );
				return;

			}

			const letter = instructionToSparkiLetter( instruction );

			if ( instruction.type === 'step' && letter ) {

				instruction.settleMs = robotSettleMsForLetter( letter );
				instruction.inputMs = 0;

			} else if ( instruction.type === 'wait' ) {

				instruction.inputMs = 0;

			}

			if ( ! sparkiBridge.isConnected() ) {

				if ( window.SPARKI_DEBUG ) console.log( '[Sparki] onAction skipped (not connected)', instruction?.label );
				return;

			}

			if ( window.SPARKI_DEBUG ) console.log( '[Sparki] onAction', instruction?.label );

			if ( letter ) sparkiBridge.sendLetter( letter );

		};

	}

	setInput( x, z ) {

		// Robot mode drives Sparki over Bluetooth only — do not feed the simulator.
		this.input.x = 0;
		this.input.z = 0;
		this.input.touchActive = false;
		this.input.blocklyActive = this.active;

	}

	pause() {

		if ( sparkiBridge.isRobotMode() && sparkiBridge.isConnected() ) sparkiBridge.sendLetter( 'S' );
		super.pause();

	}

	reset() {

		super.reset();

	}

}
