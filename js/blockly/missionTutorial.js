function tutorial( goal, steps, validate, { intro = '', tip = '' } = {} ) {

	return {
		intro,
		goal,
		steps: Array.isArray( steps ) ? steps : [ steps ],
		tip,
		validate,
	};

}

const BLOCK_LABELS = {
	racing_drive: 'avancer',
	racing_turn: 'tourner',
	racing_wait: 'attendre',
	controls_repeat_ext: 'repeter',
	racing_if: 'si / alors',
	racing_sensor_wall_distance: 'capteur mur devant',
	racing_sensor_on_finish: 'capteur sur arrivee',
	racing_sensor_collision: 'capteur collision',
};

function formatRequiredBlocks( blocks ) {

	return blocks.map( ( id ) => BLOCK_LABELS[ id ] || id ).join( ', ' );

}

export function formatSuccessCriteria( targets = {} ) {

	const parts = [];

	if ( targets.completedLaps ) {

		parts.push( `boucler le circuit ${ targets.completedLaps } fois` );

	}

	if ( targets.maxCollisions === 0 ) {

		parts.push( 'sans aucune collision' );

	} else if ( targets.maxCollisions !== undefined ) {

		parts.push( `avec ${ targets.maxCollisions } collision${ targets.maxCollisions > 1 ? 's' : '' } maximum` );

	}

	if ( targets.maxTime !== undefined ) {

		parts.push( `en moins de ${ targets.maxTime } secondes` );

	}

	if ( targets.maxBlocks !== undefined ) {

		parts.push( `avec ${ targets.maxBlocks } blocs ou moins` );

	}

	if ( targets.requiredBlocks?.length ) {

		parts.push( `en utilisant : ${ formatRequiredBlocks( targets.requiredBlocks ) }` );

	}

	if ( parts.length === 0 ) {

		return 'terminer le programme sans erreur';

	}

	return parts.join( ', ' );

}

