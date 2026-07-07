import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { LightProbeGrid } from 'three/addons/lighting/LightProbeGrid.js';
import { createWorldSettings, createWorld, addBroadphaseLayer, addObjectLayer, enableCollision, registerAll, updateWorld, rigidBody, box, MotionType, castRay, createClosestCastRayCollector, createDefaultCastRaySettings, CastRayStatus, filter } from 'crashcat';
import { vec3 } from 'mathcat';
import { Vehicle, MAX_SPEED } from './Vehicle.js';
import { Camera } from './Camera.js';
import { Controls } from './Controls.js';
import { buildTrack, decodeCells, computeSpawnPosition, computeTrackBounds } from './Track.js';
import { buildWallColliders, createSphereBody } from './Physics.js';
import { SmokeTrails } from './Particles.js';
import { DriftMarks } from './DriftMarks.js';
import { GameAudio } from './Audio.js';
import { LapTimer } from './LapTimer.js';
import { ColorMapGLTFLoader } from './Loader.js';
import { getDeviceProfile } from './deviceCompat.js';


const deviceProfile = getDeviceProfile();
const isMobile = /Mobi|Android|iPhone|iPad|iPod|webOS/i.test( navigator.userAgent );
const QUALITY = deviceProfile.lowGpu ? 'low' : ( isMobile ? 'low' : 'high' );

const loadingEl = document.getElementById( 'loading' );
const loadingBar = document.getElementById( 'loading-bar' );
const loadingLabel = document.getElementById( 'loading-label' );
const virtualControls = window.RacingVirtualControls || null;

function setLoadingProgress( fraction, label ) {

	const clamped = THREE.MathUtils.clamp( fraction, 0, 1 );
	loadingBar.style.width = `${ clamped * 100 }%`;
	if ( label ) loadingLabel.textContent = label;

}

function hideLoading() {

	loadingEl.classList.add( 'hidden' );
	loadingEl.setAttribute( 'aria-busy', 'false' );

}

const rendererOptions = { antialias: QUALITY === 'high' };

if ( QUALITY === 'high' ) rendererOptions.outputBufferType = THREE.HalfFloatType;

const renderer = new THREE.WebGLRenderer( rendererOptions );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( Math.min( window.devicePixelRatio, deviceProfile.lowGpu ? 1 : ( isMobile ? 1.25 : 2 ) ) );
renderer.shadowMap.enabled = QUALITY === 'high';
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

if ( QUALITY === 'high' ) {

	const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ) );
	bloomPass.strength = 0.02;
	bloomPass.radius = 0.02;
	bloomPass.threshold = 0.5;

	renderer.setEffects( [ bloomPass ] );

}

document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xadb2ba );
scene.fog = new THREE.Fog( 0xadb2ba, 30, 55 );

const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
dirLight.position.set( 11.4, 15, -5.3 );
dirLight.castShadow = QUALITY === 'high';
dirLight.shadow.mapSize.setScalar( QUALITY === 'high' ? ( isMobile ? 1024 : 4096 ) : 512 );
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 60;
dirLight.shadow.radius = isMobile ? 1 : 4;
scene.add( dirLight );

const hemiLight = new THREE.HemisphereLight( 0xc8d8e8, 0x7a8a5a, 2 );
hemiLight.position.copy( dirLight.position );
scene.add( hemiLight );


window.addEventListener( 'resize', () => {

	renderer.setSize( window.innerWidth, window.innerHeight );

} );

const CORE_MODELS = [
	'vehicle-truck-yellow',
	'track-straight', 'track-corner', 'track-bump', 'track-finish',
	'decoration-empty', 'decoration-forest', 'decoration-tents',
];

const NPC_MODELS = [
	'vehicle-truck-green', 'vehicle-truck-purple', 'vehicle-truck-red',
];

const models = {};

const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = ( _url, loaded, total ) => {

	setLoadingProgress( 0.05 + ( loaded / total ) * 0.6, 'Loading models…' );

};

const loader = new ColorMapGLTFLoader( loadingManager );

