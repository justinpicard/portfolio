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
		assert.equal(stack.cards[0]['--work-card-scale'], 0.95)
		assert.equal(stack.cards[1]['--work-card-entry'], 0.5)
		assert.equal(stack.interactiveProjectIndex.value, null)
		stack.seek(2.92)
		assert.equal(stack.cards[0]['--work-card-scale'], 0.9)
		assert.equal(stack.cards[0]['--work-card-depth'], '3%')
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

const workSnapSource = await readFile('src/components/sections/SectionHomeWork.vue', 'utf8')
const workSnapScript = workSnapSource.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)[1]
const workSnapAst = ts.createSourceFile('SectionHomeWork.ts', workSnapScript, ts.ScriptTarget.Latest, true)
let workSnapObject
function findWorkSnap(node) {
	if (ts.isPropertyAssignment(node) && node.name.getText(workSnapAst) === 'snap'
		&& ts.isObjectLiteralExpression(node.initializer)) workSnapObject = node.initializer
	ts.forEachChild(node, findWorkSnap)
}
findWorkSnap(workSnapAst)
assert(workSnapObject)
const workSnapCode = ts.transpileModule(`return ${workSnapObject.getText(workSnapAst)};`, {
	compilerOptions: { target: ts.ScriptTarget.ESNext }
}).outputText

function createWorkSnapHarness(compact = false, suppressed = false) {
	return new Function('useNativeSticky', 'snapPoints', 'snapThreshold', 'isExhibitionSnapSuppressed', 'cancelExhibitionSnap', workSnapCode)(
		compact, [0.2, 0.4, 0.6, 0.8, 0.95], 0.03, () => suppressed, () => {}
	)
}

test('desktop snaps near actual project positions and preserves off-target scroll despite predicted progress', () => {
	const snap = createWorkSnapHarness()
	const trigger = progress => ({ start: 100, end: 1100, scroll: () => 100 + progress * 1000 })
	assert.equal(snap.inertia, false)
	assert.equal(snap.snapTo(0.8, trigger(0.42)), 0.4)
	assert.equal(snap.snapTo(0.2, trigger(0.58)), 0.6)
	assert.equal(snap.snapTo(0.6, trigger(0.5)), 0.5)
	assert.equal(snap.snapTo(0.2, trigger(0.73)), 0.73)
	for (const point of [0.2, 0.4, 0.6, 0.8, 0.95]) assert.equal(snap.snapTo(point, trigger(point)), point)
	assert.equal(snap.delay, 0.04)
	assert.deepEqual(snap.duration, { min: 0.1, max: 0.22 })
	assert.equal(snap.ease, 'power1.inOut')
	assert.equal(createWorkSnapHarness(false, true).snapTo(0.8, trigger(0.42)), 0.42)
})

test('compact coverflow keeps its original inertia and predicted-progress snapping', () => {
	const snap = createWorkSnapHarness(true)
	assert.equal(snap.inertia, undefined)
	assert.equal(snap.snapTo(0.79, { start: 0, end: 1000, scroll: () => 500 }), 0.8)
	assert.equal(snap.snapTo(0.5, { start: 0, end: 1000, scroll: () => 800 }), 0.5)
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


test('phone rear cards become progressively smaller and lower while reverse scroll restores their poses', () => {
	const stack = createMobileStackHarness(400)
	try {
		const timeline = stack.config.animation
		const duration = timeline.duration()
		stack.seek(timeline.labels['project-4'])
		for (let index = 0; index < 4; index++) {
			assert.equal(stack.cards[index]['--work-card-depth'], `${(4 - index) * 3}%`)
			assert(stack.cards[index]['--work-card-scale'] < stack.cards[index + 1]['--work-card-scale'])
		}
		assert.equal(stack.cards[3]['--work-card-scale'], 0.9)
		assert.equal(stack.cards[4]['--work-card-scale'], 1)
		assert.equal(stack.interactiveProjectIndex.value, 4)
		stack.seek(timeline.labels['project-1'])
		assert.equal(stack.cards[0]['--work-card-scale'], 0.9)
		assert.equal(stack.cards[0]['--work-card-depth'], '3%')
		assert.equal(stack.cards[1]['--work-card-scale'], 1)
		assert.equal(stack.cards[1]['--work-card-depth'], '0px')
		assert.equal(stack.interactiveProjectIndex.value, 1)
		assert.equal(timeline.duration(), duration)
	} finally { stack.cleanup(); gsap.ticker.sleep() }
})