const TUTORIALS = {
	intro1: tutorial(
		'Envoyer une premiere commande a la voiture.',
		[
			'Ouvre la palette a gauche et repere le bloc avancer.',
			'Glisse avancer et accroche-le sous quand demarrer.',
			'Appuie sur Executer (bouton vert) et observe le deplacement.',
		],
		'Programme termine avec le bloc avancer.',
		{
			intro: 'Bienvenue ! Tu vas programmer la voiture comme un vrai robot, bloc par bloc.',
			tip: 'Seul quand demarrer est deja sur la zone : le reste, c est toi qui le construis.',
		},
	),
	intro2: tutorial(
		'Repete une action sans copier les blocs.',
		[
			'Ouvre la categorie Boucles dans la palette.',
			'Place repeter sous quand demarrer, puis mets avancer a l interieur.',
			'Change le nombre de repetitions (3 ou 4) et lance le programme.',
		],
		'Programme avec repeter et avancer.',
		{
			intro: 'Les boucles raccourcissent le code : une action peut etre jouee plusieurs fois.',
			tip: 'Compte combien de cases la voiture avance a chaque execution.',
		},
	),
	intro3: tutorial(
		'Combiner avancer et tourner pour changer de direction.',
		[
			'Ajoute tourner a gauche ou a droite apres une ou deux avancees.',
			'Observe ou la voiture quitte la piste : c est la qu il faut tourner plus tot.',
			'Relance le programme apres chaque petit ajustement.',
		],
		'Programme contenant le bloc tourner.',
		{
			intro: 'Sur un circuit, avancer seul ne suffit pas : il faut anticiper les virages.',
			tip: 'Un virage court et tot vaut mieux qu un long virage tardif.',
		},
	),
	intro4: tutorial(
		'Introduire une pause entre deux actions.',
		[
			'Insere attendre entre deux blocs de conduite.',
			'Commence avec 300 ms : la voiture a le temps de se stabiliser.',
			'Compare le trajet avec et sans pause.',
		],
		'Programme contenant le bloc attendre.',
		{
			intro: 'Le temps compte en robotique : une courte pause evite les mouvements brusques.',
			tip: 'Utile juste avant un virage serre ou apres une serie d avancees.',
		},
	),
	level1: tutorial(
		'Reussir un tour complet du circuit.',
		[
			'Construis une suite d avancees et de virages qui suit la piste.',
			'Surveille le compteur LAP en haut a gauche : il doit passer a 1.',
			'Si la voiture sort, ajoute un virage ou une avancee au bon endroit.',
		],
		'Boucler le circuit 1 fois (quelques collisions sont autorisees).',
		{
			intro: 'Premiere vraie course : l objectif est de revenir au point de depart.',
			tip: 'Decompose le circuit en troncons : ligne droite, virage, ligne droite…',
		},
	),
	level2: tutorial(
		'Finir un tour sans toucher les murs.',
		[
			'Repere les zones ou la voiture heurte les bordures.',
			'Tourne un peu plus tot avant chaque courbe.',
			'Evite les longues series d avancer vers un mur visible.',
		],
		'1 tour complet sans collision.',
		{
			intro: 'La precision compte : chaque choc est comptabilise.',
			tip: 'Le panneau Capteurs affiche Collision : oui apres un choc.',
		},
	),
	level3: tutorial(
		'Aller vite avec un programme court.',
		[
			'Utilise repeter pour eviter les blocs en double.',
			'Supprime les pauses inutiles et les actions redondantes.',
			'Chronometre-toi : le tour doit rester sous 20 secondes.',
		],
		'1 tour en moins de 20 s avec 10 blocs maximum.',
		{
			intro: 'Un bon programme est efficace : peu de blocs, meme resultat.',
			tip: 'Compte tes blocs dans la zone de travail avant de lancer.',
		},
	),
	sensor1: tutorial(
		'Lire la distance au mur devant la voiture.',
		[
			'Passe en mode Simulateur (pas le robot Sparki physique).',
			'Place le capteur mur devant dans la condition d un bloc si.',
			'Regarde le panneau Capteurs en bas a gauche pendant l execution.',
		],
		'Programme avec si et capteur mur devant.',
		{
			intro: 'Les capteurs permettent a la voiture de « voir » son environnement.',
			tip: 'La valeur mur devant baisse quand tu approches d un bord ou d un virage.',
		},
	),
	level4: tutorial(
		'Piloter avec le capteur mur pour finir un tour.',
		[
			'Utilise une boucle repeter avec un si a l interieur.',
			'Compare mur devant a un seuil : tourne si trop proche, sinon avance.',
			'Ajuste le seuil et le nombre de repetitions selon le trajet.',
		],
		'1 tour complet avec si + capteur mur (3 collisions max).',
		{
			intro: 'Tu passes de la programmation fixe a la programmation reactive.',
			tip: 'Teste plusieurs seuils entre 8 et 12 en observant le panneau Capteurs.',
		},
	),
	sensor2: tutorial(
		'Detecter la ligne d arrivee.',
		[
			'Le capteur sur arrivee devient vrai pres de la ligne de depart.',
			'Insere-le dans la condition d un bloc si.',
			'Choisis une action differente dans alors et sinon.',
		],
		'Programme avec si et capteur sur arrivee.',
		{
			intro: 'La voiture peut savoir quand elle revient au point de depart.',
			tip: 'Passe pres de la ligne d arrivee en mode manuel pour voir le capteur changer.',
		},
	),
	level5: tutorial(
		'Adapter le trajet quand la voiture approche de l arrivee.',
		[
			'Combine une boucle, le capteur sur arrivee et des actions de conduite.',
			'Quand le capteur est vrai, change de comportement (tourner, stopper…).',
			'Vise un tour complet en t adaptant au circuit.',
		],
		'1 tour complet avec si + capteur sur arrivee.',
		{
			intro: 'Tu lies detection et action pour boucler le circuit intelligemment.',
			tip: 'Observe le compteur de tours pendant que tu ajustes ton programme.',
		},
	),
	sensor3: tutorial(
		'Reagir a une collision detectee.',
		[
			'Le capteur collision devient vrai juste apres un choc.',
			'Place-le dans un si avec des actions differentes dans alors et sinon.',
			'Teste en mode Simulateur en heurtant volontairement un mur.',
		],
		'Programme avec si et capteur collision.',
		{
			intro: 'Un robot robuste detecte ses erreurs et peut corriger sa trajectoire.',
			tip: 'Le capteur reste vrai seulement un court instant apres le choc.',
		},
	),
	level6: tutorial(
		'Corriger automatiquement apres un choc et boucler le circuit.',
		[
			'Dans une boucle, teste si collision est vrai.',
			'Apres un choc : stop, courte pause, puis tourne et repars.',
			'Sinon, continue d avancer normalement.',
		],
		'1 tour complet avec si + capteur collision.',
		{
			intro: 'Tu construis un comportement de secours, comme sur un vrai robot.',
			tip: 'Une pause de quelques centaines de ms aide la voiture a se stabiliser.',
		},
	),
	level7: tutorial(
		'Sauvegarder et partager ton programme.',
		[
			'Construis un programme qui boucle le circuit.',
			'Utilise Sauvegarder pour conserver ton travail dans le navigateur.',
			'Clique Partager pour copier un lien vers ton programme.',
		],
		'1 tour complet puis partage du programme.',
		{
			intro: 'Derniere etape : montrer ton travail a un camarade ou a l enseignant.',
			tip: 'Le lien partage recharge la mission et tes blocs automatiquement.',
		},
	),
};

export function getMissionTutorial( challenge ) {

	const custom = challenge.tutorial || TUTORIALS[ challenge.id ];

	if ( custom ) return custom;

	return tutorial(
		challenge.description,
		[ 'Modifie les blocs dans la zone de travail.', 'Appuie sur Executer pour tester.', 'Ajuste jusqu a valider la mission.' ],
		formatSuccessCriteria( challenge.targets ),
		{ intro: challenge.description },
	);

}

export function renderTutorialHtml( challenge ) {

	const data = getMissionTutorial( challenge );
	const steps = data.steps.map( ( step ) => `<li>${ step }</li>` ).join( '' );

	return `
		${ data.intro ? `<p class="mission-tutorial-intro">${ data.intro }</p>` : '' }
		<p class="mission-tutorial-section">But</p>
		<p class="mission-tutorial-goal">${ data.goal }</p>
		<p class="mission-tutorial-section">Comment faire</p>
		<ol class="mission-tutorial-steps">${ steps }</ol>
		${ data.tip ? `<p class="mission-tutorial-tip"><span>Astuce</span> ${ data.tip }</p>` : '' }
		<p class="mission-tutorial-validate"><span>Reussite</span> ${ data.validate }</p>
	`;

}