function processModel( name, gltf ) {

	const meshes = [];
	gltf.scene.traverse( ( child ) => {

		if ( child.isMesh ) {

			child.material.side = THREE.FrontSide;
			meshes.push( child );

		}

	} );

	if ( name.startsWith( 'vehicle-' ) ) {

		gltf.scene.scale.setScalar( 0.5 );

	}

	if ( meshes.length === 1 ) {

		const mesh = meshes[ 0 ];
		mesh.removeFromParent();
		models[ name ] = mesh;

	} else {

		models[ name ] = gltf.scene;

	}

}

async function loadModels( names ) {

	const promises = names.map( ( name ) =>
		loader.loadAsync( `models/${ name }.glb` ).then( ( gltf ) => {

			processModel( name, gltf );

		} )
	);

	await Promise.all( promises );

}

function bakeLightProbes( bounds, hw, hd, groundSize ) {

	const probeHeight = 6;
	const probeRes = 4;
	const probes = new LightProbeGrid(
		hw * 2, probeHeight, hd * 2,
		Math.max( probeRes, Math.round( hw / 6 ) ),
		2,
		Math.max( probeRes, Math.round( hd / 6 ) ),
	);
	probes.position.set( bounds.centerX, probeHeight / 2, bounds.centerZ );
	probes.bake( renderer, scene, { cubemapSize: 32, near: 0.1, far: groundSize } );
	scene.add( probes );

}

let initPromise = null;

async function init() {

	if ( initPromise ) return initPromise;

	initPromise = initGame();
	return initPromise;

}

