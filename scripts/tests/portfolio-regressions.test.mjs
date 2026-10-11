import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'
import { gsap } from 'gsap'
import { resolveCaseProjectIndex } from '../../src/utils/navigation/caseQuery.ts'

// Run the component's actual functions with controlled lifecycle/DOM boundaries.
// This keeps font and transaction races deterministic without a browser dependency.
async function componentCode(path, functionNames, lifecycleNames = []) {
	const source = await readFile(path, 'utf8')
	const script = source.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)[1]
	const parsed = ts.createSourceFile(path, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
	return parsed.statements.filter(node =>
		(ts.isFunctionDeclaration(node) && functionNames.includes(node.name?.text))
		|| (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)
			&& lifecycleNames.includes(node.expression.expression.getText(parsed)))
	).map(node => ts.transpileModule(node.getText(parsed), {
		compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext }
	}).outputText).join('\n')
}

function deferred() {
	let resolve
	const promise = new Promise(done => { resolve = done })
	return { promise, resolve }
}

const heroCode = await componentCode('src/components/sections/SectionHomeHero.vue', [
	'restoreScroll', 'playHeroIntro', 'linkHeroIntroTimeline', 'waitForFonts', 'markHeroIntroStarted'
], ['onMounted', 'onUnmounted'])

function createHeroHarness() {
	const fonts = deferred()
	const loadingTimeline = gsap.timeline({ paused: true }).to({ value: 0 }, { value: 1, duration: 5 })
	const element = {
		value: 0, visibility: 'hidden', width: '0%', clipPath: '', y: 0, rotation: 0,
		scale: 1, yPercent: 0, autoAlpha: 1, classList: { remove() {} }
	}
	const events = []
	let mount, unmount, motion, releases = 0, locks = 0, reduced = false, removed = false
	const noop = () => {}
	const dependencies = {
		gsap, document: { fonts: { ready: fonts.promise } },
		props: { loadingScreen: { element, getSignatureDrawTimeline: () => loadingTimeline } },
		root: { value: { ...element, querySelector: () => element } },
		heroPhotoPositioner: { value: element }, heroPhoto: { value: element },
		scrollIndicatorWrapper: { value: element }, scrollIndicatorElement: { value: element },
		emit: name => events.push(name), onMounted: callback => { mount = callback },
		onUnmounted: callback => { unmount = callback },
		observeReducedMotion: callback => { motion = callback; return () => { removed = true } },
		prefersReducedMotion: () => reduced, nextTick: async () => {},
		registerGsapPlugins: noop, supportsCursorFollow: () => false,
		isScrollDiagnosticGroupEnabled: () => false, setupScrollIndicatorVelocity: noop,
		cleanupScrollIndicatorVelocity: noop, enableResponsiveLineSplits: noop,
		lockPageScroll: () => { locks++; return () => { releases++ } },
		cancelAnimationFrame: noop, HERO_INTRO_LOADING_OVERLAP: 0.14, FINAL_PHOTO_ROTATION: 0
	}
	new Function(...Object.keys(dependencies), `
		let heroTimeline, unlockScroll, stopObservingMotion, ctx, titleSplit, roleSplit, introSplit, scrollIndicatorFollow;
		let isHeroIntroLinked = false, isHeroIntroComplete = false, isHeroMounted = false;
		let copyRefreshId = 0, splitRefreshFrame = 0;
		${heroCode}
	`)(...Object.values(dependencies))
	return {
		fonts, loadingTimeline, events, mount: () => mount(), unmount: () => unmount(),
		reduce: () => { reduced = true; motion(true) },
		state: () => ({ locks, releases, removed })
	}
}

test('reduced motion during delayed fonts completes independently and releases the intro once', async () => {
	const hero = createHeroHarness()
	try {
		const mounting = hero.mount()
		await Promise.resolve()
		hero.reduce()
		assert.equal(hero.loadingTimeline.progress(), 1)
		assert.deepEqual(hero.state(), { locks: 0, releases: 0, removed: false })
		hero.fonts.resolve()
		await mounting
		await new Promise(resolve => setTimeout(resolve, 30))
		assert.equal(hero.events.filter(name => name === 'intro-complete').length, 1)
		assert.equal(hero.events.filter(name => name === 'intro-start').length, 1)
		hero.reduce()
		hero.unmount()
		assert.deepEqual(hero.state(), { locks: 1, releases: 1, removed: true })
		assert.equal(hero.events.filter(name => name === 'intro-complete').length, 1)
	} finally {
		hero.loadingTimeline.kill()
		gsap.ticker.sleep()
	}
})

