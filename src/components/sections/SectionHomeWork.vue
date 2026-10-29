<template>
	<section class="section-layout section-layout--stage work-section" id="work" ref="root" tabindex="-1">
		<div class="work-section__stage" ref="stage">
			<div class="work-section__title-wrapper" ref="titleWrapper">
				<div class="work-section__title-inner">
					<h2 class="work-section__title huge-title" ref="titleRef">{{ t('home.workLabel') }}</h2>
				</div>
			</div>

			<div
				class="work-section__exhibition"
				ref="exhibition"
				:aria-label="t('home.workExhibitionLabel')"
			>
				<nav class="work-section__keyboard-nav" :aria-label="t('project.navigationLabel')">
					<template v-for="(project, index) in projects" :key="project.id">
						<button
							v-if="isProjectPublished(project)"
							type="button"
							@focus="focusKeyboardProject(index)"
							@click="openKeyboardProject(index)"
						>
							{{ t('project.openProject', { title: project.title }) }}
						</button>
					</template>
				</nav>
				<div
					v-for="projectIndex in projectCount"
					:key="projectIndex"
					class="work-section__card-layer"
				>
					<ProjectCard
						:index="projectIndex - 1"
						:project="projects[projectIndex - 1]"
						:active="activeProjectIndex === projectIndex - 1"
						:interactive="overlayLifecycle === 'closed'
							&& (reducedMotionMode || interactiveProjectIndex === projectIndex - 1)"
						:transition-hidden="hiddenProjectIndex === projectIndex - 1"
						:obscured="!reducedMotionMode && interactiveProjectIndex !== projectIndex - 1"
						@open="openProject"
						@inactive-focus="focusWorkSection"
					/>
				</div>
			</div>
		</div>
		<ProjectLayerPrototype
			v-if="isProjectLayerMounted && layerOrigin && openSourceCard"
			ref="projectLayer"
			:projects="projects"
			:project-index="selectedProjectIndex"
			:origin="layerOrigin"
			:source-card="openSourceCard"
			@close="closeProject($event)"
			@request-project-change="handleProjectChangeRequest($event)"
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
import { nextTick, onMounted, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resolveCaseProjectIndex, withCaseQuery } from '../../utils/navigation/caseQuery'
import { useI18n } from 'vue-i18n'
import { usePortfolioContent } from '../../composables/usePortfolioContent'
import { isProjectPublished } from '../../content'
import type { WorkCloseTarget, WorkOverlayLifecycle } from '../../config/workOverlay'
import { gsap, prefersReducedMotion, observeReducedMotion, ScrollTrigger, SplitText, registerGsapPlugins } from '../../utils/animations/gsap'
import { animationDurations, animationEases, animationStaggers } from '../../utils/animations/presets'
import {
	getPortfolioScrollY,
	lockPortfolioScrollSmoothing,
	setPortfolioScrollY
} from '../../utils/animations/portfolioScrollSmoother'
import ProjectCard from '../work/ProjectCard.vue'
import ProjectLayerPrototype from '../work/ProjectLayerPrototype.vue'

const props = defineProps<{ navigationReady?: boolean }>()
const route = useRoute()
const router = useRouter()
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
const titleWrapper = ref<HTMLElement | null>(null)
const projectLayer = ref<InstanceType<typeof ProjectLayerPrototype> | null>(null)
const activeProjectIndex = ref(0)
const selectedProjectIndex = ref(0)
const interactiveProjectIndex = ref<number | null>(null)
const isProjectLayerMounted = ref(false)
const hiddenProjectIndex = ref<number | null>(null)
const layerOrigin = ref<LayerOrigin | null>(null)
const openSourceCard = shallowRef<HTMLElement | null>(null)
const overlayLifecycle = ref<WorkOverlayLifecycle>('closed')
const reducedMotionMode = ref(false)
// TEMPORARY: set after mount to preserve identical server/client initial markup.

