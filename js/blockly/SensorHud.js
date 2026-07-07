/**
 * Live sensor readout during Blockly simulation runs (mode Simulateur).
 */

export class SensorHud {

	constructor() {

		this.injectStyles();
		this.el = document.createElement( 'div' );
		this.el.id = 'sensor-hud';
		this.el.setAttribute( 'aria-live', 'polite' );
		document.body.appendChild( this.el );
		this.show();

	}

	injectStyles() {

		if ( document.getElementById( 'sensor-hud-styles' ) ) return;

		const style = document.createElement( 'style' );
		style.id = 'sensor-hud-styles';
		style.textContent = `
			#sensor-hud {
				position: fixed;
				left: calc( 12px + env( safe-area-inset-left, 0px ) );
				bottom: calc( 52px + env( safe-area-inset-bottom, 0px ) );
				z-index: 23;
				max-width: min( 220px, 45vw );
				padding: 6px 8px;
				border-radius: 10px;
				background: rgba( 16, 20, 28, 0.38 );
				border: 1px solid rgba( 255, 255, 255, 0.1 );
				color: rgba( 232, 236, 242, 0.92 );
				font: 500 10px/1.35 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
				pointer-events: none;
				box-shadow: none;
				backdrop-filter: blur( 4px );
				-webkit-backdrop-filter: blur( 4px );
				transition: opacity 0.2s ease;
			}
			#sensor-hud[data-idle="true"] {
				opacity: 0.72;
			}
			#sensor-hud strong {
				display: block;
				margin-bottom: 3px;
				font-size: 9px;
				letter-spacing: 0.04em;
				text-transform: uppercase;
				color: rgba( 154, 163, 178, 0.88 );
			}
			#sensor-hud .warn { color: #ffb347; }
			#sensor-hud .hit { color: #ff7b6b; }
			@media ( max-width: 800px ) {
				#sensor-hud {
					left: calc( 8px + env( safe-area-inset-left, 0px ) );
					bottom: calc( 48px + env( safe-area-inset-bottom, 0px ) );
					font-size: 9px;
				}
			}
		`;
		document.head.appendChild( style );

	}

	show() {

		this.el.hidden = false;

	}

	hide() {

		this.el.hidden = true;

	}

	update( stats, { running = false } = {} ) {

		this.el.dataset.idle = running ? 'false' : 'true';

		if ( ! stats ) {

			this.el.innerHTML = `
				<strong>Capteurs</strong>
				Mur devant: —<br>
				Vitesse: — · Collision: —<br>
				Arrivee: — · Tours: —
			`;
			this.show();
			return;

		}

		const wall = stats.wallDistance ?? 0;
		const wallClass = wall < 4 ? 'hit' : wall < 8 ? 'warn' : '';
		const speed = ( ( stats.normalizedSpeed || 0 ) * 100 ).toFixed( 0 );
		const collision = stats.collision ? 'oui' : 'non';
		const finish = stats.onFinishLine ? 'oui' : 'non';

		this.el.innerHTML = `
			<strong>Capteurs</strong>
			<span class="${ wallClass }">Mur devant: ${ wall.toFixed( 1 ) }</span><br>
			Vitesse: ${ speed } % · Collision: ${ collision }<br>
			Arrivee: ${ finish } · Tours: ${ stats.completedLaps || 0 }
		`;

		this.show();

	}

}
