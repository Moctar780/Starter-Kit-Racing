import { BlocklyControls } from './BlocklyControls.js';
import { initPanelDrag, applyMobilePanelLayout } from './panelDrag.js';
import { registerRacingBlocks } from './blocks.js';
import { SparkiPanel } from './SparkiPanel.js';
import { MissionPanel } from './MissionPanel.js';
import { ChallengeValidator } from './ChallengeValidator.js';
import { challenges, getChallenge } from './challenges.js';
import { buildEssentialToolbox, buildToolbox, emptyProgram } from './toolbox.js';
import { encodeProgram, decodeProgram } from './programCodec.js';
import { getDeviceProfile, getCompatBannerMessage } from '../deviceCompat.js';
import { sparkiBridge } from './sparkiBridge.js';
import { SensorHud } from './SensorHud.js';

const STORAGE_KEY = 'racing.blockly.workspace.discrete.v1';
const MISSION_KEY = 'racing.blockly.mission.v1';

function waitForBlockly() {

	return new Promise( ( resolve, reject ) => {

		const started = performance.now();

		function tick() {

			if ( window.Blockly?.Blocks?.controls_repeat_ext ) {

				resolve( window.Blockly );
				return;

			}

			if ( performance.now() - started > 10000 ) {

				reject( new Error( 'Blockly ne s est pas charge.' ) );
				return;

			}

			requestAnimationFrame( tick );

		}

		tick();

	} );

}

function setStatus( message ) {

	document.getElementById( 'blockly-status' ).textContent = message;

}

function saveWorkspace( Blockly, workspace ) {

	const state = Blockly.serialization.workspaces.save( workspace );
	localStorage.setItem( STORAGE_KEY, JSON.stringify( state ) );
	return state;

}

function loadSavedWorkspace() {

	try {

		const saved = localStorage.getItem( STORAGE_KEY );
		return saved ? JSON.parse( saved ) : null;

	} catch {

		return null;

	}

}

function hasRunnableProgram( workspace ) {

	const root = workspace.getTopBlocks( true ).find( ( block ) => block.type === 'racing_when_run' );
	return Boolean( root?.getInputTargetBlock( 'DO' ) );

}

