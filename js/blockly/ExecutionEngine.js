export class ExecutionEngine {

	constructor( sensors ) {

		this.sensors = sensors;
		this.input = { x: 0, z: 0, touchActive: false, blocklyActive: false };
		this.onStep = null;
		this.onComplete = null;
		this.onAction = null;
		this.reset();

	}

	reset() {

		this.program = null;
		this.variables = {};
		this.stack = [];
		this.current = null;
		this.elapsed = 0;
		this.inputReleased = true;
		this.index = 0;
		this.total = 0;
		this.active = false;
		this.paused = false;
		this.stepMode = false;
		this.speedScale = 1;
		this.setInput( 0, 0 );

	}

	load( program ) {

		this.reset();
		this.program = program;
		this.stack = [ { instructions: program.instructions, index: 0, remaining: 1 } ];
		this.total = this.countActions( program.instructions );
		this.active = this.total > 0;

	}

	prime() {

		if ( ! this.active || this.paused || this.current ) return;

		this.current = this.nextAction();

		if ( ! this.current ) {

			this.finish();
			return;

		}

		this.index ++;
		this.elapsed = 0;
		this.inputReleased = false;
		this.onAction?.( this.current );
		this.setInput( this.current.x, this.current.z );
		this.onStep?.( {
			blockId: this.current.blockId,
			index: this.index,
			total: this.total,
			label: this.current.label,
			active: true,
		} );

	}

	run() {

		this.paused = false;
		this.stepMode = false;

	}

	step() {

		this.paused = false;
		this.stepMode = true;

	}

	pause() {

		this.paused = true;
		this.setInput( 0, 0 );

	}

	resume() {

		this.paused = false;

		if ( this.current ) {

			this.setInput( this.current.x, this.current.z );

		}

	}

	setSpeed( scale ) {

		this.speedScale = scale;

	}

	update( dt ) {

		if ( ! this.active || this.paused ) return;

		if ( ! this.current ) {

			this.current = this.nextAction();
			this.elapsed = 0;

			if ( ! this.current ) {

				this.finish();
				return;

			}

			this.index ++;
			this.inputReleased = false;
			this.onAction?.( this.current );
			this.setInput( this.current.x, this.current.z );
			this.onStep?.( {
				blockId: this.current.blockId,
				index: this.index,
				total: this.total,
				label: this.current.label,
				active: true,
			} );

		}

		this.elapsed += dt * this.speedScale;

		const elapsedMs = this.elapsed * 1000;
		const inputMs = this.current.inputMs ?? this.current.settleMs ?? 0;
		const settleMs = this.current.settleMs ?? 0;

		if ( ! this.inputReleased && elapsedMs >= inputMs ) {

			this.inputReleased = true;
			this.setInput( 0, 0 );

		}

		if ( elapsedMs >= settleMs ) {

			this.current = null;
			this.inputReleased = true;
			this.setInput( 0, 0 );

			if ( this.stepMode ) this.paused = true;

		}

	}

	nextAction() {

		while ( this.stack.length > 0 ) {

			const frame = this.stack[ this.stack.length - 1 ];

			if ( frame.index >= frame.instructions.length ) {

				frame.remaining --;

				if ( frame.remaining > 0 ) {

					frame.index = 0;

				} else {

					this.stack.pop();

				}

				continue;

			}

			const instruction = frame.instructions[ frame.index ++ ];

			if ( instruction.type === 'repeat' ) {

				if ( instruction.count > 0 && instruction.body.length > 0 ) {

					this.stack.push( { instructions: instruction.body, index: 0, remaining: instruction.count } );

				}

				continue;

			}

			if ( instruction.type === 'if' ) {

				const branch = instruction.condition( this.context() ) ? instruction.thenBranch : instruction.elseBranch;

				if ( branch.length > 0 ) {

					this.stack.push( { instructions: branch, index: 0, remaining: 1 } );

				}

				continue;

			}

			if ( instruction.type === 'step' || instruction.type === 'wait' ) return instruction;

			if ( instruction.type === 'setVariable' ) {

				this.variables[ instruction.name ] = instruction.value( this.context() );
				this.onStep?.( {
					blockId: instruction.blockId,
					index: this.index,
					total: this.total,
					label: instruction.label,
					active: true,
				} );
				continue;

			}

		}

		return null;

	}

	countActions( instructions ) {

		let count = 0;

		for ( const instruction of instructions ) {

			if ( instruction.type === 'step' || instruction.type === 'wait' ) count ++;
			if ( instruction.type === 'repeat' ) count += instruction.count * this.countActions( instruction.body );
			if ( instruction.type === 'if' ) count += Math.max( this.countActions( instruction.thenBranch ), this.countActions( instruction.elseBranch ) );

		}

		return count;

	}

	context() {

		return {
			...this.sensors,
			getVariable: ( name ) => this.variables[ name ] || 0,
		};

	}

	setInput( x, z ) {

		this.input.x = x;
		this.input.z = z;
		this.input.touchActive = false;
		this.input.blocklyActive = this.active;

	}

	getInput() {

		return this.input;

	}

	finish() {

		const program = this.program;
		this.reset();
		this.onComplete?.( program );

	}

}
