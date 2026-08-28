<template>
	<section class="section-layout section-layout--stage work-section" id="work" ref="root">
		<div class="work-section__stage" ref="stage">
			<div class="work-section__title-wrapper" aria-hidden="true">
				<div class="work-section__title-inner">
					<h2 class="work-section__title huge-title" ref="titleRef">{{ t('home.workLabel') }}</h2>
				</div>
			</div>

			<div
				class="work-section__exhibition"
				ref="exhibition"
				:aria-label="t('home.workExhibitionLabel')"
			>
				<ProjectCard
					v-for="projectIndex in projectCount"
					:key="projectIndex"
					:index="projectIndex - 1"
					:project="projects[projectIndex - 1]"
					:active="activeProjectIndex === projectIndex - 1"
					:interactive="overlayLifecycle === 'closed'
						&& interactiveProjectIndex === projectIndex - 1"
					:transition-hidden="hiddenProjectIndex === projectIndex - 1"
					@open="openProject"
				/>
			</div>
		</div>
		<ProjectLayerPrototype
			v-if="isProjectLayerMounted && layerOrigin && openSourceCard"
			ref="projectLayer"
			:projects="projects"
			:project-index="selectedProjectIndex"
			:origin="layerOrigin"
			:source-card="openSourceCard"
			@close="closeProject"
			@request-project-change="handleProjectChangeRequest"
			@project-change-commit="commitProjectChange"
			@opened="handleProjectOpened"
			@switch-complete="debugProjectClose('switch-complete')"
			@content-hidden="debugProjectClose('outgoing content fade complete')"
			@close-complete="debugProjectClose('animateClose resolved')"
			@source-ready="hideActiveProjectCard"
			@target-ready="showActiveProjectCard"
		/>
	</section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePortfolioContent } from '../../composables/usePortfolioContent'
import { isProjectPublished } from '../../content'
import type { WorkCloseTarget, WorkOverlayLifecycle } from '../../config/workOverlay'
import { gsap, prefersReducedMotion, ScrollTrigger, SplitText, registerGsapPlugins } from '../../utils/animations/gsap'
import {
	getPortfolioScrollY,
	lockPortfolioScrollSmoothing,
	setPortfolioScrollY
} from '../../utils/animations/portfolioScrollSmoother'
import ProjectCard from '../work/ProjectCard.vue'
import ProjectLayerPrototype from '../work/ProjectLayerPrototype.vue'

const { t } = useI18n()
const { projects } = usePortfolioContent()
const projectCount = projects.value.length
const emit = defineEmits<{
	'overlay-lifecycle-change': [lifecycle: WorkOverlayLifecycle]
}>()

const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const exhibition = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLHeadingElement | null>(null)
const projectLayer = ref<InstanceType<typeof ProjectLayerPrototype> | null>(null)
const activeProjectIndex = ref(0)
const selectedProjectIndex = ref(0)
const interactiveProjectIndex = ref<number | null>(null)
const isProjectLayerMounted = ref(false)
const hiddenProjectIndex = ref<number | null>(null)
const layerOrigin = ref<LayerOrigin | null>(null)
const openSourceCard = shallowRef<HTMLElement | null>(null)
const overlayLifecycle = ref<WorkOverlayLifecycle>('closed')

let ctx: gsap.Context | undefined
let splitTitle: SplitText | undefined
let titleRevealTween: gsap.core.Tween | undefined
let titleRefreshId = 0
let exhibitionTimeline: gsap.core.Timeline | undefined
let exhibitionTrigger: ReturnType<typeof ScrollTrigger.create> | undefined
let exhibitionMediaContext: gsap.MatchMedia | undefined
let projectCards: HTMLElement[] = []
let projectCardWidths: number[] = []
let viewportWidth = 0
let viewportHeight = 0
let exhibitionActiveRadius = 140
let reducedMotionCardCenters: number[] = []
let reducedMotionActivationEnabled = false
let isRestoringProjectClose = false
let openingHomepageScrollY: number | undefined
let openingProjectIndex: number | undefined
let previousDocumentOverflow = ''
let unlockHomepageScrollSmoothing: (() => void) | undefined
const TITLE_REVEAL_SCROLL_DISTANCE = 1.6
const DESKTOP_LAYOUT_QUERY = '(min-width: 64rem)'
const COMPACT_LAYOUT_QUERY = '(max-width: 63.999rem)'

