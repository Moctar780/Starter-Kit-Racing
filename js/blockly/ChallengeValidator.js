const STORAGE_KEY = 'racing.blockly.progress.v1';

function loadProgress() {

	try {

		return JSON.parse( localStorage.getItem( STORAGE_KEY ) ) || { completed: [], stars: {} };

	} catch {

		return { completed: [], stars: {} };

	}

}

function saveProgress( progress ) {

	localStorage.setItem( STORAGE_KEY, JSON.stringify( progress ) );

}

function hasRequiredBlocks( requiredBlocks, usedBlocks ) {

	if ( ! requiredBlocks || requiredBlocks.length === 0 ) return true;
	return requiredBlocks.every( ( type ) => usedBlocks.includes( type ) );

}

export class ChallengeValidator {

	constructor() {

		this.progress = loadProgress();

	}

	validate( challenge, stats, programInfo ) {

		const targets = challenge.targets || {};
		const completedLaps = stats.completedLaps || stats.lapCompleted || 0;
		const lapTime = stats.lastLapTime ?? stats.elapsed;
		const usedBlocks = programInfo.usedBlocks || [];

		const checks = [
			completedLaps >= ( targets.completedLaps || 0 ),
			targets.maxCollisions === undefined || stats.collisions <= targets.maxCollisions,
			targets.maxTime === undefined || lapTime <= targets.maxTime,
			targets.maxBlocks === undefined || programInfo.blockCount <= targets.maxBlocks,
			hasRequiredBlocks( targets.requiredBlocks, usedBlocks ),
		];

		const success = checks.every( Boolean );
		let stars = 0;
		const wasCompleted = this.progress.completed.includes( challenge.id );
		const previousStars = this.progress.stars[ challenge.id ] || 0;

		if ( success ) {

			stars = 1;
			if ( stats.collisions === 0 ) stars ++;
			if ( targets.maxTime === undefined || lapTime <= targets.maxTime ) stars ++;

		}

		const message = this.getMessage( challenge, stats, programInfo, success );

		if ( success ) this.recordSuccess( challenge.id, stars );

		const celebrate = success && ( ! wasCompleted || stars > previousStars );

		return { success, stars, message, celebrate };

	}

	getMessage( challenge, stats, programInfo, success ) {

		const targets = challenge.targets || {};

		if ( success ) {

			if ( ! targets.completedLaps ) {

				return `Bravo ! Programme termine avec ${ programInfo.blockCount } blocs.`;

			}

			return `Mission reussie en ${ stats.elapsed.toFixed( 1 ) } s avec ${ programInfo.blockCount } blocs.`;

		}

		if ( ( stats.completedLaps || 0 ) < ( targets.completedLaps || 0 ) ) {

			return 'Programme termine, mais la voiture n a pas encore boucle le circuit.';

		}

		if ( targets.maxCollisions !== undefined && stats.collisions > targets.maxCollisions ) {

			return 'Trop de collisions. Essaie un virage plus tot ou une vitesse plus faible.';

		}

		if ( targets.maxTime !== undefined && stats.elapsed > targets.maxTime ) {

			return 'Le trajet fonctionne, mais il est trop lent. Cherche les actions inutiles.';

		}

		if ( targets.maxBlocks !== undefined && programInfo.blockCount > targets.maxBlocks ) {

			return 'Le programme est correct, mais il utilise trop de blocs. Essaie une boucle.';

		}

		if ( ! hasRequiredBlocks( targets.requiredBlocks, programInfo.usedBlocks ) ) {

			if ( targets.requiredBlocks?.includes( 'racing_sensor_wall_distance' ) ) {

				return 'Utilise le capteur distance au mur dans un bloc si.';

			}

			if ( targets.requiredBlocks?.includes( 'racing_sensor_on_finish' ) ) {

				return 'Utilise le capteur sur arrivee dans un bloc si.';

			}

			if ( targets.requiredBlocks?.includes( 'racing_sensor_collision' ) ) {

				return 'Utilise le capteur collision dans un bloc si.';

			}

			return 'Cette mission demande d utiliser un bloc si / alors (racing_if).';

		}

		return 'Observe le trajet, puis ajuste les durees petit a petit.';

	}

	recordSuccess( id, stars ) {

		if ( ! this.progress.completed.includes( id ) ) this.progress.completed.push( id );
		this.progress.stars[ id ] = Math.max( this.progress.stars[ id ] || 0, stars );
		saveProgress( this.progress );

	}

	getProgress() {

		return this.progress;

	}

}