let stopObservingMotion: (() => void) | undefined
let cleanupReducedMotionExhibition: (() => void) | undefined
let ctx: gsap.Context | undefined
let stopObservingLayout: (() => void) | undefined
let splitTitle: SplitText | undefined
let titleRevealTween: gsap.core.Tween | undefined
let titleRefreshId = 0
let exhibitionTimeline: gsap.core.Timeline | undefined
let exhibitionTrigger: ReturnType<typeof ScrollTrigger.create> | undefined
let stackNeedsRefresh = false
let projectCards: HTMLElement[] = []
let viewportHeight = 0
let exhibitionActiveRadius = 140
let reducedMotionCardCenters: number[] = []
let reducedMotionActivationEnabled = false
let isRestoringProjectClose = false
let openingHomepageScrollY: number | undefined
let openingProjectIndex: number | undefined
let openingStackProgress: number | undefined
let frozenStackProgress: number | undefined
let openingViewport: { width: number; height: number } | undefined
let previousDocumentOverflow = ''
let backgroundElement: HTMLElement | null = null
let previousBackgroundInert = false
let unlockHomepageScrollSmoothing: (() => void) | undefined
const TITLE_REVEAL_SCROLL_DISTANCE = 1.6
const NATIVE_STICKY_QUERY = '(max-width: 63.999rem) and (hover: none) and (pointer: coarse)'
const COMPACT_LAYOUT_QUERY = '(max-width: 63.999rem)'
const MOBILE_LAYOUT_QUERY = '(max-width: 47.999rem)'

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

function openProject(payload: { projectIndex: number; sourceElement: HTMLElement }, updateUrl = true) {
	if (
		overlayLifecycle.value !== 'closed'
		|| (!reducedMotionMode.value && interactiveProjectIndex.value !== payload.projectIndex)
		|| !isProjectPublished(projects.value[payload.projectIndex])
	) return

	layerOrigin.value = getElementOrigin(payload.sourceElement)
	openSourceCard.value = payload.sourceElement
	activeProjectIndex.value = payload.projectIndex
	selectedProjectIndex.value = payload.projectIndex
	hiddenProjectIndex.value = null
	openingHomepageScrollY = getPortfolioScrollY()
	openingProjectIndex = payload.projectIndex
	openingStackProgress = exhibitionTimeline?.progress()
	frozenStackProgress = openingStackProgress
	openingViewport = { width: window.innerWidth, height: window.innerHeight }
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
	if (updateUrl) lastSynchronizedCase = Symbol('case interaction')
	setOverlayLifecycle('opening')
	suspendExhibitionTracking()
	lockHomepageScroll()
	isProjectLayerMounted.value = true
	if (updateUrl) void writeCaseUrl(payload.projectIndex)
}

function lockHomepageScroll() {
	if (unlockHomepageScrollSmoothing) return

	previousDocumentOverflow = document.documentElement.style.overflow
	backgroundElement = document.getElementById('app')
	previousBackgroundInert = backgroundElement?.inert ?? false
	if (backgroundElement) backgroundElement.inert = true
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
	if (backgroundElement) backgroundElement.inert = previousBackgroundInert
	backgroundElement = null
	unlockHomepageScrollSmoothing()
	unlockHomepageScrollSmoothing = undefined
	debugProjectClose('scroll unlocked', {
		homepageScrollY: getPortfolioScrollY(),
		documentOverflow: document.documentElement.style.overflow
	})
}

function suspendExhibitionTracking() {
	// Keep the pin enabled: global font/layout refreshes must retain its spacing.
	const scrubTween = exhibitionTrigger?.getTween()
	if (scrubTween) scrubTween.pause()
	exhibitionTimeline?.pause()
}