const DEBUG_EXHIBITION_ACTIVATION = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugExhibitionActivation')
const DEBUG_PROJECT_CLOSE = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugProjectClose')

type LayerOrigin = {
	top: number
	left: number
	width: number
	height: number
	borderRadius: string
}

function getElementOrigin(element: HTMLElement): LayerOrigin {
	const rect = element.getBoundingClientRect()

	return {
		top: rect.top,
		left: rect.left,
		width: rect.width,
		height: rect.height,
		borderRadius: window.getComputedStyle(element).borderRadius
	}
}

function debugProjectClose(message: string, detail?: unknown) {
	if (!DEBUG_PROJECT_CLOSE) return

	if (detail === undefined) {
		console.debug(`[Project close] ${message}`)
		return
	}

	console.debug(`[Project close] ${message}`, detail)
}

function openProject(payload: { projectIndex: number; sourceElement: HTMLElement }) {
	if (
		interactiveProjectIndex.value !== payload.projectIndex
		|| !isProjectPublished(projects.value[payload.projectIndex])
	) return

	layerOrigin.value = getElementOrigin(payload.sourceElement)
	openSourceCard.value = payload.sourceElement
	activeProjectIndex.value = payload.projectIndex
	selectedProjectIndex.value = payload.projectIndex
	hiddenProjectIndex.value = null
	openingHomepageScrollY = getPortfolioScrollY()
	openingProjectIndex = payload.projectIndex
	debugProjectClose('homepage scroll captured at open', {
		projectIndex: payload.projectIndex,
		homepageScrollY: openingHomepageScrollY,
		viewport: {
			width: window.innerWidth,
			height: window.innerHeight,
			visualHeight: window.visualViewport?.height
		},
		sourceRect: layerOrigin.value
	})
	suspendExhibitionTracking()
	lockHomepageScroll()
	setOverlayLifecycle('opening')
	isProjectLayerMounted.value = true
}

function lockHomepageScroll() {
	if (unlockHomepageScrollSmoothing) return

	previousDocumentOverflow = document.documentElement.style.overflow
	unlockHomepageScrollSmoothing = lockPortfolioScrollSmoothing()
	document.documentElement.style.overflow = 'hidden'
	debugProjectClose('homepage scroll locked', {
		homepageScrollY: getPortfolioScrollY(),
		documentOverflow: document.documentElement.style.overflow
	})
}

function unlockHomepageScroll() {
	if (!unlockHomepageScrollSmoothing) return

	document.documentElement.style.overflow = previousDocumentOverflow
	unlockHomepageScrollSmoothing()
	unlockHomepageScrollSmoothing = undefined
	debugProjectClose('scroll unlocked', {
		homepageScrollY: getPortfolioScrollY(),
		documentOverflow: document.documentElement.style.overflow
	})
}

function suspendExhibitionTracking() {
	if (!exhibitionTrigger) return

	const hadActiveSnap = Boolean(exhibitionTrigger.getTween(true))
	// Keep the current pin and card transforms, but stop the delayed/active snap
	// from owning the window scroll while the fixed project layer is active.
	exhibitionTrigger.disable(false, false)
	debugProjectClose('Work ScrollTrigger suspended', { hadActiveSnap })
}

function resumeExhibitionTracking() {
	if (!exhibitionTrigger) return

	exhibitionTrigger.enable(false, false)
	debugProjectClose('Work ScrollTrigger resumed')
}

function synchronizeExhibitionScroll(scrollY: number) {
	resumeExhibitionTracking()
	setPortfolioScrollY(scrollY)
	ScrollTrigger.update()
	// update() applies the timeline synchronously. Suspend immediately afterward
	// so its snap delay cannot reclaim the homepage scroll during the overlay.
	suspendExhibitionTracking()
}

function setOverlayLifecycle(lifecycle: WorkOverlayLifecycle) {
	if (overlayLifecycle.value === lifecycle) return

	overlayLifecycle.value = lifecycle
	emit('overlay-lifecycle-change', lifecycle)
}

function handleProjectOpened() {
	if (overlayLifecycle.value === 'opening') setOverlayLifecycle('open')
	validateFrozenHomepageScroll('open')
}