test('unmount during delayed fonts removes observers and cannot acquire a late scroll lock', async () => {
	const hero = createHeroHarness()
	try {
		const mounting = hero.mount()
		await Promise.resolve()
		hero.unmount()
		hero.fonts.resolve()
		await mounting
		assert.deepEqual(hero.state(), { locks: 0, releases: 0, removed: true })
	} finally {
		hero.loadingTimeline.kill()
		gsap.ticker.sleep()
	}
})

const workCode = await componentCode('src/components/sections/SectionHomeWork.vue', [
	'handleProjectChangeRequest', 'synchronizeCaseRoute', 'closeProject'
])

function createWorkHarness(navigate) {
	const projects = { value: [
		{ slug: 'muzimatch', caseStatus: 'published' },
		{ slug: 'sfvonline', caseStatus: 'published' }
	] }
	const route = { query: { case: 'sfvonline' } }
	const selectedProjectIndex = { value: 0 }, overlayLifecycle = { value: 'open' }
	const writes = [], attempts = [], closes = []
	const noop = () => {}
	const layer = {
		navigateToProject: async index => { attempts.push(index); return navigate(index, selectedProjectIndex) },
		hideCloseContent: async () => { closes.push('hide'); return false }, cancelClose: noop
	}
	const dependencies = {
		props: { navigationReady: true }, route, projects, selectedProjectIndex, overlayLifecycle,
		projectLayer: { value: layer }, projectCount: 2, openingHomepageScrollY: 100,
		isProjectPublished: project => project.caseStatus === 'published', resolveCaseProjectIndex,
		debugProjectClose: noop, validateFrozenHomepageScroll: noop, getPortfolioScrollY: () => 100,
		setOverlayLifecycle: value => { overlayLifecycle.value = value }, DEBUG_PROJECT_CLOSE: false,
		writeCaseUrl: async (index, replace) => { writes.push({ index, replace }); route.query.case = projects.value[index]?.slug },
		nextTick: async () => {}, waitForAnimationFrame: async () => {},
		focusKeyboardProject: noop, projectCards: [], restoreOpeningWorkState: async () => {},
		isProjectLayerMounted: { value: true }
	}
	const api = new Function(...Object.keys(dependencies), `
		let synchronizingCaseRoute = false, isWorkMounted = true;
		let lastSynchronizedCase = Symbol('initial');
		${workCode}
		return { synchronizeCaseRoute, handleProjectChangeRequest, stop: () => { isWorkMounted = false } };
	`)(...Object.values(dependencies))
	return { ...api, route, selectedProjectIndex, overlayLifecycle, writes, attempts, closes }
}

const settle = () => new Promise(resolve => setImmediate(resolve))

for (const failure of ['interrupted', 'exception']) {
	test(`${failure} case switch reconciles once and never retries an unchanged URL`, async () => {
		const work = createWorkHarness(async () => {
			if (failure === 'exception') throw new Error('transition failed')
			return false
		})
		await work.synchronizeCaseRoute()
		await settle()
		await work.synchronizeCaseRoute()
		assert.deepEqual(work.attempts, [1])
		assert.deepEqual(work.writes, [{ index: 0, replace: true }])
		assert.equal(work.route.query.case, 'muzimatch')
		assert.equal(work.overlayLifecycle.value, 'open')
	})
}

test('failed switch preserves a newer Back request to close the overlay', async () => {
	const switching = deferred()
	const work = createWorkHarness(() => switching.promise)
	const transaction = work.synchronizeCaseRoute()
	work.route.query.case = undefined
	await work.synchronizeCaseRoute()
	switching.resolve(false)
	await transaction
	await settle()
	assert.deepEqual(work.attempts, [1])
	assert.deepEqual(work.closes, ['hide'])
	// The failed close reconciles its own request once; the failed switch does not overwrite Back.
	assert.deepEqual(work.writes, [{ index: 0, replace: true }])
})

