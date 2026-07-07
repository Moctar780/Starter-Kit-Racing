import { sparkiBridge } from './sparkiBridge.js';

export class SparkiPanel {

	constructor( container, options = {} ) {

		this.container = container;
		this.liteMode = options.liteMode === true;
		this.onModeChange = null;
		this.statusPoll = null;
		this.injectStyles();
		this.build();

	}

	injectStyles() {

		const style = document.createElement( 'style' );
		style.textContent = `
			#sparki-panel {
				padding: 3px 6px;
				border-bottom: 1px solid rgba(0,0,0,0.08);
				background: rgba(255,248,230,0.9);
				color: #1f2430;
			}
			.sparki-row {
				display: flex;
				gap: 3px;
				flex-wrap: nowrap;
				align-items: center;
			}
			#sparki-panel select {
				flex: 1;
				min-width: 0;
				border: 1px solid rgba(0,0,0,0.12);
				border-radius: 6px;
				padding: 2px 4px;
				font-size: 10px;
				background: #fff;
			}
			#sparki-panel button {
				border: 0;
				border-radius: 6px;
				padding: 2px 6px;
				min-height: 22px;
				background: rgba(31,36,48,0.08);
				color: #1f2430;
				cursor: pointer;
				font-size: 10px;
				white-space: nowrap;
			}
			#sparki-panel button.active {
				background: #4caf6a;
				color: #fff;
			}
			#sparki-panel button.connected {
				background: #247d3a;
				color: #fff;
			}
			#sparki-status {
				margin-top: 2px;
				font-size: 9px;
				line-height: 1.2;
				color: #4a5260;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			#sparki-status.connected { color: #247d3a; }
			#sparki-status.error { color: #9b4326; }
			@media (max-width: 800px) {
				#sparki-panel {
					padding: 2px 5px;
				}
				#sparki-panel button {
					min-height: 20px;
					padding: 2px 5px;
					font-size: 9px;
				}
				#sparki-panel select {
					font-size: 9px;
					padding: 2px 3px;
				}
				#sparki-status {
					margin-top: 1px;
					font-size: 8px;
				}
				#sparki-status:not(.error):not(.connected) {
					display: none;
				}
			}
		`;
		document.head.appendChild( style );

	}

	build() {

		this.el = document.createElement( 'section' );
		this.el.id = 'sparki-panel';
		this.el.innerHTML = `
			<div class="sparki-row">
				<button id="sparki-mode-sim" type="button">Simu</button>
				<button id="sparki-mode-robot" type="button">Robot</button>
				<select id="sparki-device" aria-label="Appareil Bluetooth"></select>
				<button id="sparki-connect" type="button">BT</button>
			</div>
			<div id="sparki-status" aria-live="polite"></div>
		`;
		this.container.appendChild( this.el );

		if ( ! sparkiBridge.available ) {

			sparkiBridge.setRobotMode( false );
			this.el.hidden = true;
			return;

		}

		this.statusEl = this.el.querySelector( '#sparki-status' );
		this.deviceSelect = this.el.querySelector( '#sparki-device' );
		this.simBtn = this.el.querySelector( '#sparki-mode-sim' );
		this.robotBtn = this.el.querySelector( '#sparki-mode-robot' );
		this.connectBtn = this.el.querySelector( '#sparki-connect' );
		this.connecting = false;

		this.deviceSelect.addEventListener( 'change', () => {

			const address = this.deviceSelect.value;
			if ( address ) sparkiBridge.saveDevice( address );

		} );

		this.connectBtn.addEventListener( 'click', () => this.toggleConnection() );
		this.simBtn.addEventListener( 'click', () => this.setMode( 'simulation' ) );
		this.robotBtn.addEventListener( 'click', () => this.setMode( 'robot' ) );

		if ( this.liteMode ) {

			this.simBtn.hidden = true;
			sparkiBridge.setRobotMode( true );
			this.applyModeUI( true );

		} else {

			this.applyModeUI( ( localStorage.getItem( 'racing.sparki.mode' ) || 'robot' ) === 'robot' );

		}

		this.refreshDevices();
		this.refreshStatus();
		this.startStatusPoll();

	}