async function handleProjectChangeRequest(nextIndex: number) {
	const layer = projectLayer.value
	if (
		overlayLifecycle.value !== 'open'
		|| !layer
		|| nextIndex < 0
		|| nextIndex >= projectCount
		|| nextIndex === selectedProjectIndex.value
		|| !isProjectPublished(projects.value[nextIndex])
	) return

	debugProjectClose('homepage scroll before project switch', {
		homepageScrollY: getPortfolioScrollY(),
		openingHomepageScrollY
	})
	validateFrozenHomepageScroll('switching')
	setOverlayLifecycle('switching')
	try {
		await layer.navigateToProject(nextIndex, true)
	} catch (error) {
		if (DEBUG_PROJECT_CLOSE) {
			console.error('[Project close] caught exception', {
				transaction: 'project switch coordinator',
				error
			})
		}
	} finally {
		if ((overlayLifecycle.value as WorkOverlayLifecycle) === 'switching') {
			setOverlayLifecycle('open')
		}
		debugProjectClose('homepage scroll after project switch', {
			homepageScrollY: getPortfolioScrollY(),
			openingHomepageScrollY
		})
		validateFrozenHomepageScroll('open')
	}
}

function validateFrozenHomepageScroll(phase: 'open' | 'switching') {
	if (openingHomepageScrollY === undefined) return

	const homepageScrollY = getPortfolioScrollY()
	if (Math.abs(homepageScrollY - openingHomepageScrollY) <= 0.5) return

	if (DEBUG_PROJECT_CLOSE) {
		console.warn('[Project close] homepage scroll changed while overlay owns scroll', {
			phase,
			openingHomepageScrollY,
			homepageScrollY
		})
	}
}

function hideActiveProjectCard() {
	hiddenProjectIndex.value = activeProjectIndex.value
}

function showActiveProjectCard() {
	hiddenProjectIndex.value = null
}

async function closeProject(source: 'button' | 'escape') {
	const selectedClosingProjectIndex = selectedProjectIndex.value
	const closeTargetProjectIndex = selectedClosingProjectIndex
	const layer = projectLayer.value
	let closeCompleted = false
	let resolvedCloseTarget: WorkCloseTarget | null = null
	debugProjectClose('close intent received by coordinator', {
		source,
		lifecycle: overlayLifecycle.value,
		selectedClosingProjectIndex,
		closeTargetProjectIndex,
		hasProjectLayer: Boolean(layer),
		isProjectLayerMounted: isProjectLayerMounted.value
	})

	if (!layer || overlayLifecycle.value !== 'open') {
		if (DEBUG_PROJECT_CLOSE) {
			console.warn('[Project close] close rejected by lifecycle', {
				source,
				selectedClosingProjectIndex,
				closeTargetProjectIndex,
				hasProjectLayer: Boolean(layer),
				lifecycle: overlayLifecycle.value
			})
		}
		return
	}

	debugProjectClose('final selected project on close', {
		selectedClosingProjectIndex,
		closeTargetProjectIndex
	})
	setOverlayLifecycle('closing')
	debugProjectClose('lifecycle → closing')
	debugProjectClose('animateClose start')

	try {
		debugProjectClose('hideCloseContent start')
		const contentHidden = await layer.hideCloseContent()
		if (!contentHidden) {
			debugProjectClose('hideCloseContent interrupted')
			return
		}

		resolvedCloseTarget = await reconcileAndResolveCloseTarget(closeTargetProjectIndex)
		if (!resolvedCloseTarget) return

		debugProjectClose('finishClose start', { rect: resolvedCloseTarget.rect })
		closeCompleted = await layer.finishClose(resolvedCloseTarget)
	} catch (error) {
		if (DEBUG_PROJECT_CLOSE) {
			console.error('[Project close] caught exception', {
				transaction: 'project close',
				error
			})
		}
	} finally {
		if (!closeCompleted) {
			await restoreOpeningWorkState()
			layer.cancelClose()
			setOverlayLifecycle('open')
			return
		}

		// ScrollTrigger normally establishes the centred card. Use the selected
		// project only when the resulting geometry cannot identify one.
		if (interactiveProjectIndex.value === null) {
			activeProjectIndex.value = closeTargetProjectIndex
			interactiveProjectIndex.value = closeTargetProjectIndex
		}

		isProjectLayerMounted.value = false
		hiddenProjectIndex.value = null
		layerOrigin.value = null
		openSourceCard.value = null

		await nextTick()
		debugProjectClose('overlay unmounted')
		unlockHomepageScroll()
		resumeExhibitionTracking()
		if (resolvedCloseTarget) {
			setPortfolioScrollY(resolvedCloseTarget.homepageScrollY)
			ScrollTrigger.update()
			debugProjectClose('final homepage scroll restored', {
				expectedScrollY: resolvedCloseTarget.homepageScrollY,
				actualScrollY: getPortfolioScrollY()
			})
		}
		setOverlayLifecycle('closed')
		debugProjectClose('lifecycle → closed')
		openingHomepageScrollY = undefined
		openingProjectIndex = undefined
		await nextTick()
		projectCards[closeTargetProjectIndex]?.focus({ preventScroll: true })
	}
}

