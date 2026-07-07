export class MissionPanel {

	constructor( container, challenges, validator ) {

		this.container = container;
		this.challenges = challenges;
		this.validator = validator;
		this.onSelect = null;
		this.onShare = null;
		this._tutorialModule = null;
		this._startupTutorialPending = true;

		this.injectStyles();
		this.build();

	}

	injectStyles() {

		const style = document.createElement( 'style' );
		style.textContent = `
			#mission-panel {
				padding: 3px 6px;
				border-bottom: 1px solid rgba(0,0,0,0.08);
				background: rgba(255,255,255,0.56);
				color: #1f2430;
			}
			#mission-panel.collapsed .mission-body {
				display: none;
			}
			.mission-header {
				display: flex;
				align-items: center;
				gap: 4px;
			}
			.mission-header h2 {
				flex: 1;
				min-width: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			.mission-level-badge {
				flex: 0 0 auto;
				display: inline-flex;
				align-items: center;
				gap: 3px;
				padding: 2px 6px;
				border-radius: 999px;
				background: rgba( 36, 125, 58, 0.14 );
				border: 1px solid rgba( 36, 125, 58, 0.35 );
				color: #247d3a;
				font-size: 8px;
				font-weight: 700;
				letter-spacing: 0.03em;
				text-transform: uppercase;
				white-space: nowrap;
			}
			.mission-level-badge[hidden] { display: none; }
			.mission-level-badge .stars {
				color: #c99200;
				font-size: 9px;
				letter-spacing: 0;
				text-transform: none;
			}
			#mission-complete-badge {
				position: fixed;
				inset: 0;
				z-index: 40;
				display: flex;
				align-items: center;
				justify-content: center;
				pointer-events: none;
				background: rgba( 8, 12, 20, 0.28 );
				opacity: 0;
				transition: opacity 0.35s ease;
			}
			#mission-complete-badge[hidden] { display: none; }
			#mission-complete-badge.visible { opacity: 1; }
			.mission-complete-badge-card {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 6px;
				padding: 16px 22px;
				border-radius: 16px;
				background: rgba( 255, 255, 255, 0.94 );
				border: 2px solid rgba( 36, 125, 58, 0.45 );
				box-shadow: 0 12px 40px rgba( 0, 0, 0, 0.22 );
				transform: scale( 0.82 ) translateY( 12px );
				transition: transform 0.45s cubic-bezier( 0.22, 1.15, 0.32, 1 ), opacity 0.35s ease;
				opacity: 0;
				text-align: center;
				max-width: min( 280px, 88vw );
			}
			#mission-complete-badge.visible .mission-complete-badge-card {
				transform: scale( 1 ) translateY( 0 );
				opacity: 1;
			}
			.mission-complete-badge-icon {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 44px;
				height: 44px;
				border-radius: 50%;
				background: linear-gradient( 145deg, #3ecf6a, #247d3a );
				color: #fff;
				font-size: 22px;
				font-weight: 700;
				box-shadow: 0 4px 14px rgba( 36, 125, 58, 0.4 );
			}
			.mission-complete-badge-title {
				font-size: 15px;
				font-weight: 700;
				color: #1f2430;
			}
			.mission-complete-badge-level {
				font-size: 11px;
				color: #4a5260;
			}
			.mission-complete-badge-stars {
				font-size: 16px;
				color: #c99200;
				letter-spacing: 2px;
			}
			.mission-toggle {
				flex: 0 0 auto;
				border: 0;
				border-radius: 999px;
				width: 22px;
				height: 22px;
				background: rgba(31,36,48,0.08);
				color: #1f2430;
				cursor: pointer;
				font-size: 10px;
			}
			#mission-panel h2 {
				margin: 0;
				font-size: 11px;
				font-weight: 600;
			}
			#mission-panel p {
				margin: 0 0 4px;
				color: #4a5260;
				font-size: 10px;
				line-height: 1.3;
			}
			.mission-tutorial-goal {
				margin: 0 0 6px;
				font-weight: 600;
				color: #1f2430;
			}
			.mission-tutorial-intro {
				margin: 0 0 8px;
				color: #4a5260;
				font-size: 12px;
				line-height: 1.45;
			}
			.mission-tutorial-section {
				margin: 0 0 3px;
				font-size: 10px;
				font-weight: 700;
				letter-spacing: 0.05em;
				text-transform: uppercase;
				color: #4876ff;
			}
			.mission-tutorial-steps {
				margin: 0 0 8px 16px;
				padding: 0;
				color: #1f2430;
			}
			.mission-tutorial-steps li {
				margin-bottom: 4px;
			}
			.mission-tutorial-tip {
				margin: 0 0 8px;
				padding: 7px 9px;
				border-radius: 8px;
				background: rgba( 201, 146, 0, 0.1 );
				border: 1px solid rgba( 201, 146, 0, 0.25 );
				color: #5a4a20;
				font-size: 11px;
				line-height: 1.4;
			}
			.mission-tutorial-tip span {
				display: block;
				margin-bottom: 2px;
				font-size: 9px;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.04em;
				color: #9a7200;
			}
			.mission-tutorial-validate {
				margin: 0;
				padding-top: 6px;
				border-top: 1px solid rgba( 36, 125, 58, 0.2 );
				color: #247d3a;
				font-size: 11px;
				line-height: 1.4;
			}
			.mission-help-btn {
				flex: 0 0 auto;
				border: 0;
				border-radius: 999px;
				width: 22px;
				height: 22px;
				background: rgba( 72, 118, 255, 0.14 );
				color: #4876ff;
				cursor: pointer;
				font-size: 11px;
				font-weight: 700;
				font-style: italic;
				line-height: 22px;
			}
			#mission-tutorial-overlay {
				position: fixed;
				left: 50%;
				top: calc( 12px + env( safe-area-inset-top, 0px ) );
				z-index: 35;
				width: min( 420px, calc( 100vw - 20px ) );
				transform: translateX( -50% );
				pointer-events: auto;
				opacity: 0;
				transition: opacity 0.3s ease, transform 0.35s cubic-bezier( 0.22, 1.1, 0.32, 1 );
			}
			#mission-tutorial-overlay[hidden] { display: none; }
			#mission-tutorial-overlay.visible {
				opacity: 1;
				transform: translateX( -50% ) translateY( 0 );
			}
			#mission-tutorial-overlay:not(.visible) {
				transform: translateX( -50% ) translateY( -8px );
			}
			.mission-tutorial-overlay-card {
				position: relative;
				padding: 16px 40px 16px 18px;
				border-radius: 16px;
				background: rgba( 255, 255, 255, 0.97 );
				border: 1px solid rgba( 72, 118, 255, 0.35 );
				box-shadow: 0 12px 36px rgba( 0, 0, 0, 0.2 );
				font-size: 13px;
				line-height: 1.45;
				color: #1f2430;
			}
			.mission-tutorial-overlay-card::after {
				content: '';
				position: absolute;
				left: 50%;
				bottom: -7px;
				width: 12px;
				height: 12px;
				background: rgba( 255, 255, 255, 0.96 );
				border-right: 1px solid rgba( 72, 118, 255, 0.35 );
				border-bottom: 1px solid rgba( 72, 118, 255, 0.35 );
				transform: translateX( -50% ) rotate( 45deg );
			}
			.mission-tutorial-overlay-title {
				margin: 0 0 10px;
				font-size: 15px;
				font-weight: 700;
				color: #4876ff;
			}
			.mission-tutorial-overlay-close {
				position: absolute;
				top: 8px;
				right: 8px;
				border: 0;
				border-radius: 999px;
				width: 22px;
				height: 22px;
				background: rgba( 31, 36, 48, 0.08 );
				color: #1f2430;
				cursor: pointer;
				font-size: 14px;
				line-height: 1;
			}
			.mission-tutorial-overlay-card .mission-tutorial-intro {
				font-size: 13px;
			}
			.mission-tutorial-overlay-card .mission-tutorial-goal {
				font-size: 14px;
			}
			.mission-tutorial-overlay-card .mission-tutorial-section {
				font-size: 11px;
			}
			.mission-tutorial-overlay-card .mission-tutorial-steps {
				font-size: 13px;
			}
			.mission-tutorial-overlay-card .mission-tutorial-tip {
				font-size: 12px;
			}
			.mission-tutorial-overlay-card .mission-tutorial-validate {
				font-size: 12px;
			}
			.mission-tutorial-validate span {
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.03em;
			}
			@media ( max-width: 800px ) {
				#mission-tutorial-overlay {
					top: calc( 8px + env( safe-area-inset-top, 0px ) );
					width: min( 360px, calc( 100vw - 16px ) );
				}
				.mission-tutorial-overlay-card {
					font-size: 12px;
					padding: 14px 36px 14px 16px;
				}
				.mission-tutorial-overlay-title { font-size: 14px; }
				.mission-tutorial-overlay-card .mission-tutorial-steps { font-size: 12px; }
			}
			#mission-panel select {
				width: 100%;
				margin-bottom: 4px;
				border: 1px solid rgba(0,0,0,0.12);
				border-radius: 6px;
				padding: 3px 5px;
				background: #fff;
				color: #1f2430;
				font-size: 10px;
			}
			.mission-actions {
				display: flex;
				gap: 3px;
				flex-wrap: wrap;
			}
			.mission-actions button {
				border: 0;
				border-radius: 6px;
				padding: 3px 6px;
				min-height: 22px;
				background: rgba(31,36,48,0.08);
				color: #1f2430;
				cursor: pointer;
				font-size: 9px;
			}
			#mission-result {
				margin-top: 3px;
				font-size: 9px;
				line-height: 1.25;
				color: #1f2430;
			}
			#mission-result.success { color: #247d3a; }
			#mission-result.fail { color: #9b4326; }
			@media (max-width: 800px) {
				#mission-panel { padding: 2px 5px; }
				#mission-panel p { font-size: 9px; margin-bottom: 2px; }
				#mission-panel h2 { font-size: 10px; }
				#mission-panel select {
					margin-bottom: 2px;
					padding: 4px;
					font-size: 10px;
				}
				.mission-actions button {
					min-height: 20px;
					padding: 2px 5px;
					font-size: 9px;
				}
			}
		`;
		document.head.appendChild( style );

	}

	build() {

		this.el = document.createElement( 'div' );
		this.el.id = 'mission-panel';
		this.el.innerHTML = `
			<div class="mission-header">
				<h2 id="mission-title"></h2>
				<span id="mission-level-badge" class="mission-level-badge" hidden aria-label="Mission terminee">
					<span>Termine</span>
					<span class="stars" id="mission-level-stars"></span>
				</span>
				<button id="mission-help" class="mission-help-btn" type="button" aria-label="Afficher le tutoriel du niveau" title="Tutoriel">i</button>
				<button id="mission-toggle" class="mission-toggle" type="button" aria-expanded="true" aria-label="Replier la mission">▼</button>
			</div>
			<div class="mission-body">
				<select id="mission-select" aria-label="Choisir une mission"></select>
				<p id="mission-description"></p>
				<div class="mission-actions">
					<button id="mission-share" type="button">Partager</button>
				</div>
				<div id="mission-result" aria-live="polite"></div>
			</div>
		`;
		this.container.appendChild( this.el );

		this.select = this.el.querySelector( '#mission-select' );
		this.title = this.el.querySelector( '#mission-title' );
		this.description = this.el.querySelector( '#mission-description' );
		this.result = this.el.querySelector( '#mission-result' );
		this.toggle = this.el.querySelector( '#mission-toggle' );
		this.helpBtn = this.el.querySelector( '#mission-help' );
		this.levelBadge = this.el.querySelector( '#mission-level-badge' );
		this.levelStars = this.el.querySelector( '#mission-level-stars' );

		this.tutorialOverlay = document.createElement( 'div' );
		this.tutorialOverlay.id = 'mission-tutorial-overlay';
		this.tutorialOverlay.hidden = true;
		this.tutorialOverlay.innerHTML = `
			<div class="mission-tutorial-overlay-card" role="dialog" aria-labelledby="mission-tutorial-overlay-title">
				<button type="button" class="mission-tutorial-overlay-close" aria-label="Fermer le tutoriel">×</button>
				<div class="mission-tutorial-overlay-title" id="mission-tutorial-overlay-title">Tutoriel</div>
				<div id="mission-tutorial-overlay-content"></div>
			</div>
		`;
		document.body.appendChild( this.tutorialOverlay );
		this.tutorialOverlayContent = this.tutorialOverlay.querySelector( '#mission-tutorial-overlay-content' );
		this.tutorialOverlayTitle = this.tutorialOverlay.querySelector( '#mission-tutorial-overlay-title' );
		this._tutorialOverlayTimer = null;

		this.tutorialOverlay.querySelector( '.mission-tutorial-overlay-close' ).addEventListener( 'click', () => {

			this.hideTutorialOverlay();

		} );

		this.helpBtn.addEventListener( 'click', () => {

			if ( this.challenge ) this.showTutorialOverlay( this.challenge );

		} );

		this.completionOverlay = document.createElement( 'div' );
		this.completionOverlay.id = 'mission-complete-badge';
		this.completionOverlay.hidden = true;
		this.completionOverlay.innerHTML = `
			<div class="mission-complete-badge-card" role="status" aria-live="assertive">
				<div class="mission-complete-badge-icon" aria-hidden="true">✓</div>
				<div class="mission-complete-badge-title">Niveau termine !</div>
				<div class="mission-complete-badge-level" id="mission-complete-level"></div>
				<div class="mission-complete-badge-stars" id="mission-complete-stars"></div>
			</div>
		`;
		document.body.appendChild( this.completionOverlay );
		this.completionLevel = this.completionOverlay.querySelector( '#mission-complete-level' );
		this.completionStars = this.completionOverlay.querySelector( '#mission-complete-stars' );
		this._celebrationTimer = null;

		if ( window.matchMedia( '(max-width: 800px)' ).matches ) {

			this.setCollapsed( true );

		}

		this.toggle.addEventListener( 'click', () => {

			this.setCollapsed( ! this.el.classList.contains( 'collapsed' ) );

		} );

		for ( const challenge of this.challenges ) {

			const option = document.createElement( 'option' );
			const progress = this.validator.getProgress();
			const stars = progress.stars[ challenge.id ];
			const done = progress.completed.includes( challenge.id );
			option.value = challenge.id;
			option.textContent = `${ done ? '✓ ' : '' }${ challenge.title }${ stars ? ` (${ stars }/3)` : '' }`;
			this.select.appendChild( option );

		}

		this.select.addEventListener( 'change', () => this.onSelect?.( this.select.value ) );
		this.el.querySelector( '#mission-share' ).addEventListener( 'click', () => this.onShare?.() );

	}

	setChallenge( challenge ) {

		this.challenge = challenge;
		this.select.value = challenge.id;
		this.title.textContent = challenge.title;
		this.description.textContent = challenge.description;
		this.setResult( '', null );
		this.refreshCompletionBadge();

		if ( this._startupTutorialPending ) {

			this._startupTutorialPending = false;
			this.showTutorialOverlay( challenge );

		}

	}

	async loadTutorialModule() {

		if ( ! this._tutorialModule ) {

			this._tutorialModule = await import( './missionTutorial.js' );

		}

		return this._tutorialModule;

	}

	async showTutorialOverlay( challenge ) {

		const { renderTutorialHtml } = await this.loadTutorialModule();

		if ( this._tutorialOverlayTimer ) clearTimeout( this._tutorialOverlayTimer );

		this.tutorialOverlayTitle.textContent = challenge.title;
		this.tutorialOverlayContent.innerHTML = renderTutorialHtml( challenge );
		this.tutorialOverlay.hidden = false;

		requestAnimationFrame( () => {

			this.tutorialOverlay.classList.add( 'visible' );

		} );

		this._tutorialOverlayTimer = setTimeout( () => this.hideTutorialOverlay(), 12000 );

	}

	hideTutorialOverlay() {

		this.tutorialOverlay.classList.remove( 'visible' );

		if ( this._tutorialOverlayTimer ) {

			clearTimeout( this._tutorialOverlayTimer );
			this._tutorialOverlayTimer = null;

		}

		setTimeout( () => {

			if ( ! this.tutorialOverlay.classList.contains( 'visible' ) ) {

				this.tutorialOverlay.hidden = true;

			}

		}, 320 );

	}

	refreshCompletionBadge() {

		if ( ! this.challenge ) return;

		const progress = this.validator.getProgress();
		const completed = progress.completed.includes( this.challenge.id );
		const stars = progress.stars[ this.challenge.id ] || 0;

		this.levelBadge.hidden = ! completed;
		this.levelStars.textContent = stars ? '★'.repeat( stars ) : '';

	}

	refreshSelectOptions() {

		const progress = this.validator.getProgress();

		for ( const option of this.select.options ) {

			const challenge = this.challenges.find( ( c ) => c.id === option.value );
			if ( ! challenge ) continue;

			const stars = progress.stars[ challenge.id ];
			const done = progress.completed.includes( challenge.id );
			option.textContent = `${ done ? '✓ ' : '' }${ challenge.title }${ stars ? ` (${ stars }/3)` : '' }`;

		}

	}

	showCompletionCelebration( challenge, stars = 1 ) {

		if ( this._celebrationTimer ) clearTimeout( this._celebrationTimer );

		this.completionLevel.textContent = challenge.title;
		this.completionStars.textContent = '★'.repeat( stars ) + '☆'.repeat( Math.max( 0, 3 - stars ) );
		this.completionOverlay.hidden = false;

		requestAnimationFrame( () => {

			this.completionOverlay.classList.add( 'visible' );

		} );

		this._celebrationTimer = setTimeout( () => this.hideCompletionCelebration(), 3200 );

	}

	hideCompletionCelebration() {

		this.completionOverlay.classList.remove( 'visible' );

		if ( this._celebrationTimer ) {

			clearTimeout( this._celebrationTimer );
			this._celebrationTimer = null;

		}

		setTimeout( () => {

			if ( ! this.completionOverlay.classList.contains( 'visible' ) ) {

				this.completionOverlay.hidden = true;

			}

		}, 380 );

	}

	setCollapsed( collapsed ) {

		this.el.classList.toggle( 'collapsed', collapsed );
		this.toggle.textContent = collapsed ? '▲' : '▼';
		this.toggle.setAttribute( 'aria-expanded', String( ! collapsed ) );
		this.toggle.setAttribute( 'aria-label', collapsed ? 'Deplier la mission' : 'Replier la mission' );

	}

	setResult( message, success, stars = 0, { celebrate = false } = {} ) {

		this.result.className = success === null ? '' : success ? 'success' : 'fail';
		this.result.textContent = message ? `${ stars ? `${ '★'.repeat( stars ) } ` : '' }${ message }` : '';

		if ( success && this.challenge ) {

			this.refreshCompletionBadge();
			this.refreshSelectOptions();

			if ( celebrate ) this.showCompletionCelebration( this.challenge, stars );

		}

	}

}