function synchronizeExhibitionScroll(scrollY: number) {
	const progress = exhibitionTrigger
		? Math.min(1, Math.max(0, (scrollY - exhibitionTrigger.start) / (exhibitionTrigger.end - exhibitionTrigger.start)))
		: undefined
	// Smoother updates may lag behind the scroll write; freeze the destination before they run.
	frozenStackProgress = progress
	setPortfolioScrollY(scrollY)
	ScrollTrigger.update()
	const scrubTween = exhibitionTrigger?.getTween()
	if (scrubTween) scrubTween.progress(1)
	if (progress !== undefined) exhibitionTimeline?.progress(progress)
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

async function handleProjectChangeRequest(nextIndex: number, updateUrl = true): Promise<boolean> {
	const layer = projectLayer.value
	if (
		overlayLifecycle.value !== 'open'
		|| !layer
		|| nextIndex < 0
		|| nextIndex >= projectCount
		|| nextIndex === selectedProjectIndex.value
		|| !isProjectPublished(projects.value[nextIndex])
	) return false

	debugProjectClose('homepage scroll before project switch', {
		homepageScrollY: getPortfolioScrollY(),
		openingHomepageScrollY
	})
	validateFrozenHomepageScroll('switching')
	if (updateUrl) lastSynchronizedCase = Symbol('case interaction')
	setOverlayLifecycle('switching')
	const requestedSlug = projects.value[nextIndex].slug
	let switchCompleted = false
	try {
		if (updateUrl) await writeCaseUrl(nextIndex)
		switchCompleted = await layer.navigateToProject(nextIndex, true)
		return switchCompleted
	} catch (error) {
		if (DEBUG_PROJECT_CLOSE) {
			console.error('[Project close] caught exception', {
				transaction: 'project switch coordinator',
				error
			})
		}
		return false
	} finally {
		// A newer history request belongs to the next transaction, not this rollback.
		if (isWorkMounted && projectLayer.value === layer && !switchCompleted
			&& route.query.case === requestedSlug) {
			await writeCaseUrl(selectedProjectIndex.value, true)
		}
		if (isWorkMounted && projectLayer.value === layer
			&& (overlayLifecycle.value as WorkOverlayLifecycle) === 'switching') {
			setOverlayLifecycle('open')
			layer.flushPendingClose?.()
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

async function closeProject(source: 'button' | 'escape', updateUrl = true) {
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
	if (updateUrl) lastSynchronizedCase = Symbol('case interaction')
	const requestedCase = updateUrl ? undefined : route.query.case
	setOverlayLifecycle('closing')
	if (updateUrl) void writeCaseUrl()
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
		const closeViewport = { width: window.innerWidth, height: window.innerHeight }
		closeCompleted = await layer.finishClose(resolvedCloseTarget)
		if (closeCompleted && (stackNeedsRefresh
			|| closeViewport.width !== window.innerWidth || closeViewport.height !== window.innerHeight
			|| reducedMotionMode.value !== prefersReducedMotion())) {
			resolvedCloseTarget = await reconcileAndResolveCloseTarget(closeTargetProjectIndex)
			closeCompleted = resolvedCloseTarget !== null
		}
	} catch (error) {
		if (DEBUG_PROJECT_CLOSE) {
			console.error('[Project close] caught exception', {
				transaction: 'project close',
				error
			})
		}
	} finally {
		if (!isWorkMounted || projectLayer.value !== layer) return
		if (!closeCompleted) {
			await restoreOpeningWorkState()
			layer.cancelClose()
			if (route.query.case === requestedCase) {
				await writeCaseUrl(selectedProjectIndex.value, true)
			}
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
		openingStackProgress = undefined
		frozenStackProgress = undefined
		openingViewport = undefined
		await nextTick()
		projectCards[closeTargetProjectIndex]?.focus({ preventScroll: true })
	}
}

function getExhibitionProjectScrollY(projectIndex: number) {
	if (reducedMotionActivationEnabled) {
		const card = projectCards[projectIndex]
		if (!card) return undefined
		const rect = card.getBoundingClientRect()
		return getPortfolioScrollY() + rect.top + rect.height / 2 - window.innerHeight / 2
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
	const viewportChanged = openingViewport !== undefined
		&& (openingViewport.width !== window.innerWidth || openingViewport.height !== window.innerHeight)
	const sameProject = projectIndex === openingProjectIndex
	const needsRebuild = stackNeedsRefresh || viewportChanged || reducedMotionMode.value !== prefersReducedMotion()
	if (needsRebuild) {
		isRestoringProjectClose = true
		try {
			setupWorkAnimations()
			ScrollTrigger.refresh()
		} finally {
			isRestoringProjectClose = false
		}
	}
	const progressScrollY = openingStackProgress !== undefined && exhibitionTrigger
		? exhibitionTrigger.start + openingStackProgress * (exhibitionTrigger.end - exhibitionTrigger.start)
		: undefined
	const targetScrollY = sameProject
		? progressScrollY ?? (needsRebuild ? getExhibitionProjectScrollY(projectIndex) : openingHomepageScrollY)
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
			borderRadius: window.getComputedStyle(targetCard).borderRadius,
			fadeOnly: viewportChanged || needsRebuild
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

function getWorkViewportHeight() {
	// Measure the CSS-sized mask only during setup/refresh, never on scroll updates.
	// Compact masks use svh; desktop retains its existing viewport choreography.
	return window.matchMedia(COMPACT_LAYOUT_QUERY).matches
		? titleWrapper.value?.clientHeight || window.innerHeight
		: window.innerHeight
}

function setupTitleReveal() {
	if (!titleRef.value || prefersReducedMotion()) return

	const isMobile = window.matchMedia(MOBILE_LAYOUT_QUERY).matches
	if (window.matchMedia(COMPACT_LAYOUT_QUERY).matches && !isMobile) {
		splitTitle = new SplitText(titleRef.value, {
			type: 'lines',
			linesClass: 'split-line',
			tag: 'span',
			autoSplit: true,
			onSplit(split) {
				wrapSplitElements(split.lines, 'split-line-wrapper')
				gsap.set(split.lines, { yPercent: 110, opacity: 1 })

				titleRevealTween = gsap.to(split.lines, {
					yPercent: 0,
					opacity: 1,
					duration: animationDurations.reveal,
					stagger: animationStaggers.lines,
					ease: animationEases.strongOut,
					scrollTrigger: {
						trigger: root.value,
						// Reveal once the pinned stage holds the title at viewport center.
						start: 'top top',
						toggleActions: 'play none none reverse',
						invalidateOnRefresh: true,
						onRefresh(self) {
							if (root.value) {
								root.value.dataset.sectionNavigationScrollY = String(self.start)
							}
						}
					}
				})

				return titleRevealTween
			}
		})
		return
	}

	splitTitle = new SplitText(titleRef.value, {
		type: 'chars',
		charsClass: 'split-display-char',
		aria: 'auto'
	})

	wrapSplitElements(splitTitle.chars, 'split-display-char-wrapper')

	gsap.set(splitTitle.chars, {
		y: () => (
			getWorkViewportHeight()
			* readCssNumber('--exhibition-title-entry-offset', 100)
			/ 100
		),
		yPercent: 0
	})

	titleRevealTween = gsap.to(splitTitle.chars, {
		y: 0,
		yPercent: 0,
		stagger: 0.06,
		ease: 'power2.inOut',
		scrollTrigger: {
			trigger: root.value,
			start: 'top bottom',
			end: () => `+=${getWorkViewportHeight() * TITLE_REVEAL_SCROLL_DISTANCE}`,
			scrub: isMobile ? 0.8 : true,
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

function updateVisualProjectActivation(cards: HTMLElement[]) {
	if (isProjectLayerMounted.value && !isRestoringProjectClose) return
	if (!exhibitionTimeline || !stage.value) return

	const time = exhibitionTimeline.time()
	const stageRect = stage.value.getBoundingClientRect()
	let foregroundIndex = 0
	// Scroll restoration can round a label to the next pixel.
	while (foregroundIndex < cards.length - 1
		&& time > exhibitionTimeline.labels[`project-${foregroundIndex}`] + 0.5) {
		foregroundIndex += 1
	}
	const rect = cards[foregroundIndex]?.getBoundingClientRect()
	activeProjectIndex.value = foregroundIndex
	interactiveProjectIndex.value = rect
		&& Math.min(rect.bottom, stageRect.bottom, window.innerHeight) > Math.max(rect.top, stageRect.top, 0)
		&& Math.min(rect.right, stageRect.right, window.innerWidth) > Math.max(rect.left, stageRect.left, 0)
		? foregroundIndex : null
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

function setupExhibition() {
	if (!root.value || !stage.value || !exhibition.value) return

	const cards = gsap.utils.toArray<HTMLElement>('[data-project-card]', exhibition.value)
	const layers = gsap.utils.toArray<HTMLElement>('.work-section__card-layer', exhibition.value)
	if (!cards.length) return
	projectCards = cards
	const animated = !prefersReducedMotion()
	root.value.classList.toggle('work-section--stack', animated)

	if (!animated) {
		reducedMotionActivationEnabled = true
		window.addEventListener('scroll', updateReducedMotionActivation, { passive: true })
		window.addEventListener('resize', refreshReducedMotionMeasurements)
		refreshReducedMotionMeasurements()
		return () => {
			window.removeEventListener('scroll', updateReducedMotionActivation)
			window.removeEventListener('resize', refreshReducedMotionMeasurements)
			reducedMotionActivationEnabled = false
		}
	}

	const useNativeSticky = window.matchMedia(NATIVE_STICKY_QUERY).matches
	root.value.classList.toggle('work-section--native-sticky', useNativeSticky)
	const tiltAngles = [1.5, -3.5, 2, -2.5, 1]
	const timeline = gsap.timeline({
		paused: true,
		defaults: { ease: 'none' },
		onUpdate: () => updateVisualProjectActivation(cards)
	})
	exhibitionTimeline = timeline
	let totalDistance = 0
	let sizeSignature = ''
	// The visible stage follows browser chrome; timeline geometry stays on svh.
	const getScrollStageHeight = () => useNativeSticky
		? titleWrapper.value!.clientHeight
		: stage.value!.clientHeight
	const measure = () => [stage.value!.clientWidth, getScrollStageHeight(),
		...layers.map(layer => layer.offsetHeight)].join(':')
	const buildTimeline = () => {
		const nextSignature = measure()
		if (sizeSignature === nextSignature) return
		if (isProjectLayerMounted.value && !isRestoringProjectClose) {
			stackNeedsRefresh = true
			return
		}
		sizeSignature = nextSignature
		viewportHeight = getScrollStageHeight()
		const introDistance = viewportHeight * 0.3
		const outroDistance = viewportHeight * 0.35
		let nextTop = viewportHeight
		const positions = layers.map(layer => {
			const top = nextTop
			nextTop += layer.offsetHeight
			return top
		})
		const lastArrival = introDistance + positions[positions.length - 1]!
		totalDistance = lastArrival + outroDistance
		// Replace pin spacing with an equal native scroll track on touch layouts.
		if (useNativeSticky) root.value!.style.setProperty('--work-scroll-distance', `${totalDistance}px`)
		timeline.clear()
		gsap.set(layers, {
			zIndex: (index: number) => index + 1,
			...(useNativeSticky ? {
				'--work-card-y': (index: number) => `${positions[index]}px`,
				'--work-card-entry': 1
			} : { y: (index: number) => positions[index] })
		})
		gsap.set(cards, { scale: 1, rotation: 0, rotationX: 0, transformOrigin: '50% 10%' })
		if (useNativeSticky) {
			// Apply the same toolbar offset to every card so their spacing stays intact.
			timeline.to(layers, { '--work-card-entry': 0, duration: viewportHeight }, introDistance)
		}

		layers.forEach((layer, index) => {
			const distance = positions[index]!
			const arrival = introDistance + distance
			timeline.fromTo(layer, useNativeSticky
				? { '--work-card-y': `${distance}px` }
				: { y: distance }, {
				duration: distance, immediateRender: false,
				...(useNativeSticky ? { '--work-card-y': '0px' } : { y: 0 })
			}, introDistance)
			timeline.addLabel(`project-${index}`, arrival)
			if (index === cards.length - 1) return
			timeline.to(cards[index]!, {
				scale: 0.7, rotationX: 40,
				rotation: tiltAngles[index % tiltAngles.length],
				duration: lastArrival - arrival
			}, arrival)
		})
		timeline.to({}, { duration: outroDistance }, lastArrival)
	}
	buildTimeline()
	const trigger = ScrollTrigger.create({
		trigger: root.value,
		start: 'top top',
		end: () => `+=${totalDistance}`,
		...(useNativeSticky ? {} : { pin: root.value, pinSpacing: true }),
		scrub: useNativeSticky ? 0.8 : true,
		anticipatePin: 1,
		animation: timeline,
		onRefreshInit: buildTimeline,
		onRefresh: () => {
			if (isProjectLayerMounted.value && !isRestoringProjectClose && frozenStackProgress !== undefined) {
				timeline.progress(frozenStackProgress)
			}
		},
		onUpdate: () => {
			if (isProjectLayerMounted.value && !isRestoringProjectClose && frozenStackProgress !== undefined) {
				timeline.progress(frozenStackProgress)
			}
			// Timeline updates already synchronize the foreground card.
		}
	})
	exhibitionTrigger = trigger
	const titleScaleTween = titleRef.value ? gsap.fromTo(titleRef.value, { scale: 1 }, {
		scale: 0.5,
		ease: 'none',
		scrollTrigger: {
			trigger: root.value,
			start: () => trigger.start,
			end: () => trigger.end,
			scrub: useNativeSticky ? 0.8 : true,
			invalidateOnRefresh: true
		}
	}) : undefined
	let refreshFrame = 0
	const observer = new ResizeObserver(() => {
		if (measure() === sizeSignature) return
		if (isProjectLayerMounted.value) {
			stackNeedsRefresh = true
			return
		}
		cancelAnimationFrame(refreshFrame)
		refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh())
	})
	observer.observe(stage.value)
	layers.forEach(layer => observer.observe(layer))
	updateVisualProjectActivation(cards)
	return () => {
		observer.disconnect()
		cancelAnimationFrame(refreshFrame)
		titleScaleTween?.scrollTrigger?.kill()
		titleScaleTween?.kill()
		trigger.kill()
		timeline.kill()
		root.value?.classList.remove('work-section--stack', 'work-section--native-sticky')
		root.value?.style.removeProperty('--work-scroll-distance')
	}
}

async function writeCaseUrl(projectIndex?: number, replace = false) {
	const slug = projectIndex === undefined ? undefined : projects.value[projectIndex]?.slug
	if (route.query.case === slug) return
	const location = { query: withCaseQuery(route.query, slug), hash: route.hash }
	await (replace ? router.replace(location) : router.push(location))
}

let synchronizingCaseRoute = false
// Explicit controls can change the overlay even if history returns to the previous URL.
let lastSynchronizedCase: unknown = Symbol('uninitialized case route')
let isWorkMounted = false

async function synchronizeCaseRoute() {
	if (!isWorkMounted || !props.navigationReady || synchronizingCaseRoute
		|| (overlayLifecycle.value !== 'closed' && overlayLifecycle.value !== 'open')
		|| route.query.case === lastSynchronizedCase) return
	const requestedCase = route.query.case
	const index = resolveCaseProjectIndex(projects.value, route.query.case)
	if (route.query.case !== undefined && index < 0) {
		await writeCaseUrl(undefined, true)
		return
	}
	synchronizingCaseRoute = true
	lastSynchronizedCase = requestedCase
	try {
		if (index < 0) {
			if (overlayLifecycle.value === 'open') await closeProject('button', false)
		} else if (overlayLifecycle.value === 'closed') {
			focusKeyboardProject(index)
			await nextTick()
			await waitForAnimationFrame()
			if (!isWorkMounted || resolveCaseProjectIndex(projects.value, route.query.case) !== index) return
			const sourceElement = projectCards[index]
			if (sourceElement) openProject({ projectIndex: index, sourceElement }, false)
		} else if (selectedProjectIndex.value !== index) {
			await handleProjectChangeRequest(index, false)
		}
	} finally {
		synchronizingCaseRoute = false
		// Only a new URL can start another transaction; a failed unchanged request settles once.
		if (isWorkMounted && route.query.case !== requestedCase) {
			void synchronizeCaseRoute()
		}
	}
}

watch([() => route.query.case, () => props.navigationReady, overlayLifecycle], () => {
	void synchronizeCaseRoute()
}, { flush: 'post' })

function setupWorkAnimations() {
	cleanupReducedMotionExhibition?.()
	cleanupReducedMotionExhibition = undefined
	cleanupTitleReveal()
	ctx?.revert()
	exhibitionTrigger = undefined
	exhibitionTimeline = undefined
	stackNeedsRefresh = false
	reducedMotionMode.value = prefersReducedMotion()
	ctx = gsap.context(() => {
		setupTitleReveal()
		cleanupReducedMotionExhibition = setupExhibition()
	}, root.value ?? undefined)
}

function refreshWorkMotion() {
	// The close coordinator owns pin geometry until the dialog has fully unmounted.
	if (!isWorkMounted || overlayLifecycle.value !== 'closed' || (!stackNeedsRefresh && reducedMotionMode.value === prefersReducedMotion())) return
	const rect = root.value?.getBoundingClientRect()
	const wasViewingWork = rect && rect.top <= 0 && rect.bottom > 0
	const projectIndex = activeProjectIndex.value
	setupWorkAnimations()
	ScrollTrigger.refresh()
	if (wasViewingWork) {
		requestAnimationFrame(() => focusKeyboardProject(projectIndex))
	}
}

function focusKeyboardProject(projectIndex: number) {
	if (overlayLifecycle.value !== 'closed') return
	const scrollY = getExhibitionProjectScrollY(projectIndex)
	if (scrollY === undefined) return
	setPortfolioScrollY(scrollY)
	ScrollTrigger.update()
	// Explicit focus destinations must settle immediately despite touch scrubbing.
	const scrubTween = exhibitionTrigger?.getTween()
	if (scrubTween) scrubTween.progress(1)
	activeProjectIndex.value = projectIndex
	interactiveProjectIndex.value = projectIndex
}

function focusWorkSection() {
	// Preserve the user's scroll when a focused card leaves the activation radius.
	if (overlayLifecycle.value === 'closed') root.value?.focus({ preventScroll: true })
}

async function openKeyboardProject(projectIndex: number) {
	focusKeyboardProject(projectIndex)
	await nextTick()
	const sourceElement = projectCards[projectIndex]
	if (sourceElement) openProject({ projectIndex, sourceElement })
}

onMounted(() => {
	isWorkMounted = true
	registerGsapPlugins()
	setupWorkAnimations()
	stopObservingMotion = observeReducedMotion(refreshWorkMotion)
	const layoutQueries = [COMPACT_LAYOUT_QUERY, MOBILE_LAYOUT_QUERY, NATIVE_STICKY_QUERY].map(query => window.matchMedia(query))
	const refreshLayout = () => {
		stackNeedsRefresh = true
		refreshWorkMotion()
	}
	layoutQueries.forEach(query => query.addEventListener('change', refreshLayout))
	stopObservingLayout = () => layoutQueries.forEach(query => query.removeEventListener('change', refreshLayout))
})

watch(overlayLifecycle, (lifecycle) => {
	if (lifecycle === 'closed') refreshWorkMotion()
})

watch(
	() => t('home.workLabel'),
	async () => {
		const refreshId = ++titleRefreshId

		cleanupTitleReveal()
		await nextTick()

		if (refreshId !== titleRefreshId) return

		setupWorkAnimations()
		ScrollTrigger.refresh()
	},
	{ flush: 'pre' }
)

onBeforeUnmount(() => {
	isWorkMounted = false
	stopObservingMotion?.()
	stopObservingLayout?.()
	cleanupReducedMotionExhibition?.()
	setOverlayLifecycle('closed')
	unlockHomepageScroll()
	titleRefreshId += 1
	window.removeEventListener('scroll', updateReducedMotionActivation)
	window.removeEventListener('resize', refreshReducedMotionMeasurements)
	reducedMotionActivationEnabled = false
	reducedMotionCardCenters = []
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
