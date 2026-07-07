import { robotSettleMsForLetter } from './sparkiCalibration.js';

const MODE_KEY = 'racing.sparki.mode';
const DEVICE_KEY = 'racing.sparki.device';

let robotSendTail = Promise.resolve();

function parseJson( value, fallback ) {

	try {

		return value ? JSON.parse( value ) : fallback;

	} catch {

		return fallback;

	}

}

export const sparkiBridge = {

	get native() {

		return window.SparkiAndroid || null;

	},

	get available() {

		return Boolean( this.native?.isAvailable?.() );

	},

	isRobotMode() {

		return localStorage.getItem( MODE_KEY ) === 'robot';

	},

	setRobotMode( enabled ) {

		localStorage.setItem( MODE_KEY, enabled ? 'robot' : 'simulation' );

	},

	getSavedDevice() {

		return localStorage.getItem( DEVICE_KEY ) || '';

	},

	saveDevice( address ) {

		if ( address ) localStorage.setItem( DEVICE_KEY, address );
		else localStorage.removeItem( DEVICE_KEY );

	},

	getStatus() {

		if ( ! this.native ) {

			return { connected: false, available: false, device: '', name: '' };

		}

		return {
			available: true,
			...parseJson( this.native.getStatusJson(), {} ),
		};

	},

	listPairedDevices() {

		if ( ! this.native ) return [];

		return parseJson( this.native.listPairedDevicesJson(), [] );

	},

	connect( address ) {

		if ( ! this.native || ! address ) return false;

		const ok = Boolean( this.native.connect( address ) );
		if ( ok ) this.saveDevice( address );
		return ok;

	},

	disconnect() {

		this.native?.disconnect?.();

	},

	sendLetter( letter ) {

		if ( ! letter || ! this.isRobotMode() ) {

			if ( window.SPARKI_DEBUG ) console.log( '[Sparki] sendLetter blocked (mode/letter)', { letter, robot: this.isRobotMode() } );
			return false;

		}

		if ( ! this.native ) {

			if ( window.SPARKI_DEBUG ) console.log( '[Sparki] sendLetter blocked (no native bridge)', letter );
			return false;

		}

		const delayMs = robotSettleMsForLetter( letter );

		robotSendTail = robotSendTail.then( () => new Promise( ( resolve ) => {

			let ok = false;

			try {

				ok = Boolean( this.native.sendCommand( letter ) );

			} catch ( error ) {

				console.warn( '[Sparki] sendCommand failed', error );

			}

			if ( window.SPARKI_DEBUG ) console.log( '[Sparki] sendLetter', letter, ok ? 'ok' : 'failed' );

			window.setTimeout( resolve, delayMs );

		} ) );

		return true;

	},

	resetSendQueue() {

		robotSendTail = Promise.resolve();

	},

	sendLine( line ) {

		if ( ! line || ! this.native || ! this.isRobotMode() ) return false;

		return Boolean( this.native.sendLine( line ) );

	},

	sendProgramLine( line ) {

		if ( ! line ) return false;
		return this.sendLine( line );

	},

	isConnected() {

		return Boolean( this.getStatus().connected );

	},

	requestPermissions() {

		if ( ! this.native?.requestBluetoothPermissions ) return false;

		this.native.requestBluetoothPermissions();
		return true;

	},

	ensureConnected() {

		if ( ! this.available ) {

			throw new Error( 'Bluetooth Sparki indisponible sur cet appareil.' );

		}

		if ( ! this.isConnected() ) {

			throw new Error( 'Connectez le Sparki via Bluetooth avant de lancer le programme.' );

		}

	},

};

window.SparkiBridge = sparkiBridge;