function getExhibitionProjectScrollY(projectIndex: number) {
	if (reducedMotionActivationEnabled) {
		const cardCenter = reducedMotionCardCenters[projectIndex]
		return cardCenter === undefined ? undefined : cardCenter - viewportHeight / 2
	}

	if (!exhibitionTimeline || !exhibitionTrigger) return undefined

	const labelPosition = exhibitionTimeline.labels[`project-${projectIndex}`]
	if (labelPosition === undefined) return undefined

	const progress = labelPosition / exhibitionTimeline.duration()

	return exhibitionTrigger.start
		+ (exhibitionTrigger.end - exhibitionTrigger.start) * progress
}

function waitForAnimationFrame() {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve())
	})
}

async function restoreOpeningWorkState() {
	if (openingHomepageScrollY === undefined) return

	isRestoringProjectClose = true
	try {
		hiddenProjectIndex.value = openingProjectIndex ?? null
		synchronizeExhibitionScroll(openingHomepageScrollY)
		await waitForAnimationFrame()

		if (exhibitionTrigger) {
			updateVisualProjectActivation(projectCards)
		} else if (reducedMotionActivationEnabled) {
			updateReducedMotionActivation()
		}
	} finally {
		isRestoringProjectClose = false
	}
}

async function reconcileAndResolveCloseTarget(projectIndex: number) {
	const targetScrollY = projectIndex === openingProjectIndex
		? openingHomepageScrollY
		: getExhibitionProjectScrollY(projectIndex)
	if (targetScrollY === undefined) {
		if (DEBUG_PROJECT_CLOSE) {
			console.warn('[Project close] Work scroll target could not be resolved', {
				projectIndex
			})
		}
		return null
	}

	isRestoringProjectClose = true
	try {
		debugProjectClose('Work scroll reconciliation start', {
			projectIndex,
			targetScrollY
		})
		debugProjectClose('hidden close reconciliation target scroll', {
			projectIndex,
			targetScrollY
		})
		hiddenProjectIndex.value = projectIndex
		synchronizeExhibitionScroll(targetScrollY)
		// Work card transforms are ScrollTrigger-driven. One centralized frame wait
		// lets those transforms settle before capturing the collapse geometry.
		await waitForAnimationFrame()

		if (exhibitionTrigger) {
			updateVisualProjectActivation(projectCards)
		} else if (reducedMotionActivationEnabled) {
			updateReducedMotionActivation()
		}

		debugProjectClose('actual scroll after reconciliation', {
			homepageScrollY: getPortfolioScrollY()
		})

		const targetCard = projectCards[projectIndex]
		const targetRect = targetCard?.getBoundingClientRect()
		const hasValidTarget = Boolean(
			targetCard?.isConnected
			&& targetRect
			&& targetRect.width > 0
			&& targetRect.height > 0
			&& Number.isFinite(targetRect.left)
			&& Number.isFinite(targetRect.top)
		)

		if (!hasValidTarget || !targetCard || !targetRect) {
			if (DEBUG_PROJECT_CLOSE) {
				console.warn('[Project close] missing target/source card', {
					projectIndex,
					interactiveProjectIndex: interactiveProjectIndex.value
				})
			}
			return null
		}

		debugProjectClose('target card rect after reconciliation', {
			projectIndex,
			top: targetRect.top,
			left: targetRect.left,
			width: targetRect.width,
			height: targetRect.height
		})
		debugProjectClose('source card resolved', { projectIndex })
		if (interactiveProjectIndex.value === null) {
			activeProjectIndex.value = projectIndex
			interactiveProjectIndex.value = projectIndex
		}
		debugProjectClose('Work scroll reconciliation complete', {
			projectIndex,
			interactiveProjectIndex: interactiveProjectIndex.value
		})

		return {
			card: targetCard,
			homepageScrollY: targetScrollY,
			rect: {
				top: targetRect.top,
				left: targetRect.left,
				right: targetRect.right,
				bottom: targetRect.bottom,
				width: targetRect.width,
				height: targetRect.height
			},
			borderRadius: window.getComputedStyle(targetCard).borderRadius
		} satisfies WorkCloseTarget
	} finally {
		isRestoringProjectClose = false
	}
}

