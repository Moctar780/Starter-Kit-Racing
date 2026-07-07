function bytesToBase64url( bytes ) {

	let binary = '';
	for ( let i = 0; i < bytes.length; i ++ ) binary += String.fromCharCode( bytes[ i ] );

	return btoa( binary ).replace( /\+/g, '-' ).replace( /\//g, '_' ).replace( /=+$/, '' );

}

function base64urlToBytes( str ) {

	const base64 = str.replace( /-/g, '+' ).replace( /_/g, '/' );
	const binary = atob( base64 );
	const bytes = new Uint8Array( binary.length );

	for ( let i = 0; i < binary.length; i ++ ) bytes[ i ] = binary.charCodeAt( i );

	return bytes;

}

export function encodeProgram( state ) {

	const json = JSON.stringify( state );
	return bytesToBase64url( new TextEncoder().encode( json ) );

}

export function decodeProgram( encoded ) {

	const json = new TextDecoder().decode( base64urlToBytes( encoded ) );
	return JSON.parse( json );

}
