const BLOCKS = [
	{
		type: 'racing_when_run',
		message0: 'quand demarrer %1 %2',
		args0: [
			{ type: 'input_dummy' },
			{ type: 'input_statement', name: 'DO', check: 'RacingAction' },
		],
		colour: 120,
		hat: 'cap',
		tooltip: 'Point de depart du programme.',
		helpUrl: '',
	},
	{
		type: 'racing_drive',
		message0: '%1',
		args0: [
			{
				type: 'field_dropdown',
				name: 'DIR',
				options: [
					[ 'avancer', 'FORWARD' ],
					[ 'reculer', 'BACKWARD' ],
				],
			},
		],
		previousStatement: 'RacingAction',
		nextStatement: 'RacingAction',
		colour: 210,
		tooltip: 'Effectue un pas avant ou arriere.',
		helpUrl: '',
	},
	{
		type: 'racing_turn',
		message0: 'tourner %1',
		args0: [
			{
				type: 'field_dropdown',
				name: 'DIR',
				options: [
					[ 'a gauche', 'LEFT' ],
					[ 'a droite', 'RIGHT' ],
				],
			},
		],
		previousStatement: 'RacingAction',
		nextStatement: 'RacingAction',
		colour: 210,
		tooltip: 'Effectue un pas de rotation sans acceleration.',
		helpUrl: '',
	},
	{
		type: 'racing_wait',
		message0: 'attendre %1 ms',
		args0: [
			{ type: 'field_number', name: 'WAIT_MS', value: 1000, min: 0, max: 99999, precision: 50 },
		],
		previousStatement: 'RacingAction',
		nextStatement: 'RacingAction',
		colour: 45,
		tooltip: 'Attend sans envoyer de commande.',
		helpUrl: '',
	},
	{
		type: 'racing_stop',
		message0: 'stop',
		previousStatement: 'RacingAction',
		nextStatement: 'RacingAction',
		colour: 0,
		tooltip: 'Arrete le robot ou freine le simulateur.',
		helpUrl: '',
	},
	{
		type: 'racing_gripper',
		message0: 'pince %1',
		args0: [
			{
				type: 'field_dropdown',
				name: 'ACTION',
				options: [
					[ 'ouvrir', 'OPEN' ],
					[ 'fermer', 'CLOSE' ],
				],
			},
		],
		previousStatement: 'RacingAction',
		nextStatement: 'RacingAction',
		colour: 45,
		tooltip: 'Ouvre ou ferme la pince du Sparki.',
		helpUrl: '',
	},
	{
		type: 'racing_if',
		message0: 'si %1',
		args0: [
			{ type: 'input_value', name: 'IF0', check: 'Boolean' },
		],
		message1: 'alors %1',
		args1: [
			{ type: 'input_statement', name: 'DO0', check: 'RacingAction' },
		],
		message2: 'sinon %1',
		args2: [
			{ type: 'input_statement', name: 'ELSE', check: 'RacingAction' },
		],
		previousStatement: 'RacingAction',
		nextStatement: 'RacingAction',
		colour: 120,
		tooltip: 'Capteur ou comparaison dans si. Blocs avancer/tourner dans alors ou sinon.',
		helpUrl: '',
	},
	{
		type: 'racing_sensor_speed',
		message0: 'vitesse',
		output: 'Number',
		colour: 260,
		tooltip: 'Renvoie la vitesse actuelle entre 0 et 1.',
		helpUrl: '',
	},
	{
		type: 'racing_sensor_time',
		message0: 'temps ecoule',
		output: 'Number',
		colour: 260,
		tooltip: 'Renvoie le temps ecoule depuis le lancement du programme.',
		helpUrl: '',
	},
	{
		type: 'racing_sensor_wall_distance',
		message0: 'distance au mur devant',
		output: 'Number',
		colour: 260,
		tooltip: 'Distance estimee au bord devant le vehicule. Seuil conseille : 8 a 12.',
		helpUrl: '',
	},
	{
		type: 'racing_sensor_on_finish',
		message0: 'sur arrivee',
		output: 'Boolean',
		colour: 260,
		tooltip: 'Vrai quand la voiture est proche de la ligne d arrivee.',
		helpUrl: '',
	},
	{
		type: 'racing_sensor_drifting',
		message0: 'derape',
		output: 'Boolean',
		colour: 260,
		tooltip: 'Vrai quand la voiture derape fortement.',
		helpUrl: '',
	},
	{
		type: 'racing_sensor_collision',
		message0: 'collision',
		output: 'Boolean',
		colour: 260,
		tooltip: 'Vrai juste apres une collision.',
		helpUrl: '',
	},
];

export function registerRacingBlocks( Blockly ) {

	const defineBlocks = Blockly.defineBlocksWithJsonArray || Blockly.common?.defineBlocksWithJsonArray;

	if ( ! defineBlocks ) {

		throw new Error( 'Blockly block JSON registration API is unavailable.' );

	}

	defineBlocks.call( Blockly, BLOCKS );

}
