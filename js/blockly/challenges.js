const allBlocks = [
	'racing_when_run',
	'racing_drive',
	'racing_turn',
	'racing_stop',
	'racing_wait',
	'controls_repeat_ext',
	'controls_if',
	'racing_if',
	'logic_compare',
	'logic_boolean',
	'math_number',
	'math_arithmetic',
	'variables_get',
	'variables_set',
	'racing_sensor_speed',
	'racing_sensor_time',
	'racing_sensor_wall_distance',
	'racing_sensor_on_finish',
	'racing_sensor_drifting',
	'racing_sensor_collision',
];

function program( block ) {

	return {
		blocks: {
			languageVersion: 0,
			blocks: [ block ],
		},
	};

}

function chain( blocks ) {

	for ( let i = 0; i < blocks.length - 1; i ++ ) {

		blocks[ i ].next = { block: blocks[ i + 1 ] };

	}

	return blocks[ 0 ];

}

function whenRun( firstBlock ) {

	return {
		type: 'racing_when_run',
		x: 32,
		y: 32,
		inputs: firstBlock ? { DO: { block: firstBlock } } : {},
	};

}

const emptyStarter = program( whenRun() );

function drive( dir = 'FORWARD' ) {

	return { type: 'racing_drive', fields: { DIR: dir } };

}

function turn( dir ) {

	return { type: 'racing_turn', fields: { DIR: dir } };

}

function wait( ms ) {

	return { type: 'racing_wait', fields: { WAIT_MS: String( ms ) } };

}

function repeat( times, blocks ) {

	return {
		type: 'controls_repeat_ext',
		inputs: {
			TIMES: {
				block: {
					type: 'math_number',
					fields: { NUM: times },
				},
			},
			DO: {
				block: chain( blocks ),
			},
		},
	};

}

function ifWall( threshold, thenBlocks, elseBlocks ) {

	return {
		type: 'racing_if',
		inputs: {
			IF0: {
				block: {
					type: 'logic_compare',
					fields: { OP: 'LT' },
					inputs: {
						A: { block: { type: 'racing_sensor_wall_distance' } },
						B: { block: { type: 'math_number', fields: { NUM: threshold } } },
					},
				},
			},
			DO0: { block: chain( thenBlocks ) },
			ELSE: { block: chain( elseBlocks ) },
		},
	};

}

function ifSensor( sensorType, thenBlocks, elseBlocks ) {

	return {
		type: 'racing_if',
		inputs: {
			IF0: { block: { type: sensorType } },
			DO0: { block: chain( thenBlocks ) },
			ELSE: { block: chain( elseBlocks ) },
		},
	};

}

const driveBlocks = [
	'racing_when_run', 'racing_drive', 'racing_wait', 'controls_repeat_ext', 'math_number',
];

const driveTurnBlocks = [
	...driveBlocks, 'racing_turn', 'racing_stop',
];

const sensorBlocks = [
	...driveTurnBlocks,
	'racing_if', 'logic_compare', 'logic_boolean', 'math_arithmetic',
	'racing_sensor_speed', 'racing_sensor_time', 'racing_sensor_wall_distance',
	'racing_sensor_on_finish', 'racing_sensor_drifting', 'racing_sensor_collision',
];