async function initGame() {

	setLoadingProgress( 0.02, 'Initializing…' );
	registerAll();

	const mapParam = new URLSearchParams( window.location.search ).get( 'map' );
	let customCells = null;
	let spawn = null;

	if ( mapParam ) {

		try {

			customCells = decodeCells( mapParam );
			spawn = computeSpawnPosition( customCells );

		} catch ( e ) {

			console.warn( 'Invalid map parameter, using default track' );

		}

	}

	const modelNames = customCells ? CORE_MODELS : CORE_MODELS.concat( NPC_MODELS );
	await loadModels( modelNames );

	setLoadingProgress( 0.7, 'Building track…' );

	const bounds = computeTrackBounds( customCells );
	const hw = bounds.halfWidth;
	const hd = bounds.halfDepth;
	const groundSize = Math.max( hw, hd ) * 2 + 20;

	const shadowExtent = Math.max( hw, hd ) + 10;
	dirLight.shadow.camera.left = - shadowExtent;
	dirLight.shadow.camera.right = shadowExtent;
	dirLight.shadow.camera.top = shadowExtent;
	dirLight.shadow.camera.bottom = - shadowExtent;
	dirLight.shadow.camera.updateProjectionMatrix();

	scene.fog.near = groundSize * 0.4;
	scene.fog.far = groundSize * 0.8;

	buildTrack( scene, models, customCells );

	setLoadingProgress( 0.82, 'Setting up physics…' );

	const worldSettings = createWorldSettings();
	worldSettings.gravity = [ 0, - 9.81, 0 ];

	const BPL_MOVING = addBroadphaseLayer( worldSettings );
	const BPL_STATIC = addBroadphaseLayer( worldSettings );
	const OL_MOVING = addObjectLayer( worldSettings, BPL_MOVING );
	const OL_STATIC = addObjectLayer( worldSettings, BPL_STATIC );

	enableCollision( worldSettings, OL_MOVING, OL_STATIC );
	enableCollision( worldSettings, OL_MOVING, OL_MOVING );

	const world = createWorld( worldSettings );
	world._OL_MOVING = OL_MOVING;
	world._OL_STATIC = OL_STATIC;

	buildWallColliders( world, null, customCells );

	const wallRayCollector = createClosestCastRayCollector();
	const wallRaySettings = createDefaultCastRaySettings();
	const wallRayFilter = filter.forWorld( world );
	filter.disableAllLayers( wallRayFilter, world.settings.layers );
	filter.enableObjectLayer( wallRayFilter, world.settings.layers, OL_STATIC );

	const _rayOrigin = vec3.create();
	const _rayDirection = vec3.create();
	const WALL_RAY_MAX = 30;
	const VEHICLE_RADIUS = 0.5;

	const roadHalf = groundSize / 2;
	rigidBody.create( world, {
		shape: box.create( { halfExtents: [ roadHalf, 0.01, roadHalf ] } ),
		motionType: MotionType.STATIC,
		objectLayer: OL_STATIC,
		position: [ bounds.centerX, - 0.125, bounds.centerZ ],
		friction: 5.0,
		restitution: 0.0,
	} );

	const sphereBody = createSphereBody( world, spawn ? spawn.position : null );

	const vehicle = new Vehicle();
	vehicle.rigidBody = sphereBody;
	vehicle.physicsWorld = world;

	if ( spawn ) {

		const [ sx, sy, sz ] = spawn.position;
		vehicle.spherePos.set( sx, sy, sz );
		vehicle.prevModelPos.set( sx, 0, sz );
		vehicle.container.rotation.y = spawn.angle;

	}

	const vehicleGroup = vehicle.init( models[ 'vehicle-truck-yellow' ] );
	scene.add( vehicleGroup );

	dirLight.target = vehicleGroup;

	const resetPosition = spawn ? spawn.position : [ 3.5, 0.5, 5 ];
	const resetAngle = spawn ? spawn.angle : 0;

	function resetVehicle() {

		if ( sphereBody ) {

			rigidBody.setPosition( world, sphereBody, resetPosition, false );
			rigidBody.setLinearVelocity( world, sphereBody, [ 0, 0, 0 ] );
			rigidBody.setAngularVelocity( world, sphereBody, [ 0, 0, 0 ] );

		}

		const [ sx, sy, sz ] = resetPosition;
		vehicle.spherePos.set( sx, sy, sz );
		vehicle.sphereVel.set( 0, 0, 0 );
		vehicle.prevModelPos.set( sx, sy - 0.5, sz );
		vehicle.container.position.set( sx, sy - 0.5, sz );
		vehicle.container.rotation.set( 0, resetAngle, 0 );
		vehicle.linearSpeed = 0;
		vehicle.angularSpeed = 0;
		vehicle.acceleration = 0;

	}

	const cam = new Camera();
	scene.add( cam.debug );

	const controls = new Controls();
	const lapTimer = new LapTimer( customCells, mapParam );
	let runActive = false;
	let runElapsed = 0;
	let collisionCount = 0;
	let lastCollisionTime = - Infinity;

	let particles = null;
	let driftMarks = null;
	let audio = null;

	const _forward = new THREE.Vector3();
	const _camLead = new THREE.Vector3();

	function getWallDistance() {

		const pos = vehicle.spherePos;

		_forward.set( 0, 0, 1 ).applyQuaternion( vehicle.container.quaternion );
		_forward.y = 0;

		if ( _forward.lengthSq() < 1e-6 ) _forward.set( 0, 0, 1 );

		_forward.normalize();

		vec3.set( _rayOrigin, pos.x, pos.y, pos.z );
		vec3.set( _rayDirection, _forward.x, _forward.y, _forward.z );

		wallRayCollector.reset();
		castRay( world, wallRayCollector, wallRaySettings, _rayOrigin, _rayDirection, WALL_RAY_MAX, wallRayFilter );

		if ( wallRayCollector.hit.status === CastRayStatus.COLLIDING ) {

			return Math.max( 0, wallRayCollector.hit.fraction * WALL_RAY_MAX - VEHICLE_RADIUS );

		}

		return WALL_RAY_MAX;

	}

	function getRunStats() {

		return {
			active: runActive,
			elapsed: runElapsed,
			collisions: collisionCount,
			completedLaps: lapTimer.completedLaps,
			lapCompleted: lapTimer.completedLaps,
			lastLapTime: lapTimer.lastLap,
			currentLapTime: lapTimer.currentLapTime,
			position: vehicle.spherePos.clone(),
			speed: vehicle.linearSpeed,
			normalizedSpeed: Math.min( 1, Math.abs( vehicle.linearSpeed ) / MAX_SPEED ),
			driftIntensity: vehicle.driftIntensity,
			onFinishLine: lapTimer.isNearFinish( vehicle.spherePos ),
			wallDistance: getWallDistance(),
			collision: performance.now() - lastCollisionTime < 500,
		};

	}

	function onRunStart() {

		runActive = true;
		runElapsed = 0;
		collisionCount = 0;
		lastCollisionTime = - Infinity;
		lapTimer.reset();

	}

	function onRunEnd() {

		runActive = false;
		return getRunStats();

	}

	function resetRun() {

		virtualControls?.stop?.();
		resetVehicle();
		lapTimer.reset();
		runActive = false;
		runElapsed = 0;
		collisionCount = 0;

	}

	window.RacingGame = {
		...( window.RacingGame || {} ),
		resetVehicle,
		resetRun,
		getRunStats,
		onRunStart,
		onRunEnd,
	};

	if ( ! document.getElementById( 'blockly-panel' ) ) {

		document.getElementById( 'reset-btn' )?.addEventListener( 'click', resetRun );

	}

	const contactListener = {
		onContactAdded( bodyA, bodyB ) {

			if ( bodyA !== sphereBody && bodyB !== sphereBody ) return;

			if ( runActive ) {

				collisionCount ++;
				lastCollisionTime = performance.now();

			}

			_forward.set( 0, 0, 1 ).applyQuaternion( vehicle.container.quaternion );
			_forward.y = 0;
			_forward.normalize();

			const impactVelocity = Math.abs( vehicle.modelVelocity.dot( _forward ) );
			audio?.playImpact( impactVelocity );

		}
	};

	const timer = new THREE.Timer();

	function animate() {

		requestAnimationFrame( animate );

		timer.update();
		const dt = Math.min( timer.getDelta(), 1 / 30 );

		if ( runActive ) runElapsed += dt;

		const robotMode = window.SparkiBridge?.isRobotMode?.();

		if ( ! robotMode ) virtualControls?.update( dt );

		const manualInput = controls.update();
		const blocklyInput = virtualControls?.getInput?.();
		const blocklyActive = virtualControls?.active || blocklyInput?.blocklyActive;
		const input = blocklyActive && ! robotMode ? blocklyInput : manualInput;

		updateWorld( world, contactListener, dt );

		vehicle.update( dt, input );

		dirLight.position.set(
			vehicle.spherePos.x + 11.4,
			15,
			vehicle.spherePos.z - 5.3
		);

		const mv = vehicle.modelVelocity;
		_camLead.set( 0, 0, 1 ).applyQuaternion( vehicle.container.quaternion ).multiplyScalar( Math.sqrt( mv.x * mv.x + mv.z * mv.z ) );
		cam.update( dt, vehicle.spherePos, _camLead );
		particles?.update( dt, vehicle );
		driftMarks?.update( dt, vehicle );
		audio?.update( dt, vehicle.linearSpeed / MAX_SPEED, input.z, vehicle.driftIntensity );

		const hasInput = input.touchActive || Math.abs( input.x ) > 0.05 || Math.abs( input.z ) > 0.05;
		lapTimer.update( dt, vehicle.spherePos, hasInput );

		renderer.render( scene, cam.camera );

	}

	setLoadingProgress( 1, 'Ready' );
	hideLoading();
	animate();

	requestAnimationFrame( () => {

		const particleBudget = deviceProfile.lowGpu ? 200 : ( isMobile ? 400 : 1280 );
		const driftBudget = deviceProfile.lowGpu ? 512 : ( isMobile ? 1024 : 4096 );

		particles = new SmokeTrails( scene, particleBudget );
		driftMarks = new DriftMarks( scene, mapParam, driftBudget );

		audio = new GameAudio();
		audio.init( cam.camera );

		if ( ! isMobile && ! deviceProfile.lowGpu ) {

			requestAnimationFrame( () => bakeLightProbes( bounds, hw, hd, groundSize ) );

		}

	} );

}

init();