function commitProjectChange(nextIndex: number) {
	if (nextIndex < 0 || nextIndex >= projectCount) return

	debugProjectClose('canonical project commit', {
		fromIndex: selectedProjectIndex.value,
		toIndex: nextIndex,
		homepageScrollY: getPortfolioScrollY(),
		openingHomepageScrollY
	})
	selectedProjectIndex.value = nextIndex
	validateFrozenHomepageScroll('switching')
}

function scrollProjectToTop() {
	projectLayer.value?.scrollToTop()
}

function wrapSplitElements(elements: Element[], className: string, tagName: 'span' = 'span') {
	elements.forEach((element) => {
		const wrapper = document.createElement(tagName)
		wrapper.classList.add(className)
		element.parentNode?.insertBefore(wrapper, element)
		wrapper.appendChild(element)
	})
}

function readCssNumber(property: string, fallback: number) {
	if (!root.value) return fallback

	const value = Number.parseFloat(window.getComputedStyle(root.value).getPropertyValue(property))
	return Number.isFinite(value) ? value : fallback
}

function cleanupTitleReveal() {
	titleRevealTween?.scrollTrigger?.kill()
	titleRevealTween?.kill()
	titleRevealTween = undefined
	splitTitle?.revert()
	splitTitle = undefined
	if (root.value) {
		root.value.classList.remove('work-section--title-active')
		delete root.value.dataset.sectionNavigationScrollY
	}
}

function setupTitleReveal() {
	if (!titleRef.value || prefersReducedMotion()) return

	splitTitle = new SplitText(titleRef.value, {
		type: 'chars',
		charsClass: 'split-display-char'
	})

	wrapSplitElements(splitTitle.chars, 'split-display-char-wrapper')

	gsap.set(splitTitle.chars, {
		y: () => (
			window.innerHeight
			* readCssNumber('--exhibition-title-entry-offset', 100)
			/ 100
		),
		yPercent: 0
	})

	titleRevealTween = gsap.to(splitTitle.chars, {
		y: 0,
		stagger: 0.06,
		ease: 'power2.inOut',
		scrollTrigger: {
			trigger: root.value,
			start: 'top bottom',
			end: () => `+=${window.innerHeight * TITLE_REVEAL_SCROLL_DISTANCE}`,
			scrub: true,
			invalidateOnRefresh: true,
			toggleClass: {
				targets: root.value,
				className: 'work-section--title-active'
			},
			onRefresh(self) {
				if (root.value) {
					root.value.dataset.sectionNavigationScrollY = String(self.end)
				}
			}
		}
	})
}

function getCardState(cardIndex: number, activeIndex: number, rotation: number) {
	const relativeIndex = cardIndex - activeIndex
	const direction = Math.sign(relativeIndex)
	const distance = Math.abs(relativeIndex)
	const cardSpacing = readCssNumber('--exhibition-card-spacing', 58)
	const rotationScale = readCssNumber('--exhibition-rotation-scale', 0.95)

	if (distance === 0) {
		return {
			x: 0,
			xPercent: -50,
			yPercent: -50,
			rotationY: 0,
			scale: 1
		}
	}

	return {
		x: 0,
		xPercent: -50 + direction * (cardSpacing + Math.max(distance - 1, 0) * cardSpacing * 0.72),
		yPercent: -50,
		rotationY: direction * -rotation,
		scale: rotationScale
	}
}

