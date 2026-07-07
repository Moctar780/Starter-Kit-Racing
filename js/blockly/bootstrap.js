import { shouldUseLiteBlockly } from '../deviceCompat.js';

if ( shouldUseLiteBlockly() ) {

	await import( '../main-lite.js' );

} else {

	await import( '../main.js' );

}
