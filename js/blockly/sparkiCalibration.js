/**
 * Sparki discrete-step calibration.
 *
 * The firmware executes one fixed action per serial letter, then stops by itself.
 * These hidden delays only keep the app from sending the next letter too early.
 * Tune them on the real robot if a step is cut short or if commands feel slow.
 */

export const STEP_DELAYS_MS = {
	F: 1100,
	B: 1100,
	L: 500,
	R: 500,
	S: 1100,
	O: 400,
	C: 400,
};

export const DEFAULT_WAIT_MS = 1000;

/** Extra margin after BT write before the next robot command (remote_block style). */
export const BT_WRITE_BUFFER_MS = 100;

export const SIM_INPUT_MS = {
	F: 350,
	B: 350,
	L: 250,
	R: 250,
	S: 160,
	O: 0,
	C: 0,
};

export function delayForSparkiLetter( letter ) {

	return STEP_DELAYS_MS[ letter ] ?? DEFAULT_WAIT_MS;

}

/** Settle time between robot commands — matches remote_block Thread.sleep after each letter. */
export function robotSettleMsForLetter( letter ) {

	return Math.max( 1, delayForSparkiLetter( letter ) + BT_WRITE_BUFFER_MS );

}

export function inputMsForSparkiLetter( letter ) {

	return SIM_INPUT_MS[ letter ] ?? delayForSparkiLetter( letter );

}

export function normalizeWaitMs( value, fallback = DEFAULT_WAIT_MS ) {

	const waitMs = Number( value );
	if ( ! Number.isFinite( waitMs ) || waitMs < 0 ) return fallback;
	return Math.min( waitMs, 99999 );

}
