import { compileWorkspace } from './interpreter.js';
import { ExecutionEngine } from './ExecutionEngine.js';
import { SparkiExecutionEngine } from './SparkiExecutionEngine.js';
import { createSensorApi } from './sensors.js';
import { sparkiBridge } from './sparkiBridge.js';

export class BlocklyControls {

	constructor( bridge ) {

		this.bridge = bridge;
		this.sensors = createSensorApi();
		this.engine = this.createEngine();
		this.program = null;
		this.onChange = null;
		this.onComplete = null;
		this._tickFrame = null;
		this._lastTick = 0;

		this.bindEngine();

		bridge.update = ( dt ) => this.update( dt );
		bridge.getInput = () => this.getInput();
		bridge.stop = () => this.stop();

		Object.defineProperty( bridge, 'active', {
			get: () => this.active,
			configurable: true,
		} );

	}

	createEngine() {

		if ( sparkiBridge.isRobotMode() ) return new SparkiExecutionEngine( this.sensors );
		return new ExecutionEngine( this.sensors );

	}

	setMode( mode ) {

		const wasRobotMode = sparkiBridge.isRobotMode();
		const wasActive = this.engine.active;
		if ( wasActive && wasRobotMode && sparkiBridge.isConnected() ) sparkiBridge.sendLetter( 'S' );

		this.stopTickLoop();
		sparkiBridge.resetSendQueue();
		sparkiBridge.setRobotMode( mode === 'robot' );
		this.engine.reset();
		this.engine = this.createEngine();
		this.bindEngine();
		if ( wasActive ) this.emitChange();

	}

	bindEngine() {

		this.engine.onStep = ( state ) => this.emitChange( state );
		this.engine.onComplete = () => {

			this.stopTickLoop();
			this.emitChange();
			this.onComplete?.( this.program );

		};

	}

	ensureTickLoop() {

		if ( this._tickFrame || ! this.engine.active || ! sparkiBridge.isRobotMode() ) return;

		this._lastTick = performance.now();

		const frame = ( now ) => {

			if ( ! this.engine.active || ! sparkiBridge.isRobotMode() ) {

				this.stopTickLoop();
				return;

			}

			const dt = Math.min( ( now - this._lastTick ) / 1000, 0.1 );
			this._lastTick = now;
			this.engine.update( dt );
			this._tickFrame = requestAnimationFrame( frame );

		};

		this._tickFrame = requestAnimationFrame( frame );

	}

	stopTickLoop() {

		if ( this._tickFrame ) cancelAnimationFrame( this._tickFrame );
		this._tickFrame = null;

	}

	get active() {

		return this.engine.active;

	}

	start( workspace, mode = 'run' ) {

		if ( sparkiBridge.isRobotMode() ) sparkiBridge.ensureConnected();

		if ( this.engine.active ) this.engine.reset();

		this.program = compileWorkspace( workspace );

		if ( this.program.instructions.length === 0 || this.engine.countActions( this.program.instructions ) === 0 ) {

			throw new Error( 'Ajoutez des blocs sous "quand demarrer".' );

		}

		this.engine.load( this.program );

		if ( mode === 'step' ) {

			this.engine.step();

		} else {

			this.engine.run();

		}

		this.engine.prime();
		this.ensureTickLoop();
		this.emitChange();

		return this.engine.total;

	}

	step( workspace ) {

		if ( ! this.engine.active ) this.start( workspace, 'step' );
		this.engine.step();
		this.emitChange();

	}

	pause() {

		this.engine.pause();
		this.emitChange();

	}

	resume() {

		this.engine.resume();
		this.emitChange();

	}

	setSpeed( scale ) {

		this.engine.setSpeed( scale );

	}

	stop() {

		this.stopTickLoop();

		if ( sparkiBridge.isRobotMode() && sparkiBridge.isConnected() ) {

			sparkiBridge.sendLetter( 'S' );

		}

		sparkiBridge.resetSendQueue();
		this.engine.reset();
		this.emitChange();

	}

	update( dt ) {

		if ( sparkiBridge.isRobotMode() ) return;

		this.engine.update( dt );

	}

	getInput() {

		return this.engine.getInput();

	}

	getProgramInfo() {

		return {
			blockCount: this.program?.blockCount || 0,
			usedBlocks: this.program?.usedBlocks || [],
		};

	}

	emitChange( stepState = null ) {

		this.onChange?.( {
			active: this.engine.active,
			paused: this.engine.paused,
			index: stepState?.index || this.engine.index,
			total: this.engine.total,
			blockId: stepState?.blockId || null,
			label: stepState?.label || '',
		} );

	}

}
