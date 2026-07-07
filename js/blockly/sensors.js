export function createSensorApi() {

	function stats() {

		return window.RacingGame?.getRunStats?.() || {};

	}

	return {
		speed: () => stats().normalizedSpeed || 0,
		time: () => stats().elapsed || 0,
		wallDistance: () => stats().wallDistance ?? 999,
		onFinish: () => Boolean( stats().onFinishLine ),
		drifting: () => ( stats().driftIntensity || 0 ) > 0.7,
		collision: () => Boolean( stats().collision ),
	};

}