function getShadowState(cardIndex: number, activeIndex: number) {
	const relativeIndex = cardIndex - activeIndex
	const shadowOpacity = readCssNumber('--exhibition-shadow-opacity', 0.5)

	return {
		fromLeft: relativeIndex > 0 ? shadowOpacity : 0,
		fromRight: relativeIndex < 0 ? shadowOpacity : 0
	}
}

function getGsapNumber(element: HTMLElement, property: 'x' | 'xPercent') {
	const value = Number(gsap.getProperty(element, property))
	return Number.isFinite(value) ? value : 0
}

function updateVisualProjectActivation(cards: HTMLElement[]) {
	// The open project layer owns the active index. Ignore delayed scrub/snap
	// updates from the covered exhibition after synchronizing another project.
	if (isProjectLayerMounted.value && !isRestoringProjectClose) return

	if (cards.length === 0) {
		interactiveProjectIndex.value = null
		return
	}

	const viewportCenter = viewportWidth / 2
	let nearestIndex = 0
	let nearestDistance = Number.POSITIVE_INFINITY

	const measurements = cards.map((card, index) => {
		const cardCenter = viewportCenter
			+ getGsapNumber(card, 'x')
			+ projectCardWidths[index]
				* (getGsapNumber(card, 'xPercent') + 50)
				/ 100
		const distance = Math.abs(cardCenter - viewportCenter)

		if (distance < nearestDistance) {
			nearestDistance = distance
			nearestIndex = index
		}

		return {
			index,
			cardCenter,
			viewportCenter,
			distance
		}
	})

	activeProjectIndex.value = nearestIndex
	interactiveProjectIndex.value = nearestDistance <= exhibitionActiveRadius
		? nearestIndex
		: null

	if (DEBUG_EXHIBITION_ACTIVATION) {
		console.table(measurements.map((measurement) => ({
			...measurement,
			nearestIndex,
			activeRadius: exhibitionActiveRadius,
			interactive: interactiveProjectIndex.value === measurement.index
		})))
	}
}

function updateReducedMotionActivation() {
	if (!reducedMotionActivationEnabled) return

	const viewportCenter = getPortfolioScrollY() + viewportHeight / 2
	let nearestIndex = 0
	let nearestDistance = Number.POSITIVE_INFINITY

	reducedMotionCardCenters.forEach((cardCenter, index) => {
		const distance = Math.abs(cardCenter - viewportCenter)
		if (distance >= nearestDistance) return

		nearestIndex = index
		nearestDistance = distance
	})

	activeProjectIndex.value = nearestIndex
	interactiveProjectIndex.value = nearestDistance <= exhibitionActiveRadius
		? nearestIndex
		: null
}

function refreshReducedMotionMeasurements() {
	viewportHeight = window.innerHeight
	exhibitionActiveRadius = readCssNumber('--exhibition-active-radius', 140)
	const scrollY = getPortfolioScrollY()
	reducedMotionCardCenters = projectCards.map((card) => {
		const rect = card.getBoundingClientRect()
		return scrollY + rect.top + rect.height / 2
	})
	updateReducedMotionActivation()
}