async function initBlocklyPanel() {

	const deviceProfile = getDeviceProfile();
	const Blockly = await waitForBlockly();
	const panel = document.getElementById( 'blockly-panel' );
	const dragHandle = document.getElementById( 'blockly-drag-handle' );
	const toolbar = document.getElementById( 'blockly-toolbar' );

	const compatMessage = getCompatBannerMessage( deviceProfile );

	if ( compatMessage ) {

		const banner = document.createElement( 'div' );
		banner.id = 'compat-banner';
		banner.setAttribute( 'role', 'status' );
		banner.textContent = compatMessage;
		toolbar.parentNode.insertBefore( banner, toolbar );

	}

	initPanelDrag( panel, dragHandle );
	registerRacingBlocks( Blockly );

	const panelToggle = document.getElementById( 'blockly-panel-toggle' );

	function resizeWorkspace() {

		Blockly.svgResize( workspace );

	}

	function setPanelCollapsed( collapsed ) {

		panel.classList.toggle( 'collapsed', collapsed );

		if ( panelToggle ) {

			panelToggle.textContent = collapsed ? '▲' : '▼';
			panelToggle.setAttribute( 'aria-expanded', String( ! collapsed ) );
			panelToggle.setAttribute( 'aria-label', collapsed ? 'Deplier le panneau' : 'Replier le panneau' );

		}

		if ( collapsed ) {

			panel.style.height = 'auto';

		} else {

			applyMobilePanelLayout( panel );

		}

		requestAnimationFrame( resizeWorkspace );

	}

	panelToggle?.addEventListener( 'click', ( event ) => {

		event.stopPropagation();
		setPanelCollapsed( ! panel.classList.contains( 'collapsed' ) );

	} );

	const validator = new ChallengeValidator();
	const missionPanel = new MissionPanel( panel, challenges, validator );
	dragHandle.insertAdjacentElement( 'afterend', missionPanel.el );

	const sparkiPanel = new SparkiPanel( toolbar.parentNode, { liteMode: deviceProfile.liteMode } );
	toolbar.parentNode.insertBefore( sparkiPanel.el, toolbar );

	let highlightedBlock = null;
	let activeChallenge = null;
	let workspace = null;

	function refreshMissionOptions() {

		missionPanel.refreshSelectOptions();
		missionPanel.refreshCompletionBadge();

	}

	function simulatorRequiredForMission( challenge ) {

		return Boolean( challenge?.requiresSimulator );

	}

	function canUseMissionSensors() {

		return ! deviceProfile.liteMode && ! sparkiBridge.isRobotMode();

	}

	function applyChallenge( challenge, programState = null ) {

		activeChallenge = challenge;
		localStorage.setItem( MISSION_KEY, challenge.id );
		missionPanel.setChallenge( challenge );
		refreshMissionOptions();

		if ( challenge.allowedBlocks ) {

			workspace.updateToolbox( buildToolbox( challenge.allowedBlocks ) );

		} else {

			workspace.updateToolbox( buildEssentialToolbox() );

		}

		loadWorkspaceState( programState || challenge.starterProgram );
		virtualControls.stop();

		if ( simulatorRequiredForMission( challenge ) && ! canUseMissionSensors() ) {

			missionPanel.setResult(
				'Mission capteurs : activez le mode Simulateur (WebView recente requise).',
				false,
			);

		}

	}

	workspace = Blockly.inject( 'blockly-workspace', {
		toolbox: buildEssentialToolbox(),
		collapse: false,
		comments: false,
		disable: false,
		grid: {
			spacing: 24,
			length: 3,
			colour: '#d4d8df',
			snap: true,
		},
		media: 'node_modules/blockly/media/',
		renderer: 'zelos',
		scrollbars: true,
		sounds: false,
		trashcan: true,
		zoom: {
			controls: true,
			wheel: true,
			startScale: window.matchMedia( '(max-width: 800px)' ).matches ? 0.78 : 0.9,
			maxScale: 1.4,
			minScale: 0.5,
			scaleSpeed: 1.15,
		},
	} );

	function loadWorkspaceState( state ) {

		workspace.clear();

		try {

			Blockly.serialization.workspaces.load( state, workspace );

		} catch ( error ) {

			console.warn( 'Workspace load failed', error );
			Blockly.serialization.workspaces.load( emptyProgram, workspace );

		}

	}

	const bridge = window.RacingVirtualControls;
	const virtualControls = new BlocklyControls( bridge );
	const sensorHud = new SensorHud();
	let sensorHudFrame = null;

	function refreshSensorHud() {

		if ( ! canUseMissionSensors() ) {

			sensorHud.hide();
			return;

		}

		sensorHud.update(
			window.RacingGame?.getRunStats?.(),
			{ running: virtualControls.active },
		);

	}

	function startSensorHudLoop() {

		if ( sensorHudFrame ) return;

		const tick = () => {

			refreshSensorHud();
			sensorHudFrame = requestAnimationFrame( tick );

		};

		sensorHudFrame = requestAnimationFrame( tick );

	}

	const urlParams = new URLSearchParams( window.location.search );
	let sharedProgram = null;

	if ( urlParams.get( 'program' ) ) {

		try {

			sharedProgram = decodeProgram( urlParams.get( 'program' ) );

		} catch ( error ) {

			console.warn( 'Programme partage invalide', error );

		}

	}

	const missionId = urlParams.get( 'mission' )
		|| localStorage.getItem( MISSION_KEY )
		|| challenges[ 0 ].id;

	applyChallenge( getChallenge( missionId ), sharedProgram );

	missionPanel.onSelect = ( id ) => applyChallenge( getChallenge( id ) );
	missionPanel.onShare = async () => {

		saveWorkspace( Blockly, workspace );
		const encoded = encodeProgram( Blockly.serialization.workspaces.save( workspace ) );
		const url = new URL( window.location.href );
		url.searchParams.set( 'program', encoded );
		url.searchParams.set( 'mission', activeChallenge?.id || challenges[ 0 ].id );

		try {

			await navigator.clipboard.writeText( url.toString() );
			missionPanel.setResult( 'Lien copie dans le presse-papiers.', null );

		} catch {

			missionPanel.setResult( url.toString(), null );

		}

	};

	sparkiPanel.onModeChange = ( mode ) => {

		virtualControls.setMode( mode );
		sparkiPanel.refreshStatus();

		if ( activeChallenge && simulatorRequiredForMission( activeChallenge ) && ! canUseMissionSensors() ) {

			missionPanel.setResult(
				'Mission capteurs : activez le mode Simulateur (WebView recente requise).',
				false,
			);

		}

		refreshSensorHud();

	};

	const initialMode = deviceProfile.liteMode
		? 'robot'
		: ( window.SparkiBridge?.available
			? localStorage.getItem( 'racing.sparki.mode' ) || 'robot'
			: 'simulation' );
	virtualControls.setMode( initialMode );

	const runBtn = document.getElementById( 'blockly-run' );
	const stopBtn = document.getElementById( 'blockly-stop' );
	const saveBtn = document.getElementById( 'blockly-save' );
	const restoreBtn = document.getElementById( 'blockly-restore' );
	const clearBtn = document.getElementById( 'blockly-clear' );

	function highlightBlock( blockId ) {

		try {

			if ( highlightedBlock ) workspace.highlightBlock( highlightedBlock, false );
			highlightedBlock = blockId;
			if ( highlightedBlock ) workspace.highlightBlock( highlightedBlock, true );

		} catch ( e ) {

			console.warn( e );

		}

	}

	function beginRun() {

		if ( ! hasRunnableProgram( workspace ) ) {

			throw new Error( 'Ajoutez des blocs sous "quand demarrer".' );

		}

		if ( simulatorRequiredForMission( activeChallenge ) && ! canUseMissionSensors() ) {

			throw new Error( 'Capteurs indisponibles : utilisez le mode Simulateur.' );

		}

		saveWorkspace( Blockly, workspace );
		virtualControls.stop();

		if ( window.SparkiBridge?.isRobotMode?.() ) {

			window.SparkiBridge.ensureConnected();

		} else {

			window.RacingGame?.onRunStart?.();

		}

		const count = virtualControls.start( workspace, 'run' );
		setStatus( `${ count } action${ count > 1 ? 's' : '' }` );

	}

	function finishRun() {

		highlightBlock( null );
		const stats = window.RacingGame?.onRunEnd?.() || {};

		if ( activeChallenge && canUseMissionSensors() ) {

			const result = validator.validate(
				activeChallenge,
				stats,
				virtualControls.getProgramInfo(),
			);
			missionPanel.setResult( result.message, result.success, result.stars, {
				celebrate: result.celebrate,
			} );
			refreshMissionOptions();

		} else if ( activeChallenge?.requiresSimulator && ! canUseMissionSensors() ) {

			missionPanel.setResult( 'Validez cette mission en mode Simulateur.', false );

		}

		setStatus( 'Termine' );

	}

	virtualControls.onChange = ( state ) => {

		runBtn.disabled = state.active;
		stopBtn.disabled = ! state.active;

		if ( state.blockId ) highlightBlock( state.blockId );

		if ( state.active ) {

			const label = state.label ? ` · ${ state.label }` : '';
			setStatus( `${ state.index } / ${ state.total }${ label }` );

		} else {

			setStatus( 'Pret' );

		}

		refreshSensorHud();

	};

	virtualControls.onComplete = finishRun;

	runBtn.addEventListener( 'click', () => {

		try {

			beginRun();

		} catch ( e ) {

			setStatus( e.message );

		}

	} );

	stopBtn.addEventListener( 'click', () => {

		virtualControls.stop();
		window.RacingGame?.onRunEnd?.();
		highlightBlock( null );
		setStatus( 'Arrete' );

	} );

	saveBtn.addEventListener( 'click', () => {

		saveWorkspace( Blockly, workspace );
		setStatus( 'Programme sauvegarde' );

	} );

	restoreBtn.addEventListener( 'click', () => {

		const saved = loadSavedWorkspace();

		if ( ! saved ) {

			setStatus( 'Aucune sauvegarde trouvee' );
			return;

		}

		virtualControls.stop();
		loadWorkspaceState( saved );
		setStatus( 'Programme restaure' );

	} );

	clearBtn.addEventListener( 'click', () => {

		virtualControls.stop();
		window.RacingGame?.onRunEnd?.();
		highlightBlock( null );
		workspace.clear();
		saveWorkspace( Blockly, workspace );
		setStatus( 'Programme efface' );

	} );

	function resetRobot() {

		virtualControls.stop();
		window.RacingGame?.resetRun?.();
		window.RacingGame?.onRunEnd?.();
		highlightBlock( null );
		setStatus( 'Position initiale' );

	}

	document.getElementById( 'reset-btn' )?.addEventListener( 'click', resetRobot );

	window.addEventListener( 'keydown', ( event ) => {

		if ( event.key === 'Escape' ) {

			virtualControls.stop();
			window.RacingGame?.onRunEnd?.();

		}

	} );

	window.addEventListener( 'resize', () => {

		applyMobilePanelLayout( panel );
		resizeWorkspace();

	} );

	new ResizeObserver( () => resizeWorkspace() ).observe(
		document.getElementById( 'blockly-workspace' )
	);

	setStatus( 'Pret' );
	startSensorHudLoop();

}

initBlocklyPanel().catch( ( error ) => {

	console.error( error );
	setStatus( error.message );

} );
