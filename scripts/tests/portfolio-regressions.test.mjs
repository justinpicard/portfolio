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
		useCursorFollowIndicator: noop, registerGsapPlugins: noop, supportsCursorFollow: () => false,
		setupScrollIndicatorVelocity: noop,
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
	const writes = [], attempts = [], closes = [], flushes = []
	const noop = () => {}
	const layer = {
		navigateToProject: async index => { attempts.push(index); return navigate(index, selectedProjectIndex) },
		hideCloseContent: async () => { closes.push('hide'); return false }, cancelClose: noop,
		flushPendingClose: () => flushes.push(overlayLifecycle.value)
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
	return { ...api, route, selectedProjectIndex, overlayLifecycle, writes, attempts, closes, flushes }
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


const workStackCode = await componentCode('src/components/sections/SectionHomeWork.vue', [
	'setupExhibition', 'updateVisualProjectActivation', 'getExhibitionProjectScrollY',
	'suspendExhibitionTracking', 'synchronizeExhibitionScroll', 'focusKeyboardProject',
	'updateReducedMotionActivation', 'refreshReducedMotionMeasurements'
])

function createWorkStackHarness(height = 600, cardShare = 0.74, reduced = false, titleLines = [], touch = false) {
	const viewport = { width: 1200, height, visibleHeight: undefined }
	const trackStyles = new Map()
	const stage = { get clientHeight() { return viewport.visibleHeight ?? viewport.height }, get clientWidth() { return viewport.width },
		getBoundingClientRect: () => ({ top: 0, bottom: viewport.height, left: 0, right: viewport.width }) }
	const layers = Array.from({ length: 5 }, () => ({
		'--work-card-entry': 1, _y: 0,
		get y() { return this['--work-card-y'] === undefined ? this._y : Number.parseFloat(this['--work-card-y']) },
		set y(value) { this._y = value }, zIndex: 0, get offsetHeight() { return viewport.height * cardShare }
	}))
	const cards = layers.map(layer => ({
		scale: 1, rotation: 0, rotationX: 0, transformOrigin: '',
		getBoundingClientRect: () => ({ top: layer.y, bottom: layer.y + layer.offsetHeight, left: 0, right: viewport.width })
	}))
	const activeProjectIndex = { value: 0 }, interactiveProjectIndex = { value: null }
	const isProjectLayerMounted = { value: false }
	const events = []
	let config, titleExit, titleExitKilled = false, killed = false, disconnected = false, observerCallback
	const dependencies = {
		gsap: { ...gsap, utils: { ...gsap.utils, toArray: selector => selector === '[data-project-card]' ? cards : layers },
			fromTo(target, from, to) { titleExit = { target, from, to }; return { scrollTrigger: { kill() {} }, kill() { titleExitKilled = true } } }
		},
		titleRef: { value: {} },
		titleWrapper: { value: { get clientHeight() { return viewport.height } } },
		stage: { value: stage }, exhibition: { value: {} },
		root: { value: { classList: { toggle() {}, remove() {} }, style: { setProperty: (name, value) => trackStyles.set(name, value), removeProperty: name => trackStyles.delete(name) } } },
		prefersReducedMotion: () => reduced,
		getPortfolioScrollY: () => 0, readCssNumber: (_property, fallback) => fallback,
		NATIVE_STICKY_QUERY: 'native-sticky', splitTitle: { lines: titleLines }, MOBILE_LAYOUT_QUERY: '(max-width: 47.999rem)',
		animationDurations: { reveal: 0.8 }, animationStaggers: { lines: 0.1 }, animationEases: { strongOut: 'power3.out' },
		activeProjectIndex, interactiveProjectIndex, isProjectLayerMounted,
		window: { matchMedia: query => ({ matches: query === 'native-sticky' ? touch : titleLines.length > 0 }), addEventListener() {}, removeEventListener() {}, get innerHeight() { return viewport.height }, get innerWidth() { return viewport.width } },
		ResizeObserver: class { constructor(callback) { observerCallback = callback } observe() {} disconnect() { disconnected = true } },
		cancelAnimationFrame() {}, requestAnimationFrame: callback => { callback(); return 1 },
		setPortfolioScrollY: value => events.push(value),
		ScrollTrigger: {
			create(options) { config = options; return { start: 100, get end() { return 100 + Number(options.end().slice(2)) }, getTween: () => touch ? ({ pause: () => events.push('scrub-pause'), progress: () => events.push('scrub-settle') }) : 0, kill() { killed = true } } },
			refresh() { config.onRefreshInit() }, update() { events.push('update') }
		}
	}
	const api = new Function(...Object.keys(dependencies), `
		let exhibitionTimeline, exhibitionTrigger, projectCards = [], viewportHeight = 0;
		let isRestoringProjectClose = false, reducedMotionActivationEnabled = false, stackNeedsRefresh = false;
		let exhibitionActiveRadius = 140, reducedMotionCardCenters = [], frozenStackProgress;
		const overlayLifecycle = { value: 'closed' };
		${workStackCode}
		const cleanup = setupExhibition();
		return { cleanup, getExhibitionProjectScrollY, suspendExhibitionTracking,
			synchronizeExhibitionScroll, focusKeyboardProject,
			needsRefresh: () => stackNeedsRefresh,
			freeze: () => { frozenStackProgress = exhibitionTimeline.progress() },
			seek: time => exhibitionTimeline.time(time, false) };
	`)(...Object.values(dependencies))
	return { ...api, cards, layers, viewport, config, events, trackStyles, activeProjectIndex, interactiveProjectIndex,
		isProjectLayerMounted, titleExit, resize: () => observerCallback(), disposed: () => killed && disconnected,
		titleExitDisposed: () => titleExitKilled }
}

for (const [height, share] of [[900, 0.74], [650, 0.84], [400, 0.9]]) {
	test(`responsive Work stack preserves prototype distances, depth and reverse poses at ${height}px`, () => {
		const stack = createWorkStackHarness(height, share)
		try {
			const timeline = stack.config.animation
			const firstArrival = height * 1.3
			const lastArrival = firstArrival + height * share * 4
			assert.equal(stack.config.scrub, true)
			assert.equal(stack.config.pinSpacing, true)
			assert.equal(stack.config.snap, undefined)
			assert.equal(timeline.duration(), lastArrival + height * 0.35)
			assert.equal(stack.layers[0].y, height)
			assert.equal(stack.interactiveProjectIndex.value, null)
			stack.seek(height * 0.8)
			assert.equal(stack.layers[0].y, height * 0.5)
			assert.equal(stack.layers[1].y - stack.layers[0].y, height * share)
			assert.equal(stack.interactiveProjectIndex.value, 0)
			stack.seek(firstArrival + 0.25)
			assert.equal(stack.interactiveProjectIndex.value, 0)
			stack.seek(firstArrival + 1)
			assert.equal(stack.interactiveProjectIndex.value, 1)
			stack.seek(lastArrival)
			for (let index = 0; index < 4; index++) {
				assert.equal(stack.cards[index].scale, 0.7)
				assert.equal(stack.cards[index].rotationX, 40)
				assert.equal(stack.cards[index].rotation, [1.5, -3.5, 2, -2.5][index])
			}
			assert.equal(stack.cards[4].scale, 1)
			assert.equal(stack.cards[4].rotationX, 0)
			assert.equal(stack.interactiveProjectIndex.value, 4)
			stack.seek(timeline.duration())
			assert.equal(stack.cards[4].scale, 1)
			assert.equal(stack.cards[4].rotationX, 0)
			assert.equal(stack.cards[4].rotation, 0)
			assert.equal(stack.interactiveProjectIndex.value, 4)
			stack.seek(firstArrival + height * share * 0.5)
			assert.equal(stack.interactiveProjectIndex.value, 1)
			assert(stack.cards[0].scale < 1)
			assert.equal(stack.cards[1].scale, 1)
			stack.seek(0)
			assert.equal(stack.cards[0].scale, 1)
			assert.equal(stack.cards[0].rotationX, 0)
			assert.equal(stack.layers[0].y, height)
			assert.equal(stack.interactiveProjectIndex.value, null)
		} finally { stack.cleanup(); assert(stack.disposed()); gsap.ticker.sleep() }
	})
}

test('touch Work uses native sticky with identical timeline, targets and frozen overlay poses', () => {
	const desktop = createWorkStackHarness(650, 0.84)
	const mobile = createWorkStackHarness(650, 0.84, false, [], true)
	try {
		assert.equal(mobile.trackStyles.get('--work-scroll-distance'), `${mobile.config.animation.duration()}px`)
		assert.equal(mobile.config.pin, undefined)
		assert.equal(mobile.config.pinSpacing, undefined)
		assert.equal(mobile.config.scrub, 0.8)
		assert.equal(mobile.titleExit.to.scrollTrigger.scrub, 0.8)
		assert.equal(desktop.config.scrub, true)
		assert.equal(mobile.config.end(), desktop.config.end())
		assert.deepEqual(mobile.config.animation.labels, desktop.config.animation.labels)
		for (const time of [0, 500, 1000, 2000, 3000]) {
			desktop.seek(time)
			mobile.seek(time)
			assert.deepEqual(mobile.layers.map(layer => layer.y), desktop.layers.map(layer => layer.y))
			assert.deepEqual(mobile.cards.map(card => [card.scale, card.rotationX]), desktop.cards.map(card => [card.scale, card.rotationX]))
		}
		assert.equal(mobile.getExhibitionProjectScrollY(2), desktop.getExhibitionProjectScrollY(2))
		mobile.focusKeyboardProject(2)
		assert(mobile.events.includes('scrub-settle'))
		mobile.suspendExhibitionTracking()
		assert(mobile.events.includes('scrub-pause'))
		mobile.freeze()
		const poses = mobile.layers.map(layer => layer.y)
		mobile.isProjectLayerMounted.value = true
		mobile.seek(0)
		mobile.config.onUpdate()
		mobile.config.onRefresh()
		assert.deepEqual(mobile.layers.map(layer => layer.y), poses)
	} finally {
		desktop.cleanup()
		mobile.cleanup()
		assert.equal(mobile.trackStyles.size, 0)
		gsap.ticker.sleep()
	}
})

test('touch toolbar height changes leave Work timing and scroll track unchanged', () => {
	const stack = createWorkStackHarness(650, 0.84, false, [], true)
	try {
		const duration = stack.config.animation.duration()
		for (const visibleHeight of [650, 750]) {
			const first = stack.layers[0]
			assert.equal(first.y + first['--work-card-entry'] * (visibleHeight - 650), visibleHeight)
		}
		const labels = { ...stack.config.animation.labels }
		for (const time of [300, 500, 900, 1200]) {
			stack.seek(time)
			for (const visibleHeight of [650, 750]) {
				const positions = stack.layers.map(layer => layer.y + layer['--work-card-entry'] * (visibleHeight - 650))
				for (let index = 1; index < positions.length; index++) {
					assert(Math.abs((positions[index] - positions[index - 1])
						- (stack.layers[index].y - stack.layers[index - 1].y)) < 0.000001)
				}
			}
		}
		stack.seek(500)
		const entry = stack.layers[0]['--work-card-entry']
		assert(entry > 0 && entry < 1)
		stack.viewport.visibleHeight = 750
		stack.resize()
		assert.equal(stack.config.animation.time(), 500)
		assert.equal(stack.config.animation.duration(), duration)
		assert.deepEqual(stack.config.animation.labels, labels)
		assert.equal(stack.trackStyles.get('--work-scroll-distance'), `${duration}px`)
		assert.equal(stack.layers[0]['--work-card-entry'], entry)
		stack.seek(labels['project-0'])
		assert.equal(stack.layers[0]['--work-card-entry'], 0)
		stack.seek(0)
		assert.equal(stack.layers[0]['--work-card-entry'], 1)
	} finally { stack.cleanup(); gsap.ticker.sleep() }
})

const workTitleCode = await componentCode('src/components/sections/SectionHomeWork.vue', ['setupTitleReveal'])

test('phone Work uses desktop letter entrance geometry and timing with touch scrubbing', () => {
	for (const mobile of [true, false]) {
		let splitOptions, reveal, wrapped, initial
		const chars = [{}, {}, {}, {}, {}]
		const dependencies = {
			titleRef: { value: {} }, root: { value: { dataset: {} } },
			prefersReducedMotion: () => false,
			window: { matchMedia: query => ({ matches: mobile && (query === 'mobile' || query === 'compact') }) },
			MOBILE_LAYOUT_QUERY: 'mobile', COMPACT_LAYOUT_QUERY: 'compact',
			TITLE_REVEAL_SCROLL_DISTANCE: 1.6,
			SplitText: class { constructor(_target, options) { splitOptions = options; this.chars = chars } },
			wrapSplitElements: elements => { wrapped = elements },
			getWorkViewportHeight: () => 650, readCssNumber: (_property, fallback) => fallback,
			gsap: { set(_target, options) { initial = options }, to(target, options) { reveal = { target, options }; return {} } }
		}
		new Function(...Object.keys(dependencies), `let splitTitle, titleRevealTween; ${workTitleCode}; setupTitleReveal();`)(...Object.values(dependencies))
		assert.equal(splitOptions.type, 'chars')
		assert.equal(splitOptions.aria, 'auto')
		assert.equal(wrapped, chars)
		assert.equal(reveal.target, chars)
		assert.equal(reveal.options.stagger, 0.06)
		assert.equal(reveal.options.ease, 'power2.inOut')
		assert.equal(initial.y(), 650)
		assert.equal(initial.yPercent, 0)
		assert.equal(reveal.options.yPercent, 0)
		assert.equal(reveal.options.scrollTrigger.start, 'top bottom')
		assert.equal(reveal.options.scrollTrigger.end(), '+=1040')
		assert.equal(reveal.options.scrollTrigger.scrub, mobile ? 0.8 : true)
	}
})

test('reduced-motion Work stays static without a pin, timeline or resize observer', () => {
	const stack = createWorkStackHarness(600, 0.74, true)
	assert.equal(stack.config, undefined)
	assert(stack.layers.every(layer => layer.y === 0))
	assert(stack.cards.every(card => card.scale === 1 && card.rotationX === 0))
	stack.cleanup()
})

test('Work labels serve routing/keyboard targets and resize rebuilds defer while overlay is mounted', () => {
	const stack = createWorkStackHarness()
	try {
		for (let index = 0; index < 5; index++) {
			const label = stack.config.animation.labels[`project-${index}`]
			stack.seek(label)
			assert.equal(stack.interactiveProjectIndex.value, index)
			assert(Math.abs(stack.getExhibitionProjectScrollY(index) - 100 - label) < 0.000001)
		}
		stack.synchronizeExhibitionScroll(stack.getExhibitionProjectScrollY(4))
		stack.suspendExhibitionTracking()
		assert(stack.config.animation.paused())
		stack.isProjectLayerMounted.value = true
		stack.seek(0)
		assert.equal(stack.activeProjectIndex.value, 4)
		const duration = stack.config.animation.duration()
		stack.viewport.height = 400
		stack.resize()
		assert(stack.needsRefresh())
		assert.equal(stack.config.animation.duration(), duration)
		stack.isProjectLayerMounted.value = false
		stack.config.onRefreshInit()
		assert.equal(stack.config.animation.labels['project-0'], 520)
		stack.focusKeyboardProject(2)
		assert.equal(stack.interactiveProjectIndex.value, 2)
		assert.deepEqual(stack.events.slice(-2), [stack.getExhibitionProjectScrollY(2), 'update'])
	} finally { stack.cleanup(); gsap.ticker.sleep() }
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
		registerGsapPlugins() {},
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

const sectionScrollCode = await componentCode('src/components/navigation/SectionNavigation.vue', [
	'cancelNavigationScroll', 'observeNavigationScrollInput', 'scrollToSection'
], ['onUnmounted'])

function createSectionScrollHarness(reduced = false) {
	const listeners = new Map(), tweens = [], writes = []
	let unmount, scrollY = 100, activeUpdates = 0
	class ElementTarget {
		constructor(matches = [], editable = false) { this.matches = matches; this.isContentEditable = editable }
		closest(selector) { return this.matches.some(match => selector.split(', ').includes(match)) ? this : null }
	}
	const props = { disabled: false, trackingSuspended: false }
	const dependencies = {
		props, HTMLElement: ElementTarget,
		window: {
			addEventListener: (name, handler) => listeners.set(name, handler),
			removeEventListener: (name, handler) => { if (listeners.get(name) === handler) listeners.delete(name) }
		},
		document: { getElementById: id => ({ dataset: { sectionNavigationScrollY: id === 'life' ? '1000' : '500' } }), removeEventListener() {} },
		gsap: { to: (target, options) => {
			const tween = gsap.to(target, { ...options, paused: true })
			tweens.push({ tween, options })
			return tween
		} },
		setActiveSection() {}, updateLocationHash() {}, prefersReducedMotion: () => reduced,
		getPortfolioScrollY: () => scrollY,
		setPortfolioScrollY: value => { scrollY = value; writes.push(value) },
		updateActiveSection: () => { activeUpdates++ }, animationEases: { inOut: 'power2.inOut' },
		onUnmounted: callback => { unmount = callback },
		cleanupLabelTransition() {}, handleDocumentPointerDown() {}
	}
	const api = new Function(...Object.keys(dependencies), `
		let scrollTween, cleanupScrollInput, isProgrammaticScrolling = false;
		let labelTransitionId = 0, activeSectionTrigger, panelTween, itemTimeline, staggerLinks, animationContext;
		let sectionPositionTriggers = [], sectionActivationPositions = [];
		const itemElements = new Map();
		${sectionScrollCode}
		return { scrollToSection, cancelNavigationScroll, scrolling: () => isProgrammaticScrolling };
	`)(...Object.values(dependencies))
	return { ...api, props, listeners, tweens, writes, ElementTarget, unmount: () => unmount(), scrollY: () => scrollY, activeUpdates: () => activeUpdates,
		input(name, event = {}) { listeners.get(name)?.({ defaultPrevented: false, altKey: false, ctrlKey: false, metaKey: false, target: new ElementTarget(), ...event }) }
	}
}

test('navigation wheel, trackpad-style wheel, touch and scroll keys cancel without further position writes', () => {
	for (const [name, event] of [['wheel', {}], ['wheel', { deltaY: -1, deltaMode: 0 }], ['touchstart', {}], ['touchmove', {}], ...['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].map(key => ['keydown', { key }])]) {
		const nav = createSectionScrollHarness()
		nav.scrollToSection('life')
		const { tween, options } = nav.tweens[0]
		tween.progress(0.4)
		const position = nav.scrollY(), writes = nav.writes.length
		nav.input(name, event)
		assert.equal(nav.scrolling(), false)
		assert.equal(nav.listeners.size, 0)
		assert.equal(nav.scrollY(), position)
		options.onUpdate()
		assert.equal(nav.writes.length, writes)
		assert.equal(tween.parent, null)
		tween.kill()
	}
	gsap.ticker.sleep()
})

test('navigation ignores editing, control activation and unrelated keyboard input; completion removes observers', () => {
	const nav = createSectionScrollHarness()
	try {
		nav.scrollToSection('life')
		for (const event of [
			{ key: 'Tab' }, { key: 'Escape' }, { key: 'ArrowDown', ctrlKey: true },
			{ key: 'PageDown', defaultPrevented: true },
			{ key: 'ArrowDown', target: new nav.ElementTarget(['input']) },
			{ key: 'Home', target: new nav.ElementTarget([], true) },
			{ key: 'ArrowDown', target: new nav.ElementTarget(['[role="slider"]']) },
			{ key: ' ', target: new nav.ElementTarget(['button']) }
		]) {
			nav.input('keydown', event)
			assert.equal(nav.scrolling(), true)
		}
		nav.tweens[0].tween.progress(1)
		assert.equal(nav.scrollY(), 1000)
		assert.equal(nav.listeners.size, 0)
		assert.equal(nav.scrolling(), false)
		assert.equal(nav.tweens[0].options.duration, 0.9)
	} finally { nav.unmount(); gsap.ticker.sleep() }
})

test('navigation replacements and unmount clean listeners; overlay lock prevents writes and reduced motion needs no listeners', () => {
	const nav = createSectionScrollHarness()
	nav.scrollToSection('work')
	const old = nav.tweens[0]
	old.tween.progress(0.3)
	nav.scrollToSection('life')
	assert.equal(old.tween.parent, null)
	assert.equal(nav.listeners.size, 4)
	const writes = nav.writes.length
	old.options.onUpdate()
	assert.equal(nav.writes.length, writes)
	nav.props.trackingSuspended = true
	nav.tweens[1].tween.progress(0.4)
	assert.equal(nav.writes.length, writes)
	nav.scrollToSection('work')
	assert.equal(nav.tweens.length, 2)
	nav.unmount()
	assert.equal(nav.listeners.size, 0)
	assert.equal(nav.scrolling(), false)
	const reduced = createSectionScrollHarness(true)
	reduced.scrollToSection('life')
	assert.equal(reduced.scrollY(), 1000)
	assert.equal(reduced.tweens.length, 0)
	assert.equal(reduced.listeners.size, 0)
	reduced.unmount()
	gsap.ticker.sleep()
})

const transitionCode = await componentCode('src/components/work/ProjectLayerPrototype.vue', [
	'getVisibleCardRect', 'animateSimpleOpen', 'completeOpening', 'requestClose',
	'flushPendingClose', 'handleTransitionGeometryChange', 'finishClose'
])

function createTransitionHarness({ top = 650, reduced = false } = {}) {
	const events = [], animations = [], waiting = [], contents = [{ opacity: 1 }]
	const fonts = deferred()
	const viewport = { innerWidth: 1200, innerHeight: 900 }
	const stage = { getBoundingClientRect: () => ({ top: 0, left: 0, right: 1200, bottom: 900 }) }
	const card = { isConnected: true, closest: () => stage, getBoundingClientRect: () => {
		const cardTop = typeof top === 'function' ? top() : top
		return { top: cardTop, left: 0, right: 1200, bottom: cardTop + 666, width: 1200, height: 666 }
	} }
	const surface = { value: { style: {} } }, content = { value: {} }
	const isOpening = { value: true }, isClosing = { value: false }, isTransitioning = { value: false }
	const set = (targets, values) => {
		for (const target of Array.isArray(targets) ? targets : [targets]) {
			if (!target) continue
			Object.assign(target, values)
			if (target.style && values.clipPath) target.style.clipPath = values.clipPath
		}
	}
	const dependencies = {
		surface, content, isOpening, isClosing, isTransitioning, isOpeningVisibilityLocked: { value: true },
		props: { sourceCard: card, origin: { borderRadius: '0px' } }, window: viewport,
		getProjectCardContents: () => contents, gsap: { set, timeline() {
			const animation = { steps: [], callbacks: [], to(target, values) { this.steps.push([target, values]); return this },
				set(target, values) { this.steps.push([target, values]); return this },
				call(callback) { this.callbacks.push(callback); return this }, add() { return this },
				kill() { this.pending?.resolve('interrupted') } }
			animations.push(animation)
			return animation
		} },
		playTimeline: animation => { const pending = deferred(); animation.pending = pending; waiting.push(animation); return pending.promise },
		getInsetClipPath: rect => `inset(${Math.max(0, rect.top)}px 0px ${Math.max(0, viewport.innerHeight - rect.bottom)}px 0px)`,
		setFullscreenGeometry: () => events.push('fullscreen'),
		prefersReducedMotion: () => reduced, cleanupHeroReveal: () => {},
		projectHeader: { value: { focusClose: () => events.push('focus-close') } },
		emit: name => events.push(name), nextTick: async () => {},
		waitForHeroRevealLayout: () => fonts.promise, createCaseHeroReveal: () => undefined,
		setupProjectNavDivider: () => {}, restoreClosePresentation: () => events.push('rollback'),
		FULLSCREEN_CLIP_PATH: 'inset(0px 0px 0px 0px)'
	}
	const api = new Function(...Object.keys(dependencies), `
		let layerAlive = true, openingRunId = 0, geometryInvalidated = false, timeline, pendingCloseRequest;
		${transitionCode}
		return { open: animateSimpleOpen, close: finishClose, requestClose, flushPendingClose,
			resize: handleTransitionGeometryChange,
			invalidate: () => { layerAlive = false; openingRunId++; timeline?.kill() },
		};
	`)(...Object.values(dependencies))
	return { ...api, events, fonts, surface, contents, card, isOpening, isClosing, isTransitioning, animations,
		resolveNext(status = 'complete') {
			const animation = waiting.shift()
			assert(animation, 'expected an active transition')
			if (status === 'complete') {
				animation.steps.forEach(([target, values]) => set(target, values))
				animation.callbacks.forEach(callback => callback())
			}
			animation.pending.resolve(status)
		},
		clearFinished: () => { waiting.length = 0 },
		reduce: () => { reduced = true; api.resize() }
	}
}

for (const top of [0, 650]) {
	test(`opening uses the clipped foreground at y=${top} and retains the case reveal hook`, async () => {
		const layer = createTransitionHarness({ top })
		const opening = layer.open()
		assert.equal(layer.surface.value.style.clipPath, `inset(${top}px 0px ${top === 0 ? 234 : 0}px 0px)`)
		assert(layer.events.includes('focus-close'))
		assert.equal(layer.animations[0].steps[0][1].duration, 0.12)
		layer.resolveNext()
		layer.fonts.resolve()
		await settle()
		assert.equal(layer.animations[1].steps[0][1].duration, 0.55)
		layer.resolveNext()
		await opening
		assert.equal(layer.isOpening.value, false)
		assert.equal(layer.events.filter(event => event === 'opened').length, 1)
	})
}

for (const source of ['button', 'escape']) {
	test(`immediate ${source} interrupts opening without waiting for fonts or starting stale work`, async () => {
		const layer = createTransitionHarness()
		const opening = layer.open()
		layer.requestClose(source)
		layer.fonts.resolve()
		await opening
		assert.equal(layer.animations.length, 1)
		assert.equal(layer.isOpening.value, false)
		assert.deepEqual(layer.events.slice(-2), ['opened', 'close'])
	})
}

test('a queued switch close is emitted once after the switching transaction settles', () => {
	const layer = createTransitionHarness()
	layer.isOpening.value = false
	layer.isTransitioning.value = true
	layer.requestClose('escape')
	layer.requestClose('button')
	assert(!layer.events.includes('close'))
	layer.isTransitioning.value = false
	layer.flushPendingClose()
	layer.flushPendingClose()
	assert.equal(layer.events.filter(event => event === 'close').length, 1)
})

for (const action of ['resize', 'reduce', 'invalidate']) {
	test(`${action} during the font wait prevents stale opening work`, async () => {
		const layer = createTransitionHarness()
		const opening = layer.open()
		layer.resolveNext()
		await settle()
		layer[action]()
		layer.fonts.resolve()
		await opening
		assert.equal(layer.animations.length, 1)
		assert.equal(layer.events.filter(event => event === 'opened').length, action === 'invalidate' ? 0 : 1)
	})
}

for (const fallback of [false, true]) {
	test(`closing ${fallback ? 'after resize uses a fade' : 'collapses to the clipped original card'}`, async () => {
		const layer = createTransitionHarness()
		layer.isOpening.value = false
		layer.isClosing.value = true
		const closing = layer.close({ card: layer.card, borderRadius: '0px', fadeOnly: fallback })
		if (!fallback) assert.equal(layer.animations[0].steps[0][1].clipPath, 'inset(650px 0px 0px 0px)')
		else assert.equal(layer.animations[0].steps[0][1].autoAlpha, 0)
		layer.resolveNext()
		await settle()
		assert(layer.events.includes('target-ready'))
		layer.resolveNext()
		assert.equal(await closing, true)
	})
}

test('resize interrupts a collapsing surface and finishes through the fade fallback', async () => {
	const layer = createTransitionHarness()
	layer.isOpening.value = false
	layer.isClosing.value = true
	const closing = layer.close({ card: layer.card, borderRadius: '0px' })
	layer.resize()
	layer.clearFinished()
	await settle()
	assert.equal(layer.animations[1].steps[0][1].autoAlpha, 0)
	layer.resolveNext()
	await settle()
	layer.resolveNext()
	assert.equal(await closing, true)
})

const closeTargetCode = await componentCode('src/components/sections/SectionHomeWork.vue', [
	'reconcileAndResolveCloseTarget', 'getExhibitionProjectScrollY'
])

for (const [name, resized, selected, expected] of [
	['same project', false, 0, 350],
	['same project after resize', true, 0, 700],
	['selected project after switching', false, 1, 800],
	['selected project after switching and resize', true, 1, 1600]
]) {
	test(`closing ${name} restores ${selected === 0 ? 'saved progress' : 'the arrival label'}`, async () => {
		let scrollY
		const trigger = { start: 100, end: 1100 }
		const card = { isConnected: true, getBoundingClientRect: () => ({ top: 200, left: 0, right: 1200, bottom: 866, width: 1200, height: 666 }) }
		const dependencies = {
			window: { innerWidth: 1200, innerHeight: resized ? 700 : 900, getComputedStyle: () => ({ borderRadius: '0px' }) },
			openingViewport: { width: 1200, height: 900 }, openingProjectIndex: 0, openingStackProgress: 0.25,
			openingHomepageScrollY: 350, reducedMotionMode: { value: false }, prefersReducedMotion: () => false,
			exhibitionTrigger: trigger, exhibitionTimeline: { duration: () => 1000, labels: { 'project-1': 700 } },
			setupWorkAnimations: () => { trigger.start = 200; trigger.end = 2200 },
			ScrollTrigger: { refresh() {} }, synchronizeExhibitionScroll: value => { scrollY = value },
			projectCards: [card, card], waitForAnimationFrame: async () => {},
			updateVisualProjectActivation() {}, updateReducedMotionActivation() {},
			DEBUG_PROJECT_CLOSE: false, debugProjectClose() {}, getPortfolioScrollY: () => scrollY,
			activeProjectIndex: { value: selected }, interactiveProjectIndex: { value: selected }, hiddenProjectIndex: { value: null }
		}
		const resolve = new Function(...Object.keys(dependencies), `
			let stackNeedsRefresh = ${resized}, isRestoringProjectClose = false, reducedMotionActivationEnabled = false;
			${closeTargetCode}
			return reconcileAndResolveCloseTarget;
		`)(...Object.values(dependencies))
		const result = await resolve(selected)
		assert.equal(result.homepageScrollY, expected)
		assert.equal(scrollY, expected)
		assert.equal(result.fadeOnly, resized)
	})
}

test('global refresh and scroll updates preserve frozen stack poses while retaining the Work pin', () => {
	const stack = createWorkStackHarness()
	try {
		stack.seek(stack.config.animation.labels['project-2'])
		stack.freeze()
		const transforms = stack.cards.map(card => [card.scale, card.rotation, card.rotationX])
		stack.isProjectLayerMounted.value = true
		stack.seek(0)
		stack.config.onUpdate()
		assert.deepEqual(stack.cards.map(card => [card.scale, card.rotation, card.rotationX]), transforms)
		stack.seek(100)
		stack.config.onRefresh()
		assert.deepEqual(stack.cards.map(card => [card.scale, card.rotation, card.rotationX]), transforms)
		assert.equal(stack.config.pinSpacing, true)
		assert(stack.config.pin)
	} finally { stack.cleanup(); gsap.ticker.sleep() }
})

test('reduced motion opens immediately without an expansion timeline', async () => {
	const layer = createTransitionHarness({ reduced: true })
	await layer.open()
	assert.equal(layer.animations.length, 0)
	assert.equal(layer.isOpening.value, false)
	assert(layer.events.includes('opened'))
})

test('an unexpected opening interruption settles fullscreen rather than leaving the dialog locked', async () => {
	const layer = createTransitionHarness()
	const opening = layer.open()
	layer.resolveNext('interrupted')
	await opening
	assert.equal(layer.isOpening.value, false)
	assert(layer.events.includes('opened'))
})

test('switching to reduced motion returns to the static card instead of an obsolete pinned scroll offset', async () => {
	let restored
	const card = { isConnected: true, getBoundingClientRect: () => ({ top: 200, left: 0, right: 1200, bottom: 800, width: 1200, height: 600 }) }
	const dependencies = {
		window: { innerWidth: 1200, innerHeight: 900, getComputedStyle: () => ({ borderRadius: '0px' }) },
		openingViewport: { width: 1200, height: 900 }, openingProjectIndex: 0, openingStackProgress: 0.25,
		openingHomepageScrollY: 5000, prefersReducedMotion: () => true,
		ScrollTrigger: { refresh() {} }, synchronizeExhibitionScroll: value => { restored = value },
		projectCards: [card], waitForAnimationFrame: async () => {},
		updateVisualProjectActivation() {}, updateReducedMotionActivation() {},
		DEBUG_PROJECT_CLOSE: false, debugProjectClose() {}, getPortfolioScrollY: () => 1000,
		activeProjectIndex: { value: 0 }, interactiveProjectIndex: { value: 0 }, hiddenProjectIndex: { value: null }
	}
	const resolve = new Function(...Object.keys(dependencies), `
		let stackNeedsRefresh = false, isRestoringProjectClose = false, reducedMotionActivationEnabled = false;
		let reducedMotionMode = { value: false }, exhibitionTrigger = { start: 100, end: 1100 }, exhibitionTimeline;
		function setupWorkAnimations() { reducedMotionMode.value = true; exhibitionTrigger = undefined; reducedMotionActivationEnabled = true }
		${closeTargetCode}
		return reconcileAndResolveCloseTarget;
	`)(...Object.values(dependencies))
	const target = await resolve(0)
	assert.equal(restored, 1050)
	assert.equal(target.fadeOnly, true)
})

test('resize during expansion completes fullscreen and cancels the superseded opening run', async () => {
	const layer = createTransitionHarness()
	const opening = layer.open()
	layer.resolveNext()
	layer.fonts.resolve()
	await settle()
	assert.equal(layer.animations.length, 2)
	layer.resize()
	await opening
	assert.equal(layer.isOpening.value, false)
	assert.equal(layer.events.filter(event => event === 'opened').length, 1)
})

test('the switch coordinator flushes a pending close only after restoring its open lifecycle', async () => {
	const work = createWorkHarness(async (index, selected) => { selected.value = index; return true })
	assert.equal(await work.handleProjectChangeRequest(1), true)
	assert.deepEqual(work.flushes, ['open'])
})


test('Work title scales down throughout the entire pinned card sequence', () => {
	const stack = createWorkStackHarness()
	const exit = stack.titleExit
	assert.equal(exit.from.scale, 1)
	assert.equal(exit.to.scale, 0.5)
	assert.equal(exit.to.scrollTrigger.start(), 100)
	assert.equal(exit.to.scrollTrigger.end() - exit.to.scrollTrigger.start(), stack.config.animation.duration())
	assert.equal(exit.to.scrollTrigger.scrub, true)
	stack.cleanup()
	assert(stack.titleExitDisposed())
	gsap.ticker.sleep()
})


const switchedCloseCode = await componentCode('src/components/sections/SectionHomeWork.vue', [
	'handleProjectChangeRequest', 'reconcileAndResolveCloseTarget',
	'getExhibitionProjectScrollY', 'synchronizeExhibitionScroll'
])

test('open A, switch to B, then close: settle B under the fullscreen overlay before measuring and collapsing', async () => {
	let progress = 0.2, scrollY = 300
	const events = []
	const layer = createTransitionHarness({ top: () => progress === 0.7 ? 0 : 1200 })
	layer.isOpening.value = false
	const selectedProjectIndex = { value: 0 }, overlayLifecycle = { value: 'open' }
	const route = { query: { case: 'a' } }
	const projects = { value: [{ slug: 'a', caseStatus: 'published' }, { slug: 'b', caseStatus: 'published' }] }
	const overlay = { navigateToProject: async index => { selectedProjectIndex.value = index; return true } }
	const dependencies = {
		selectedProjectIndex, overlayLifecycle, route, projects, projectCount: 2,
		projectLayer: { value: overlay }, isProjectPublished: () => true,
		setOverlayLifecycle: value => { overlayLifecycle.value = value },
		writeCaseUrl: async index => { route.query.case = projects.value[index].slug },
		window: { innerWidth: 1200, innerHeight: 900, getComputedStyle: () => ({ borderRadius: '0px' }) },
		openingViewport: { width: 1200, height: 900 }, openingProjectIndex: 0, openingStackProgress: 0.2,
		openingHomepageScrollY: 300, reducedMotionMode: { value: false }, prefersReducedMotion: () => false,
		exhibitionTrigger: { start: 100, end: 1100, getTween: () => undefined },
		exhibitionTimeline: { duration: () => 1000, labels: { 'project-1': 700 }, progress(value) {
			if (value !== undefined) { progress = value; events.push('pose') }
			return progress
		} },
		setPortfolioScrollY: value => { scrollY = value; events.push('scroll') },
		projectCards: [null, layer.card], hiddenProjectIndex: { value: 0 },
		waitForAnimationFrame: async () => { assert(!layer.events.includes('target-ready')); events.push('frame') },
		updateVisualProjectActivation() {}, updateReducedMotionActivation() {},
		DEBUG_PROJECT_CLOSE: false, debugProjectClose() {}, validateFrozenHomepageScroll() {},
		getPortfolioScrollY: () => scrollY, activeProjectIndex: { value: 0 }, interactiveProjectIndex: { value: 0 },
		events
	}
	const api = new Function(...Object.keys(dependencies), `
		let stackNeedsRefresh = false, isRestoringProjectClose = false, reducedMotionActivationEnabled = false;
		let isWorkMounted = true, lastSynchronizedCase, frozenStackProgress = 0.2;
		// A scroll update can still report A while ScrollSmoother settles its new position.
		const ScrollTrigger = { update() { events.push('update'); exhibitionTimeline.progress(frozenStackProgress) } };
		${switchedCloseCode}
		return { switchProject: handleProjectChangeRequest, resolve: reconcileAndResolveCloseTarget };
	`)(...Object.values(dependencies))
	assert.equal(await api.switchProject(1), true)
	assert.equal(route.query.case, 'b')
	assert.equal(progress, 0.2, 'switching inside the overlay must leave the background frozen at A')
	const target = await api.resolve(selectedProjectIndex.value)
	assert.equal(target.card, layer.card)
	assert.equal(target.homepageScrollY, 800)
	assert.equal(target.rect.top, 0, 'measure B only after its arrival pose is rendered')
	assert.equal(target.fadeOnly, false)
	assert(events.indexOf('scroll') < events.indexOf('frame'))
	assert(events.indexOf('update') < events.indexOf('frame'))
	layer.isClosing.value = true
	const closing = layer.close(target)
	assert.equal(layer.animations[0].steps[0][1].clipPath, 'inset(0px 0px 234px 0px)')
	assert.equal(layer.animations[0].steps[0][1].duration, 0.48)
	layer.resolveNext()
	await settle()
	layer.resolveNext()
	assert.equal(await closing, true)
})

test('Life interests continue the intro line stagger and reverse together', async () => {
	const source = await readFile('src/components/sections/HomeLifeStackExperiment.vue', 'utf8')
	const script = source.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)[1]
	const parsed = ts.createSourceFile('life.ts', script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
	let body
	function visit(node) {
		if (ts.isMethodDeclaration(node) && node.name.getText(parsed) === 'onSplit') {
			body = node.body.getText(parsed).slice(1, -1)
		}
		ts.forEachChild(node, visit)
	}
	visit(parsed)
	const lines = [{ yPercent: 0, opacity: 1 }, { yPercent: 0, opacity: 1 }]
	const pills = Array.from({ length: 5 }, () => ({ autoAlpha: 1, y: 0 }))
	const dependencies = {
		gsap: { set: gsap.set, timeline: () => gsap.timeline({ paused: true }) },
		wrapSplitLines() {}, introRef: { value: { visibility: 'hidden' } },
		interestRefs: { value: pills }, root: { value: {} },
		animationDurations: { reveal: 0.8, fast: 0.3 },
		animationStaggers: { lines: 0.1 }, animationEases: { strongOut: 'power3.out', backOut: 'back.out(1.7)' }
	}
	const timeline = new Function('split', ...Object.keys(dependencies), ts.transpileModule(body, {
		compilerOptions: { target: ts.ScriptTarget.ESNext }
	}).outputText)({ lines }, ...Object.values(dependencies))
	try {
		timeline.time(0.2)
		assert(lines.some(line => line.yPercent > 0))
		assert(pills.every(pill => pill.autoAlpha === 0))
		timeline.time(0.35)
		assert(pills[0].autoAlpha > pills[1].autoAlpha)
		assert.equal(pills[2].autoAlpha, 0)
		timeline.progress(1)
		assert(pills.every(pill => pill.autoAlpha === 1 && pill.y === 0))
		timeline.time(0)
		assert(pills.every(pill => pill.autoAlpha === 0 && pill.y === 12))
	} finally { timeline.kill(); gsap.ticker.sleep() }
})

const heroResponsiveSplitCode = await componentCode('src/components/sections/SectionHomeHero.vue', ['createResponsiveLineSplit'])

test('mobile hero introduction waits for viewport entry and returns its tween to SplitText for cleanup', () => {
	const element = {}, chars = [{}]
	const reveals = []
	const tween = {}
	let splitOptions
	const createSplit = new Function('SplitText', 'gsap', 'wrapSplitElements', 'scheduleSplitRefresh',
		'animationDurations', 'animationStaggers', 'animationEases', `${heroResponsiveSplitCode}; return createResponsiveLineSplit`)(
		class { constructor(_element, options) { splitOptions = options } },
		{ set() {}, fromTo(target, from, to) { reveals.push({ target, from, to }); return tween } },
		() => {}, () => {}, { reveal: 0.8 }, { chars: 0.015 }, { backOut: 'back.out' }
	)
	createSplit(element)
	assert.equal(splitOptions.onSplit({ chars }), undefined)
	assert.equal(reveals.length, 0)
	createSplit(element, true)
	assert.equal(splitOptions.onSplit({ chars }), tween)
	assert.equal(reveals[0].target, chars)
	assert.equal(reveals[0].from.yPercent, 115)
	assert.equal(reveals[0].to.yPercent, 0)
	assert.deepEqual(reveals[0].to.scrollTrigger, { trigger: element, start: 'top 90%', once: true })
})