function setupExhibition(useNativeSticky = false) {
	if (
		!root.value
		|| !stage.value
		|| !exhibition.value
		|| !titleRef.value
	) return

	const cards = gsap.utils.toArray<HTMLElement>('[data-project-card]', exhibition.value)
	if (cards.length === 0) return
	projectCards = cards
	const shadowsFromLeft = cards.map((card) => (
		card.querySelector<HTMLElement>('[data-project-shadow-from-left]')
	))
	const shadowsFromRight = cards.map((card) => (
		card.querySelector<HTMLElement>('[data-project-shadow-from-right]')
	))
	if (shadowsFromLeft.some((shadow) => !shadow) || shadowsFromRight.some((shadow) => !shadow)) return
	const titleChars = splitTitle?.chars ?? []

	if (prefersReducedMotion()) {
		reducedMotionActivationEnabled = true
		window.addEventListener('scroll', updateReducedMotionActivation, { passive: true })
		window.addEventListener('resize', refreshReducedMotionMeasurements)
		requestAnimationFrame(refreshReducedMotionMeasurements)
		return () => {
			window.removeEventListener('scroll', updateReducedMotionActivation)
			window.removeEventListener('resize', refreshReducedMotionMeasurements)
			reducedMotionActivationEnabled = false
			reducedMotionCardCenters = []
		}
	}

	const transitionDistance = readCssNumber('--exhibition-transition-distance', 1)
	const restDistance = readCssNumber('--exhibition-rest-distance', 0.58)
	const entryDistance = readCssNumber('--exhibition-entry-distance', 0.82)
	const titleRevealDistance = readCssNumber('--exhibition-title-reveal-distance', 0.92)
	const titleRestDistance = readCssNumber('--exhibition-title-rest-distance', 0.62)
	const exitDistance = readCssNumber('--exhibition-exit-distance', 0.9)
	const scrollPerProject = readCssNumber('--exhibition-scroll-per-project', 92)
	// Compact touch layouts retain the cover-flow spacing, scale and shadows,
	// but avoid rasterizing every large clipped card into a 3D perspective layer.
	const rotation = useNativeSticky
		? 0
		: readCssNumber('--exhibition-card-rotation', 8)
	const rotationScale = readCssNumber('--exhibition-rotation-scale', 0.95)
	const getScrollDistance = () => (
		timeline.duration() * viewportHeight * (scrollPerProject / 100)
	)
	let snapThreshold = 0

	const refreshMeasurements = () => {
		viewportWidth = window.innerWidth
		viewportHeight = window.innerHeight
		exhibitionActiveRadius = readCssNumber('--exhibition-active-radius', 140)
		projectCardWidths = cards.map((card) => card.offsetWidth)
		const scrollDistance = getScrollDistance()
		snapThreshold = readCssNumber('--exhibition-snap-range', 240) / scrollDistance
		root.value?.style.setProperty('--work-scroll-distance', `${scrollDistance}px`)
	}

	// Cache all geometry before the scroll-linked timeline starts. Refreshes may
	// read layout, but normal scroll updates only read GSAP's transform cache.
	viewportWidth = window.innerWidth
	viewportHeight = window.innerHeight

	cards.forEach((card, index) => {
		gsap.set(card, {
			x: () => viewportWidth * (1.05 + index * 0.38),
			xPercent: -50,
			yPercent: -50,
			rotationY: -rotation * Math.min(1 + index * 0.3, 1.8),
			scale: rotationScale,
			zIndex: projectCount - index,
			transformOrigin: 'center center'
		})

		gsap.set(shadowsFromLeft[index], {
			opacity: getShadowState(index, -1).fromLeft
		})
		gsap.set(shadowsFromRight[index], {
			opacity: getShadowState(index, -1).fromRight
		})
	})

	const timeline = gsap.timeline({
		paused: true,
		defaults: {
			ease: 'power2.inOut'
		}
	})
	exhibitionTimeline = timeline

	const galleryEntryPosition = titleRevealDistance + titleRestDistance

	timeline
		.to({}, { duration: titleRestDistance }, titleRevealDistance)
		.to(cards, {
			x: 0,
			xPercent: (index: number) => getCardState(index, 0, rotation).xPercent,
			yPercent: -50,
			rotationY: (index: number) => getCardState(index, 0, rotation).rotationY,
			scale: (index: number) => getCardState(index, 0, rotation).scale,
			duration: entryDistance,
			stagger: 0.025
		}, galleryEntryPosition)
		.to(shadowsFromLeft, {
			opacity: (index: number) => getShadowState(index, 0).fromLeft,
			duration: entryDistance
		}, galleryEntryPosition)
		.to(shadowsFromRight, {
			opacity: (index: number) => getShadowState(index, 0).fromRight,
			duration: entryDistance
		}, galleryEntryPosition)
		.addLabel('project-0', galleryEntryPosition + entryDistance)

	let position = galleryEntryPosition + entryDistance

	for (let activeIndex = 1; activeIndex < projectCount; activeIndex += 1) {
		timeline.to({}, { duration: restDistance }, position)
		position += restDistance

		cards.forEach((card, cardIndex) => {
			timeline.to(card, {
				...getCardState(cardIndex, activeIndex, rotation),
				zIndex: projectCount - Math.abs(cardIndex - activeIndex),
				duration: transitionDistance
			}, position)

			timeline.to(shadowsFromLeft[cardIndex], {
				opacity: getShadowState(cardIndex, activeIndex).fromLeft,
				duration: transitionDistance
			}, position)
			timeline.to(shadowsFromRight[cardIndex], {
				opacity: getShadowState(cardIndex, activeIndex).fromRight,
				duration: transitionDistance
			}, position)
		})

		position += transitionDistance
		timeline.addLabel(`project-${activeIndex}`, position)
	}

	timeline
		.to({}, { duration: restDistance }, position)
		.to(cards, {
			x: (index: number) => (
				-viewportWidth * (1.05 + (projectCount - index - 1) * 0.38)
			),
			xPercent: -50,
			yPercent: -50,
			rotationY: (index: number) => (
				rotation * Math.min(1 + (projectCount - index - 1) * 0.3, 1.8)
			),
			scale: rotationScale,
			duration: exitDistance,
			stagger: {
				each: 0.025,
				from: 'end'
			}
		}, position + restDistance)
		.to(shadowsFromLeft, {
			opacity: 0,
			duration: exitDistance
		}, position + restDistance)
		.to(shadowsFromRight, {
			opacity: readCssNumber('--exhibition-shadow-opacity', 0.5),
			duration: exitDistance
		}, position + restDistance)
		.to(titleChars, {
			y: () => -viewportHeight,
			duration: exitDistance * 0.78,
			stagger: 0.06,
			ease: 'power4.in'
		}, position + restDistance)

	const snapPoints = Array.from({ length: projectCount }, (_, index) => (
		timeline.labels[`project-${index}`] / timeline.duration()
	))
	refreshMeasurements()

	exhibitionTrigger = ScrollTrigger.create({
		trigger: root.value,
		start: 'top top',
		end: () => `+=${getScrollDistance()}`,
		...(useNativeSticky ? {} : {
			pin: root.value,
			pinSpacing: true
		}),
		scrub: true,
		anticipatePin: useNativeSticky ? 0 : 1,
		invalidateOnRefresh: true,
		animation: timeline,
		toggleClass: {
			targets: root.value,
			className: 'work-section--active'
		},
		onRefreshInit: refreshMeasurements,
		onUpdate: () => {
			updateVisualProjectActivation(cards)
		},
		snap: {
			snapTo: (value: number) => {
				const nearestPoint = snapPoints.reduce((nearest, point) => (
					Math.abs(point - value) < Math.abs(nearest - value) ? point : nearest
				))

				return Math.abs(nearestPoint - value) <= snapThreshold
					? nearestPoint
					: value
			},
			delay: 0.04,
			duration: {
				min: 0.1,
				max: 0.22
			},
			ease: 'power1.inOut'
		}
	})

	const trigger = exhibitionTrigger
	return () => {
		trigger.kill()
		timeline.kill()
		root.value?.classList.remove('work-section--active')
		root.value?.style.removeProperty('--work-scroll-distance')
		projectCardWidths = []
	}
}

