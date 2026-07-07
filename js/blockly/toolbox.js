export const ESSENTIAL_BLOCKS = [
	'racing_when_run',
	'racing_drive',
	'racing_turn',
	'racing_stop',
	'racing_wait',
	'racing_gripper',
	'controls_repeat_ext',
	'math_number',
];

const essentialCategories = [
	{
		kind: 'category',
		name: 'Programme',
		colour: '210',
		contents: [
			{ kind: 'block', type: 'racing_when_run' },
			{ kind: 'block', type: 'racing_drive' },
			{ kind: 'block', type: 'racing_turn' },
			{ kind: 'block', type: 'racing_stop' },
			{ kind: 'block', type: 'racing_wait' },
			{ kind: 'block', type: 'racing_gripper' },
			{
				kind: 'block',
				type: 'controls_repeat_ext',
				inputs: {
					TIMES: {
						block: {
							type: 'math_number',
							fields: { NUM: 3 },
						},
					},
				},
			},
			{ kind: 'block', type: 'math_number' },
		],
	},
];

const categories = [
	{
		kind: 'category',
		name: 'Conduite',
		colour: '210',
		contents: [
			{ kind: 'block', type: 'racing_when_run' },
			{ kind: 'block', type: 'racing_drive' },
			{ kind: 'block', type: 'racing_turn' },
			{ kind: 'block', type: 'racing_stop' },
			{ kind: 'block', type: 'racing_wait' },
		],
	},
	{
		kind: 'category',
		name: 'Boucles',
		colour: '120',
		contents: [
			{
				kind: 'block',
				type: 'controls_repeat_ext',
				inputs: {
					TIMES: {
						block: {
							type: 'math_number',
							fields: { NUM: 3 },
						},
					},
				},
			},
		],
	},
	{
		kind: 'category',
		name: 'Logique',
		colour: '120',
		contents: [
			{
				kind: 'block',
				type: 'racing_if',
				inputs: {
					IF0: {
						block: {
							type: 'logic_compare',
							fields: { OP: 'LT' },
							inputs: {
								A: { block: { type: 'racing_sensor_wall_distance' } },
								B: { block: { type: 'math_number', fields: { NUM: 5 } } },
							},
						},
					},
					DO0: { block: { type: 'racing_turn', fields: { DIR: 'RIGHT' } } },
					ELSE: { block: { type: 'racing_drive', fields: { DIR: 'FORWARD' } } },
				},
			},
			{ kind: 'block', type: 'racing_if' },
			{ kind: 'block', type: 'logic_compare' },
			{ kind: 'block', type: 'logic_boolean' },
		],
	},
	{
		kind: 'category',
		name: 'Capteurs',
		colour: '260',
		contents: [
			{ kind: 'block', type: 'racing_sensor_speed' },
			{ kind: 'block', type: 'racing_sensor_time' },
			{ kind: 'block', type: 'racing_sensor_wall_distance' },
			{ kind: 'block', type: 'racing_sensor_on_finish' },
			{ kind: 'block', type: 'racing_sensor_drifting' },
			{ kind: 'block', type: 'racing_sensor_collision' },
		],
	},
	{
		kind: 'category',
		name: 'Nombres',
		colour: '230',
		contents: [
			{ kind: 'block', type: 'math_number' },
			{ kind: 'block', type: 'math_arithmetic' },
		],
	},
	{
		kind: 'category',
		name: 'Variables',
		colour: '330',
		custom: 'VARIABLE',
	},
	{
		kind: 'category',
		name: 'Fonctions',
		colour: '290',
		custom: 'PROCEDURE',
	},
];

function filterCategory( category, allowed ) {

	if ( category.custom ) return allowed.has( 'variables_get' ) || allowed.has( 'variables_set' ) ? category : null;

	const contents = category.contents.filter( ( item ) => allowed.has( item.type ) );
	if ( contents.length === 0 ) return null;

	return { ...category, contents };

}

export function buildEssentialToolbox() {

	return { kind: 'categoryToolbox', contents: essentialCategories };

}

export function buildToolbox( allowedBlocks = null ) {

	if ( ! allowedBlocks ) return buildEssentialToolbox();

	const allowed = new Set( allowedBlocks );
	return {
		kind: 'categoryToolbox',
		contents: categories.map( ( category ) => filterCategory( category, allowed ) ).filter( Boolean ),
	};

}

export const toolbox = buildEssentialToolbox();

export const emptyProgram = {
	blocks: {
		languageVersion: 0,
		blocks: [
			{
				type: 'racing_when_run',
				x: 32,
				y: 32,
			},
		],
	},
};

export const starterProgram = emptyProgram;

export const initialProgram = emptyProgram;
