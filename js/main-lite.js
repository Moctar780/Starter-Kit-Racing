/**
 * Lightweight entry for Blockly on old / low-end devices — no Three.js simulator.
 */

const loadingEl = document.getElementById( 'loading' );
const loadingBar = document.getElementById( 'loading-bar' );
const loadingLabel = document.getElementById( 'loading-label' );

function hideLoading() {

	if ( loadingEl ) {

		loadingEl.classList.add( 'hidden' );
		loadingEl.setAttribute( 'aria-busy', 'false' );

	}

}

if ( loadingBar ) loadingBar.style.width = '100%';
if ( loadingLabel ) loadingLabel.textContent = 'Mode leger';

document.body.classList.add( 'lite-mode' );

const emptyStats = () => ( {
	active: false,
	elapsed: 0,
	collisions: 0,
	completedLaps: 0,
	lapCompleted: 0,
	lastLapTime: 0,
	currentLapTime: 0,
	speed: 0,
	normalizedSpeed: 0,
	driftIntensity: 0,
	onFinishLine: false,
	wallDistance: 0,
	collision: false,
} );

window.RacingGame = {
	...( window.RacingGame || {} ),
	resetVehicle() {},
	resetRun() {},
	getRunStats: emptyStats,
	onRunStart() {},
	onRunEnd: emptyStats,
};

hideLoading();
