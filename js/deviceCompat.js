/**
 * Device compatibility profile for older / low-end Android phones.
 * Native data is injected from Android via window.RacingDeviceProfile (see blockly.html).
 */

const RAM_LITE_THRESHOLD_MB = 2500;
const SDK_LITE_THRESHOLD = 28;
const WEBVIEW_IMPORT_MAP_MIN = 89;

export function readNativeDeviceProfile() {

	if ( typeof window === 'undefined' ) return null;

	const native = window.RacingDeviceProfile;
	if ( ! native || typeof native !== 'object' ) return null;

	return native;

}

export function getDeviceProfile() {

	const params = new URLSearchParams( window.location.search );
	const forceLite = params.get( 'lite' ) === '1';
	const native = readNativeDeviceProfile();

	const androidSdk = Number( native?.androidSdk ) || 0;
	const totalRamMb = Number( native?.totalRamMb ) || 0;
	const webViewMajor = Number( native?.webViewMajor ) || 0;

	const oldAndroid = androidSdk > 0 && androidSdk < SDK_LITE_THRESHOLD;
	const lowRam = totalRamMb > 0 && totalRamMb < RAM_LITE_THRESHOLD_MB;
	const oldWebView = webViewMajor > 0 && webViewMajor < WEBVIEW_IMPORT_MAP_MIN;
	const importMapsSupported = typeof HTMLScriptElement !== 'undefined'
		&& HTMLScriptElement.supports?.( 'importmap' ) === true;

	const liteMode = forceLite || oldAndroid || lowRam || oldWebView || ! importMapsSupported;
	const lowGpu = liteMode || oldAndroid || lowRam;

	const reasons = [];

	if ( forceLite ) reasons.push( 'mode leger force' );
	if ( oldAndroid ) reasons.push( `Android ${ androidSdk }` );
	if ( lowRam ) reasons.push( `${ totalRamMb } Mo RAM` );
	if ( oldWebView ) reasons.push( `WebView ${ webViewMajor }` );
	if ( ! importMapsSupported && ! oldWebView ) reasons.push( 'import maps indisponibles' );

	return {
		androidSdk,
		totalRamMb,
		webViewMajor,
		liteMode,
		lowGpu,
		oldWebView,
		lowRam,
		oldAndroid,
		importMapsSupported,
		reason: reasons.join( ', ' ) || '',
	};

}

export function isBlocklyPage() {

	return Boolean( document.getElementById( 'blockly-panel' ) );

}

export function shouldUseLiteBlockly() {

	return isBlocklyPage() && getDeviceProfile().liteMode;

}

export function getCompatBannerMessage( profile = getDeviceProfile() ) {

	if ( profile.oldWebView ) {

		return 'WebView ancienne : mettez a jour Android System WebView. Mode robot Blockly disponible.';

	}

	if ( profile.liteMode ) {

		const detail = profile.reason ? ` (${ profile.reason })` : '';
		return `Mode leger active${ detail }. Simulateur 3D desactive, robot Blockly disponible.`;

	}

	return '';

}