test('rapid URLs during a successful switch settle to the latest requested case', async () => {
	const switching = deferred()
	const work = createWorkHarness(async (index, selected) => {
		if (index === 1) await switching.promise
		selected.value = index
		return true
	})
	const transaction = work.synchronizeCaseRoute()
	work.route.query.case = undefined
	await work.synchronizeCaseRoute()
	work.route.query.case = 'muzimatch'
	await work.synchronizeCaseRoute()
	switching.resolve()
	await transaction
	await settle()
	assert.deepEqual(work.attempts, [1, 0])
	assert.equal(work.selectedProjectIndex.value, 0)
	assert.equal(work.route.query.case, 'muzimatch')
	assert.deepEqual(work.writes, [])
	await work.synchronizeCaseRoute()
	assert.deepEqual(work.attempts, [1, 0])
})

test('failed switch after unmount does not reconcile history or restore lifecycle', async () => {
	const switching = deferred()
	const work = createWorkHarness(() => switching.promise)
	const transaction = work.synchronizeCaseRoute()
	work.stop()
	work.overlayLifecycle.value = 'closed'
	switching.resolve(false)
	await transaction
	await settle()
	assert.deepEqual(work.writes, [])
	assert.equal(work.overlayLifecycle.value, 'closed')
})

const layerCode = await componentCode('src/components/work/ProjectLayerPrototype.vue', ['navigateToProject'])

function createLayerHarness({ reduced = false, stale = false } = {}) {
	const isTransitioning = { value: false }, displayedIndex = { value: 0 }
	const events = []
	let cleanups = 0
	const dependencies = {
		isOpening: { value: false }, isTransitioning, isClosing: { value: false }, displayedIndex,
		props: { projects: [{ caseStatus: 'published' }, { caseStatus: 'published' }] },
		isProjectPublished: project => project.caseStatus === 'published', announcement: { value: '' },
		killContextTransition: () => { cleanups++ }, contextTransitionRunId: 0,
		prefersReducedMotion: () => reduced, gsap: { set() {} }, content: { value: { scrollTop: 10 } },
		surface: { value: {} }, emit: (...event) => events.push(event), nextTick: async () => {},
		isStaleContextTransition: () => stale, getProjectBackground: () => '#b0b0fe',
		waitForAnimationFrame: async () => {}, getHeroElements: () => null,
		getTransitionBodies: () => [], displayedProject: { value: { title: 'SFVonline' } },
		completeProjectSwitch: () => { isTransitioning.value = false }, projectNavigator: { value: null }
	}
	const navigate = new Function(...Object.keys(dependencies), `${layerCode}\nreturn navigateToProject;`)(...Object.values(dependencies))
	return { navigate, isTransitioning, displayedIndex, events, cleanups: () => cleanups }
}

test('layer transition errors reach the coordinator after presentation cleanup', async () => {
	const layer = createLayerHarness()
	await assert.rejects(layer.navigate(1), /missing its outgoing content/)
	assert.equal(layer.cleanups(), 2)
	assert.equal(layer.isTransitioning.value, false)
	assert.equal(layer.displayedIndex.value, 0)
})

test('layer reports explicit successful and interrupted reduced-motion outcomes', async () => {
	const success = createLayerHarness({ reduced: true })
	assert.equal(await success.navigate(1), true)
	assert.equal(success.displayedIndex.value, 1)
	assert.equal(success.isTransitioning.value, false)
	const interrupted = createLayerHarness({ reduced: true, stale: true })
	assert.equal(await interrupted.navigate(1), false)
	assert.equal(interrupted.isTransitioning.value, false)
})

test('Back to the previous URL during a control-initiated switch still synchronizes the overlay', async () => {
	const switching = deferred()
	const work = createWorkHarness(async (index, selected) => {
		if (index === 1) await switching.promise
		selected.value = index
		return true
	})
	work.route.query.case = 'muzimatch'
	await work.synchronizeCaseRoute()
	const transaction = work.handleProjectChangeRequest(1)
	await Promise.resolve()
	work.route.query.case = 'muzimatch'
	await work.synchronizeCaseRoute()
	switching.resolve()
	await transaction
	await work.synchronizeCaseRoute()
	assert.deepEqual(work.attempts, [1, 0])
	assert.equal(work.selectedProjectIndex.value, 0)
	assert.equal(work.route.query.case, 'muzimatch')
})