onMounted(() => {
	registerGsapPlugins()

	ctx = gsap.context(() => {
		setupTitleReveal()

		if (prefersReducedMotion()) {
			setupExhibition()
			return
		}

		exhibitionMediaContext = gsap.matchMedia()
		exhibitionMediaContext.add({
			desktop: DESKTOP_LAYOUT_QUERY,
			compact: COMPACT_LAYOUT_QUERY
		}, (mediaQueryContext) => (
			setupExhibition(Boolean(mediaQueryContext.conditions?.compact))
		))
	}, root.value ?? undefined)
})

watch(
	() => t('home.workLabel'),
	async () => {
		const refreshId = ++titleRefreshId

		cleanupTitleReveal()
		await nextTick()

		if (refreshId !== titleRefreshId) return

		setupTitleReveal()
		ScrollTrigger.refresh()
	},
	{ flush: 'pre' }
)

onUnmounted(() => {
	setOverlayLifecycle('closed')
	unlockHomepageScroll()
	titleRefreshId += 1
	window.removeEventListener('scroll', updateReducedMotionActivation)
	window.removeEventListener('resize', refreshReducedMotionMeasurements)
	reducedMotionActivationEnabled = false
	reducedMotionCardCenters = []
	exhibitionMediaContext?.revert()
	exhibitionMediaContext = undefined
	exhibitionTrigger = undefined
	exhibitionTimeline = undefined
	projectCards = []
	cleanupTitleReveal()
	ctx?.revert()
})

defineExpose({
	scrollProjectToTop
})
</script>
