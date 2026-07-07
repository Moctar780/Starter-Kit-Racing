const STORAGE_KEY = 'racing.blockly.panel.pos.v1';
const MOBILE_QUERY = '(max-width: 800px)';
const MARGIN = 8;

export function isMobileLayout() {

	return window.matchMedia( MOBILE_QUERY ).matches;

}

export function getPanelHeight() {

	if ( isMobileLayout() ) {

		const landscape = window.matchMedia( '(orientation: landscape)' ).matches;
		return Math.round( window.innerHeight * ( landscape ? 0.82 : 0.66 ) );

	}

	return window.innerHeight - 24;

}

function readSavedPosition() {

	try {

		const raw = localStorage.getItem( STORAGE_KEY );
		if ( ! raw ) return null;

		const data = JSON.parse( raw );
		if ( ! Number.isFinite( data.x ) || ! Number.isFinite( data.y ) ) return null;

		return data;

	} catch {

		return null;

	}

}

function savePosition( x, y ) {

	localStorage.setItem( STORAGE_KEY, JSON.stringify( { x, y } ) );

}

function clampPosition( panel, x, y ) {

	const width = panel.offsetWidth;
	const height = panel.offsetHeight;
	const maxX = Math.max( MARGIN, window.innerWidth - width - MARGIN );
	const maxY = Math.max( MARGIN, window.innerHeight - height - MARGIN );

	return {
		x: Math.max( MARGIN, Math.min( x, maxX ) ),
		y: Math.max( MARGIN, Math.min( y, maxY ) ),
	};

}

function applyPosition( panel, x, y ) {

	const position = clampPosition( panel, x, y );

	panel.style.left = `${ position.x }px`;
	panel.style.top = `${ position.y }px`;
	panel.style.right = 'auto';
	panel.style.bottom = 'auto';

	return position;

}

function ensurePanelSize( panel ) {

	panel.style.width = `${ Math.min( 430, window.innerWidth - 2 * MARGIN ) }px`;
	panel.style.height = `${ getPanelHeight() }px`;

}

export function applyMobilePanelLayout( panel ) {

	if ( panel.classList.contains( 'collapsed' ) ) return;

	ensurePanelSize( panel );

	if ( isMobileLayout() ) {

		const x = MARGIN;
		const y = window.innerHeight - panel.offsetHeight - MARGIN;
		applyPosition( panel, x, y );

	}

}

export function initPanelDrag( panel, handle ) {

	let dragging = false;
	let pointerId = null;
	let offsetX = 0;
	let offsetY = 0;

	function setDefaultPosition() {

		ensurePanelSize( panel );

		if ( isMobileLayout() ) {

			const x = MARGIN;
			const y = window.innerHeight - panel.offsetHeight - MARGIN;
			applyPosition( panel, x, y );

		} else {

			applyPosition( panel, MARGIN, MARGIN );

		}

	}

	function restorePosition() {

		ensurePanelSize( panel );

		const saved = isMobileLayout() ? null : readSavedPosition();

		if ( saved ) {

			applyPosition( panel, saved.x, saved.y );

		} else {

			setDefaultPosition();

		}

	}

	restorePosition();

	handle.addEventListener( 'pointerdown', ( event ) => {

		if ( event.button !== 0 ) return;
		if ( event.target.closest( '.panel-toggle' ) ) return;

		ensurePanelSize( panel );

		const rect = panel.getBoundingClientRect();
		dragging = true;
		pointerId = event.pointerId;
		offsetX = event.clientX - rect.left;
		offsetY = event.clientY - rect.top;

		panel.classList.add( 'dragging' );
		handle.setPointerCapture( event.pointerId );
		event.preventDefault();

	} );

	handle.addEventListener( 'pointermove', ( event ) => {

		if ( ! dragging || event.pointerId !== pointerId ) return;

		const position = applyPosition(
			panel,
			event.clientX - offsetX,
			event.clientY - offsetY
		);

		savePosition( position.x, position.y );

	} );

	function endDrag( event ) {

		if ( ! dragging || event.pointerId !== pointerId ) return;

		dragging = false;
		pointerId = null;
		panel.classList.remove( 'dragging' );

		if ( handle.hasPointerCapture( event.pointerId ) ) {

			handle.releasePointerCapture( event.pointerId );

		}

	}

	handle.addEventListener( 'pointerup', endDrag );
	handle.addEventListener( 'pointercancel', endDrag );

	window.addEventListener( 'resize', () => {

		if ( isMobileLayout() ) {

			setDefaultPosition();
			return;

		}

		const left = parseFloat( panel.style.left ) || MARGIN;
		const top = parseFloat( panel.style.top ) || MARGIN;
		const position = applyPosition( panel, left, top );
		savePosition( position.x, position.y );

	} );

}