test('normal-motion linking preserves the existing loading overlap', async () => {
	const code = await componentCode('src/components/sections/SectionHomeHero.vue', ['linkHeroIntroTimeline'])
	const loading = gsap.timeline({ paused: true }).to({ value: 0 }, { value: 1, duration: 5 })
	const hero = gsap.timeline({ paused: true }).to({ value: 0 }, { value: 1, duration: 2 })
	try {
		new Function('props', 'heroTimeline', 'prefersReducedMotion', `
			let isHeroIntroLinked = false;
			const HERO_INTRO_LOADING_OVERLAP = 0.14;
			${code}
			linkHeroIntroTimeline();
		`)({ loadingScreen: { getSignatureDrawTimeline: () => loading } }, hero, () => false)
		assert.equal(hero.parent, loading)
		assert.equal(hero.startTime(), 4.86)
		assert.equal(hero.duration(), 2)
		assert.equal(hero.paused(), false)
	} finally {
		loading.kill()
		hero.kill()
		gsap.ticker.sleep()
	}
})


const mobileStackCode = await componentCode('src/components/sections/SectionHomeWork.vue', [
	'setupMobileStack', 'updateVisualProjectActivation', 'getExhibitionProjectScrollY'
])

function createMobileStackHarness(height = 600, titleLines = []) {
	const viewport = { height }
	const mobileStackMode = { value: false }, activeProjectIndex = { value: 0 }
	const interactiveProjectIndex = { value: null }, isProjectLayerMounted = { value: false }
	const cards = Array.from({ length: 5 }, () => ({
		x: 0, xPercent: 0, y: 0, yPercent: 0, rotationY: 0, scale: 1,
		zIndex: 0, transformOrigin: '', '--work-card-entry': 1, '--work-card-scale': 1, '--work-card-depth': '0px'
	}))
	let config, killed = false
	const dependencies = {
		document: { querySelector: () => null }, splitTitle: { lines: titleLines },
		animationDurations: { reveal: 0.8 }, animationStaggers: { lines: 0.1 }, animationEases: { strongOut: 'power3.out' },
		gsap, mobileStackMode, activeProjectIndex, interactiveProjectIndex, isProjectLayerMounted,
		getWorkViewportHeight: () => viewport.height, window: { innerWidth: 375 },
		root: { value: { style: { removeProperty() {} }, classList: { remove() {} } } },
		ScrollTrigger: { create(options) {
			config = options
			return { start: 100, end: 100 + options.animation.duration() * viewport.height, kill() { killed = true } }
		} },
		diagnosticStaticCards: { value: false }
	}
	const api = new Function(...Object.keys(dependencies), 'cards', `
		let exhibitionTimeline, exhibitionTrigger, viewportHeight = 0, viewportWidth = 0;
		let isRestoringProjectClose = false, reducedMotionActivationEnabled = false, openingProjectIndex = 0;
		${mobileStackCode}
		const cleanup = setupMobileStack(cards);
		return {
			cleanup, getExhibitionProjectScrollY,
			getOpeningProjectIndex: () => openingProjectIndex,
			seek: time => { exhibitionTimeline.time(time, false); },
		};
	`)(...Object.values(dependencies), cards)
	return { ...api, cards, viewport, config, mobileStackMode, activeProjectIndex, interactiveProjectIndex, isProjectLayerMounted, killed: () => killed }
}

test('phone stack overlaps vertically, reverses, and uses a pin without snap or scroll interception', () => {
	const stack = createMobileStackHarness()
	try {
		assert.equal(stack.config.pinSpacing, true)
		assert.equal(stack.config.scrub, 0.8)
		assert.equal(stack.config.snap, undefined)
		assert.equal(stack.cards[0]['--work-card-scale'], 1)
		assert.equal(stack.cards[1]['--work-card-entry'], 1)
		stack.seek(2.42)
		assert.equal(stack.cards[0]['--work-card-scale'], 0.97)
		assert.equal(stack.cards[1]['--work-card-entry'], 0.5)
		assert.equal(stack.interactiveProjectIndex.value, null)
		stack.seek(2.92)
		assert.equal(stack.cards[0]['--work-card-scale'], 0.94)
		assert.equal(stack.cards[0]['--work-card-depth'], '-18px')
		assert.equal(stack.cards[1].y, 0)
		assert.equal(stack.interactiveProjectIndex.value, 1)
		assert(stack.cards[1].zIndex > stack.cards[0].zIndex)
		stack.seek(0)
		assert.equal(stack.cards[0]['--work-card-scale'], 1)
		assert.equal(stack.cards[0].y, 0)
		assert.equal(stack.cards[1]['--work-card-entry'], 1)
		assert.equal(stack.cards[0]['--work-card-entry'], 1)
		assert.equal(stack.interactiveProjectIndex.value, null)
	} finally {
		stack.cleanup()
		assert.equal(stack.killed(), true)
		assert.equal(stack.mobileStackMode.value, false)
		gsap.ticker.sleep()
	}
})