export const challenges = [
	{
		id: 'intro1',
		title: '1. Demarrage',
		description: 'Glisse avancer sous quand demarrer, puis appuie sur Executer.',
		allowedBlocks: [ 'racing_when_run', 'racing_drive' ],
		starterProgram: emptyStarter,
		targets: { requiredBlocks: [ 'racing_drive' ] },
	},
	{
		id: 'intro2',
		title: '2. Repeter',
		description: 'Utilise repeter pour enchainer plusieurs avancees.',
		allowedBlocks: driveBlocks,
		starterProgram: emptyStarter,
		targets: { requiredBlocks: [ 'controls_repeat_ext', 'racing_drive' ] },
	},
	{
		id: 'intro3',
		title: '3. Tourner',
		description: 'Avance puis tourne : tu apprends a diriger la voiture.',
		allowedBlocks: driveTurnBlocks,
		starterProgram: emptyStarter,
		targets: { requiredBlocks: [ 'racing_turn' ] },
	},
	{
		id: 'intro4',
		title: '4. Attendre',
		description: 'Ajoute une pause entre deux actions avec attendre.',
		allowedBlocks: driveTurnBlocks,
		starterProgram: emptyStarter,
		targets: { requiredBlocks: [ 'racing_wait' ] },
	},
	{
		id: 'level1',
		title: '5. Premier tour',
		description: 'Fais boucler la voiture une fois sur le circuit.',
		allowedBlocks: driveTurnBlocks,
		starterProgram: emptyStarter,
		targets: { completedLaps: 1, maxCollisions: 6 },
	},
	{
		id: 'level2',
		title: '6. Virage propre',
		description: 'Termine un tour sans collision avec les murs.',
		allowedBlocks: driveTurnBlocks,
		starterProgram: emptyStarter,
		targets: { completedLaps: 1, maxCollisions: 0 },
	},
	{
		id: 'level3',
		title: '7. Rapide et court',
		description: 'Termine un tour en moins de 20 secondes avec 10 blocs ou moins.',
		allowedBlocks: driveTurnBlocks,
		starterProgram: emptyStarter,
		targets: { completedLaps: 1, maxTime: 20, maxBlocks: 10 },
	},
	{
		id: 'sensor1',
		title: '8. Lire le mur',
		description: 'Decouvre le capteur distance au mur. Construis ton programme toi-meme.',
		allowedBlocks: sensorBlocks,
		requiresSimulator: true,
		starterProgram: emptyStarter,
		targets: { requiredBlocks: [ 'racing_if', 'racing_sensor_wall_distance' ] },
	},
	{
		id: 'level4',
		title: '9. Eviter les murs',
		description: 'Utilise le capteur mur dans un si pour tourner avant le bord et finir un tour.',
		allowedBlocks: allBlocks,
		requiresSimulator: true,
		starterProgram: emptyStarter,
		targets: { completedLaps: 1, maxCollisions: 3, requiredBlocks: [ 'racing_if', 'racing_sensor_wall_distance' ] },
	},
	{
		id: 'sensor2',
		title: '10. Ligne d arrivee',
		description: 'Decouvre le capteur sur arrivee dans un bloc si.',
		allowedBlocks: allBlocks,
		requiresSimulator: true,
		starterProgram: emptyStarter,
		targets: { requiredBlocks: [ 'racing_if', 'racing_sensor_on_finish' ] },
	},
	{
		id: 'level5',
		title: '11. Boucle arrivee',
		description: 'Detecte la ligne d arrivee avec un capteur et boucle le circuit.',
		allowedBlocks: allBlocks,
		requiresSimulator: true,
		starterProgram: emptyStarter,
		targets: { completedLaps: 1, requiredBlocks: [ 'racing_if', 'racing_sensor_on_finish' ] },
	},
	{
		id: 'sensor3',
		title: '12. Collision',
		description: 'Decouvre le capteur collision dans un bloc si.',
		allowedBlocks: allBlocks,
		requiresSimulator: true,
		starterProgram: emptyStarter,
		targets: { requiredBlocks: [ 'racing_if', 'racing_sensor_collision' ] },
	},
	{
		id: 'level6',
		title: '13. Reaction collision',
		description: 'Reagis apres une collision : stop puis repars prudemment et boucle le circuit.',
		allowedBlocks: allBlocks,
		requiresSimulator: true,
		starterProgram: emptyStarter,
		targets: { completedLaps: 1, requiredBlocks: [ 'racing_if', 'racing_sensor_collision' ] },
	},
	{
		id: 'level7',
		title: '14. Programme partageable',
		description: 'Cree un programme complet, sauvegarde-le et partage-le avec le lien.',
		allowedBlocks: allBlocks,
		starterProgram: emptyStarter,
		targets: { completedLaps: 1 },
	},
];

export function getChallenge( id ) {

	return challenges.find( ( challenge ) => challenge.id === id ) || challenges[ 0 ];

}