	startStatusPoll() {

		this.stopStatusPoll();
		this.statusPoll = window.setInterval( () => this.refreshStatus(), 2000 );

	}

	stopStatusPoll() {

		if ( this.statusPoll ) {

			window.clearInterval( this.statusPoll );
			this.statusPoll = null;

		}

	}

	setMode( mode ) {

		if ( this.liteMode && mode !== 'robot' ) return;

		const robot = mode === 'robot';
		localStorage.setItem( 'racing.sparki.mode', robot ? 'robot' : 'simulation' );
		this.applyModeUI( robot );
		this.onModeChange?.( robot ? 'robot' : 'simulation' );
		this.refreshStatus();

	}

	applyModeUI( robot ) {

		this.simBtn.classList.toggle( 'active', ! robot );
		this.robotBtn.classList.toggle( 'active', robot );

	}

	refreshDevices() {

		if ( ! sparkiBridge.available ) {

			this.deviceSelect.innerHTML = '<option value="">Non disponible</option>';
			return;

		}

		const devices = sparkiBridge.listPairedDevices();
		const preferredAddress = this.deviceSelect.value || sparkiBridge.getSavedDevice();

		this.deviceSelect.innerHTML = devices.length
			? devices.map( ( device ) => `<option value="${ device.address }">${ device.name || device.address }</option>` ).join( '' )
			: '<option value="">Aucun appareil appaire</option>';

		if ( preferredAddress && devices.some( ( device ) => device.address === preferredAddress ) ) {

			this.deviceSelect.value = preferredAddress;

		}

	}

	toggleConnection() {

		if ( ! sparkiBridge.available ) return;

		const status = sparkiBridge.getStatus();

		if ( ! status.permission ) {

			sparkiBridge.requestPermissions();
			this.setStatus( 'Autorisez le Bluetooth Android, puis retouchez BT.', 'error' );
			return;

		}

		this.refreshDevices();

		if ( sparkiBridge.isConnected() ) {

			sparkiBridge.disconnect();
			this.refreshStatus();
			return;

		}

		const address = this.deviceSelect.value;

		if ( ! address ) {

			this.setStatus( 'Choisissez un appareil Bluetooth.', 'error' );
			return;

		}

		this.connecting = true;
		this.connectBtn.disabled = true;
		this.setStatus( 'Connexion en cours...', '' );

		const ok = sparkiBridge.connect( address );

		if ( ! ok ) {

			this.connecting = false;
			this.connectBtn.disabled = false;
			this.setStatus( 'Echec de connexion.', 'error' );
			this.refreshStatus();
			return;

		}

		this.waitForConnection( 0 );

	}

	waitForConnection( attempt ) {

		const status = sparkiBridge.getStatus();

		if ( status.connected ) {

			this.connecting = false;
			this.connectBtn.disabled = false;
			this.refreshStatus();
			return;

		}

		if ( attempt >= 24 ) {

			this.connecting = false;
			this.connectBtn.disabled = false;
			this.setStatus( 'Connexion echouee ou expiree.', 'error' );
			this.refreshStatus();
			return;

		}

		window.setTimeout( () => this.waitForConnection( attempt + 1 ), 500 );

	}

	refreshStatus() {

		if ( ! sparkiBridge.available || this.connecting ) return;

		const status = sparkiBridge.getStatus();
		const mode = sparkiBridge.isRobotMode() ? 'Robot' : 'Simulateur';

		this.connectBtn.classList.toggle( 'connected', status.connected );
		this.connectBtn.textContent = status.connected ? 'OK' : 'BT';
		this.connectBtn.disabled = false;

		if ( ! status.permission ) {

			this.setStatus( `${ mode } · Appuyez sur BT pour autoriser`, 'error' );
			return;

		}

		if ( ! status.enabled ) {

			this.setStatus( `${ mode } · Activez le Bluetooth`, 'error' );
			return;

		}

		if ( status.connected ) {

			this.setStatus( `${ mode } · Connecte a ${ status.name || status.device }`, 'connected' );

		} else {

			this.setStatus( `${ mode } · Non connecte`, '' );

		}

	}

	setStatus( message, className = '' ) {

		this.statusEl.textContent = message;
		this.statusEl.className = className ? className : '';

	}

}