test('phone project labels resolve case/keyboard targets, freeze activation under overlays, and refresh height', () => {
	const stack = createMobileStackHarness(500)
	try {
		for (let index = 0; index < 5; index++) {
			const label = stack.config.animation.labels[`project-${index}`]
			stack.seek(label)
			assert.equal(stack.interactiveProjectIndex.value, index)
			assert.equal(stack.getExhibitionProjectScrollY(index), 100 + label * 500)
		}
		stack.isProjectLayerMounted.value = true
		stack.seek(0)
		assert.equal(stack.activeProjectIndex.value, 4)
		stack.viewport.height = 400
		stack.config.onRefreshInit()
		assert.equal(stack.getOpeningProjectIndex(), undefined)
		assert.equal(stack.config.end(), `+=${stack.config.animation.duration() * 400}`)
	} finally {
		stack.cleanup()
		gsap.ticker.sleep()
	}
})


test('phone title precedes every card and reversing hides the first card below the viewport', () => {
	const title = { yPercent: 110, opacity: 1 }
	const stack = createMobileStackHarness(600, [title])
	try {
		stack.seek(0.4)
		assert(title.yPercent > 0 && title.yPercent < 110)
		assert(stack.cards.every(card => card['--work-card-entry'] === 1))
		assert.equal(stack.interactiveProjectIndex.value, null)
		stack.seek(1.3)
		assert.equal(title.yPercent, 0)
		assert.equal(stack.cards[0]['--work-card-entry'], 0.5)
		assert.equal(stack.cards[1]['--work-card-entry'], 1)
		stack.seek(stack.config.animation.labels['project-0'])
		assert.equal(stack.cards[0]['--work-card-entry'], 0)
		assert.equal(stack.interactiveProjectIndex.value, 0)
		stack.seek(0)
		assert.equal(title.yPercent, 110)
		assert(stack.cards.every(card => card['--work-card-entry'] === 1))
		assert.equal(stack.interactiveProjectIndex.value, null)
	} finally {
		stack.cleanup()
		gsap.ticker.sleep()
	}
})

const mobileScrollCode = await componentCode('src/components/sections/SectionHomeWork.vue', [
	'suspendExhibitionTracking', 'resumeExhibitionTracking', 'synchronizeExhibitionScroll', 'focusKeyboardProject'
])

test('phone scrub freezes displayed geometry for overlays and settles explicit restoration and keyboard navigation', () => {
	const events = []
	const scrub = { pause: () => events.push('pause'), progress: value => events.push(`settle:${value}`) }
	const dependencies = {
		exhibitionTrigger: { pin: {}, getTween: snap => snap ? undefined : scrub },
		mobileStackMode: { value: true }, overlayLifecycle: { value: 'closed' },
		activeProjectIndex: { value: 0 }, interactiveProjectIndex: { value: null },
		getExhibitionProjectScrollY: () => 250,
		setPortfolioScrollY: value => events.push(`scroll:${value}`),
		ScrollTrigger: { update: () => events.push('update') },
		cancelExhibitionSnap() {}, debugProjectClose() {}
	}
	const api = new Function(...Object.keys(dependencies), `
		let exhibitionSnapResumeScrollY;
		${mobileScrollCode}
		return { suspendExhibitionTracking, synchronizeExhibitionScroll, focusKeyboardProject };
	`)(...Object.values(dependencies))
	api.suspendExhibitionTracking()
	assert.deepEqual(events.splice(0), ['pause'])
	api.synchronizeExhibitionScroll(500)
	assert.deepEqual(events.splice(0), ['scroll:500', 'update', 'settle:1', 'pause'])
	api.focusKeyboardProject(2)
	assert.deepEqual(events.splice(0), ['scroll:250', 'update', 'settle:1'])
	assert.equal(dependencies.interactiveProjectIndex.value, 2)
	dependencies.mobileStackMode.value = false
	api.focusKeyboardProject(3)
	assert.deepEqual(events, ['scroll:250', 'update'])
})

const lifeStackCode = await componentCode('src/components/sections/HomeLifeStackExperiment.vue', ['initAnimations'])

async function createLifeStackHarness({ mobile = true, desktop = false, motion = true } = {}) {
	const cards = Array.from({ length: 2 }, () => ({
		'--life-photo-entry': 1, '--life-photo-x': '0px', '--life-photo-y': '0px', '--life-photo-rotation': '0deg',
		x: 0, y: 0, xPercent: 0, yPercent: 0, rotate: 0, autoAlpha: 1, zIndex: 0
	}))
	const photos = [{ x: -10, y: 6, rotation: 2.2 }, { x: 8, y: -5, rotation: -1 }]
	let timeline, config, refreshes = 0
	const dependencies = {
		gsap: {
			set: gsap.set,
			context: callback => { callback(); return { revert() {} } },
			matchMedia: () => ({ add(query, callback) {
				if (typeof query === 'object') callback({ conditions: { mobile, desktop, motion } })
			} }),
			timeline: options => {
				config = options.scrollTrigger
				timeline = gsap.timeline({ paused: true })
				return timeline
			}
		},
		root: { value: { dataset: {}, classList: { toggle() {} } } },
		layout: { value: { clientHeight: 600 } }, stackTrack: { value: {} }, stack: { value: { clientHeight: 600 } },
		introRef: { value: null }, cardRefs: { value: cards }, photos,
		isScrollDiagnosticGroupEnabled: () => true, registerGsapPlugins() {},
		document: { documentElement: { clientHeight: 600 } }, nextTick: async () => {},
		ScrollTrigger: { refresh: () => { refreshes++ } },
		DESKTOP_LAYOUT_QUERY: '(min-width: 64rem)', MOBILE_LAYOUT_QUERY: '(max-width: 47.999rem)',
		FIRST_PHOTO_SETTLED_LABEL: 'first-photo-settled'
	}
	await new Function(...Object.keys(dependencies), `
		let animationRequestId = 0, isMounted = true, context, mediaContext;
		${lifeStackCode}
		return initAnimations();
	`)(...Object.values(dependencies))
	return { cards, photos, timeline, config, refreshes }
}

test('Life mobile entrances use live CSS viewport fractions with unchanged scrub, rhythm and photo poses', async () => {
	const stack = await createLifeStackHarness()
	try {
		assert.equal(stack.config.scrub, 0.8)
		assert.equal(stack.config.end, 'bottom bottom')
		assert.equal(stack.config.pin, undefined)
		assert.equal(stack.timeline.duration(), 2.7)
		assert.equal(stack.refreshes, 1)
		assert.equal(stack.cards[0]['--life-photo-entry'], 1)
		stack.timeline.time(0.5)
		assert.equal(stack.cards[0]['--life-photo-entry'], 0.0625)
		assert.equal(stack.cards[1]['--life-photo-entry'], 1)
		stack.timeline.time(2.35)
		stack.cards.forEach((card, index) => {
			assert.equal(card['--life-photo-entry'], 0)
			assert.equal(card['--life-photo-x'], `${stack.photos[index].x}px`)
			assert.equal(card['--life-photo-y'], `${stack.photos[index].y}px`)
			assert.equal(card['--life-photo-rotation'], `${stack.photos[index].rotation}deg`)
			assert.equal(card.zIndex, index + 1)
		})
		stack.timeline.time(0)
		assert(stack.cards.every(card => card['--life-photo-entry'] === 1))
	} finally {
		stack.timeline.kill()
		gsap.ticker.sleep()
	}
})

test('Life desktop and tablet retain pixel transforms and reduced motion creates no photo timeline', async () => {
	for (const desktop of [true, false]) {
		const stack = await createLifeStackHarness({ mobile: false, desktop })
		try {
			assert.equal(stack.cards[0].y, 600)
			assert.equal(stack.cards[0].xPercent, -50)
			assert.equal(stack.cards[0].yPercent, -50)
			assert.equal(Boolean(stack.config.pin), desktop)
			if (desktop) assert.equal(stack.config.end(), '+=450')
			stack.timeline.time(1)
			assert.equal(stack.cards[0].y, 6)
			assert.equal(stack.cards[0].rotate, 2.2)
		} finally {
			stack.timeline.kill()
			gsap.ticker.sleep()
		}
	}
	const reduced = await createLifeStackHarness({ motion: false })
	assert.equal(reduced.timeline, undefined)
	assert.equal(reduced.refreshes, 0)
})
