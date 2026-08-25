<template>
	<section class="work-section" id="work" ref="root">
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
					:interactive="interactiveProjectIndex === projectIndex - 1"
					:transition-hidden="hiddenProjectIndex === projectIndex - 1"
					@open="openProject"
				/>
			</div>
		</div>
		<ProjectLayerPrototype
			v-if="isProjectOpen && layerOrigin && openSourceCard"
			ref="projectLayer"
			:projects="projects"
			:project-index="activeProjectIndex"
			:origin="layerOrigin"
			:source-card="openSourceCard"
			@close="closeProject"
			@change-project="changeProject"
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
import { gsap, prefersReducedMotion, ScrollTrigger, SplitText, registerGsapPlugins } from '../../utils/animations/gsap'
import {
	getPortfolioScrollY,
	setPortfolioScrollY
} from '../../utils/animations/portfolioScrollSmoother'
import ProjectCard from '../work/ProjectCard.vue'
import ProjectLayerPrototype from '../work/ProjectLayerPrototype.vue'

const { t } = useI18n()
const { projects } = usePortfolioContent()
const projectCount = projects.value.length

const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const exhibition = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLHeadingElement | null>(null)
const projectLayer = ref<InstanceType<typeof ProjectLayerPrototype> | null>(null)
const activeProjectIndex = ref(0)
const interactiveProjectIndex = ref<number | null>(null)
const isProjectOpen = ref(false)
const hiddenProjectIndex = ref<number | null>(null)
const layerOrigin = ref<LayerOrigin | null>(null)
const openSourceCard = shallowRef<HTMLElement | null>(null)

let ctx: gsap.Context | undefined
let splitTitle: SplitText | undefined
let titleRevealTween: gsap.core.Tween | undefined
let titleRefreshId = 0
let exhibitionTimeline: gsap.core.Timeline | undefined
let exhibitionTrigger: ReturnType<typeof ScrollTrigger.create> | undefined
let projectCards: HTMLElement[] = []
let reducedMotionActivationEnabled = false
let projectOpenScrollY: number | undefined
let projectOpenIndex: number | undefined
const TITLE_REVEAL_SCROLL_DISTANCE = 1.6

const DEBUG_EXHIBITION_ACTIVATION = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugExhibitionActivation')

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

function openProject(payload: { projectIndex: number; sourceElement: HTMLElement }) {
	if (
		interactiveProjectIndex.value !== payload.projectIndex
		|| !isProjectPublished(projects.value[payload.projectIndex])
	) return

	layerOrigin.value = getElementOrigin(payload.sourceElement)
	openSourceCard.value = payload.sourceElement
	projectOpenScrollY = getPortfolioScrollY()
	projectOpenIndex = payload.projectIndex
	activeProjectIndex.value = payload.projectIndex
	hiddenProjectIndex.value = null
	isProjectOpen.value = true
}

function hideActiveProjectCard() {
	hiddenProjectIndex.value = activeProjectIndex.value
}

function showActiveProjectCard() {
	hiddenProjectIndex.value = null
}

async function closeProject() {
	const closingProjectIndex = activeProjectIndex.value
	const sourceElement = projectCards[closingProjectIndex]
	if (!sourceElement || !projectLayer.value) return

	syncExhibitionProject(closingProjectIndex)
	await projectLayer.value.animateClose(sourceElement)
	isProjectOpen.value = false
	hiddenProjectIndex.value = null
	layerOrigin.value = null
	openSourceCard.value = null
	await nextTick()

	const closingProjectScrollY = projectOpenIndex === closingProjectIndex
		? projectOpenScrollY
		: getExhibitionProjectScrollY(closingProjectIndex) ?? projectOpenScrollY

	if (closingProjectScrollY !== undefined) {
		setPortfolioScrollY(closingProjectScrollY)
		ScrollTrigger.update()
	}
	projectOpenScrollY = undefined
	projectOpenIndex = undefined

	// Keep the visual state exact after ScrollTrigger resumes from the overlay.
	syncExhibitionProject(closingProjectIndex)
	sourceElement.focus({ preventScroll: true })
}

function getExhibitionProjectScrollY(projectIndex: number) {
	if (!exhibitionTimeline || !exhibitionTrigger) return undefined

	const labelPosition = exhibitionTimeline.labels[`project-${projectIndex}`]
	if (labelPosition === undefined) return undefined

	const progress = labelPosition / exhibitionTimeline.duration()

	return exhibitionTrigger.start
		+ (exhibitionTrigger.end - exhibitionTrigger.start) * progress
}

function syncExhibitionProject(projectIndex: number) {
	if (
		projectIndex < 0
		|| projectIndex >= projectCount
		|| !exhibitionTimeline
	) return

	const labelPosition = exhibitionTimeline.labels[`project-${projectIndex}`]
	const progress = labelPosition / exhibitionTimeline.duration()

	activeProjectIndex.value = projectIndex
	interactiveProjectIndex.value = projectIndex

	// Align the exhibition with the selected case without moving the page.
	exhibitionTimeline.progress(progress)
}

function changeProject(nextIndex: number) {
	if (nextIndex < 0 || nextIndex >= projectCount) return

	activeProjectIndex.value = nextIndex
	interactiveProjectIndex.value = nextIndex
	hiddenProjectIndex.value = nextIndex
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
	if (root.value) delete root.value.dataset.sectionNavigationScrollY
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
			onRefresh(self) {
				if (root.value) {
					root.value.dataset.sectionNavigationScrollY = String(self.end)
				}
			}
		}
	})
}

function getCardState(cardIndex: number, activeIndex: number) {
	const relativeIndex = cardIndex - activeIndex
	const direction = Math.sign(relativeIndex)
	const distance = Math.abs(relativeIndex)
	const cardSpacing = readCssNumber('--exhibition-card-spacing', 58)
	const rotation = readCssNumber('--exhibition-card-rotation', 8)
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

function updateVisualProjectActivation(cards: HTMLElement[], useVerticalAxis = false) {
	// The open project layer owns the active index. Ignore delayed scrub/snap
	// updates from the covered exhibition after synchronizing another project.
	if (isProjectOpen.value) return

	if (cards.length === 0) {
		interactiveProjectIndex.value = null
		return
	}

	const viewportCenter = useVerticalAxis
		? window.innerHeight / 2
		: window.innerWidth / 2
	const activeRadius = readCssNumber('--exhibition-active-radius', 140)
	let nearestIndex = 0
	let nearestDistance = Number.POSITIVE_INFINITY

	const measurements = cards.map((card, index) => {
		const rect = card.getBoundingClientRect()
		const cardCenter = useVerticalAxis
			? rect.top + rect.height / 2
			: rect.left + rect.width / 2
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
	interactiveProjectIndex.value = nearestDistance <= activeRadius
		? nearestIndex
		: null

	if (DEBUG_EXHIBITION_ACTIVATION) {
		console.table(measurements.map((measurement) => ({
			...measurement,
			nearestIndex,
			activeRadius,
			interactive: interactiveProjectIndex.value === measurement.index
		})))
	}
}

function updateReducedMotionActivation() {
	if (!reducedMotionActivationEnabled) return

	updateVisualProjectActivation(projectCards, true)
}

function setupExhibition() {
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
		window.addEventListener('resize', updateReducedMotionActivation)
		requestAnimationFrame(updateReducedMotionActivation)
		return
	}

	const transitionDistance = readCssNumber('--exhibition-transition-distance', 1)
	const restDistance = readCssNumber('--exhibition-rest-distance', 0.58)
	const entryDistance = readCssNumber('--exhibition-entry-distance', 0.82)
	const titleRevealDistance = readCssNumber('--exhibition-title-reveal-distance', 0.92)
	const titleRestDistance = readCssNumber('--exhibition-title-rest-distance', 0.62)
	const exitDistance = readCssNumber('--exhibition-exit-distance', 0.9)
	const scrollPerProject = readCssNumber('--exhibition-scroll-per-project', 92)
	const rotation = readCssNumber('--exhibition-card-rotation', 8)
	const rotationScale = readCssNumber('--exhibition-rotation-scale', 0.95)

	cards.forEach((card, index) => {
		gsap.set(card, {
			x: window.innerWidth * (1.05 + index * 0.38),
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
			xPercent: (index: number) => getCardState(index, 0).xPercent,
			yPercent: -50,
			rotationY: (index: number) => getCardState(index, 0).rotationY,
			scale: (index: number) => getCardState(index, 0).scale,
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
				...getCardState(cardIndex, activeIndex),
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
				-window.innerWidth * (1.05 + (projectCount - index - 1) * 0.38)
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
			y: () => -window.innerHeight,
			duration: exitDistance * 0.78,
			stagger: 0.06,
			ease: 'power4.in'
		}, position + restDistance)

	const snapPoints = Array.from({ length: projectCount }, (_, index) => (
		timeline.labels[`project-${index}`] / timeline.duration()
	))
	const scrollDistance = timeline.duration() * window.innerHeight * (scrollPerProject / 100)
	const snapRange = readCssNumber('--exhibition-snap-range', 240)
	const snapThreshold = snapRange / scrollDistance

	exhibitionTrigger = ScrollTrigger.create({
		trigger: root.value,
		start: 'top top',
		end: `+=${scrollDistance}`,
		pin: root.value,
		pinSpacing: true,
		scrub: true,
		anticipatePin: 1,
		invalidateOnRefresh: true,
		animation: timeline,
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
}

onMounted(() => {
	registerGsapPlugins()

	ctx = gsap.context(() => {
		setupTitleReveal()

		setupExhibition()
	}, root.value ?? undefined)

	requestAnimationFrame(() => {
		ScrollTrigger.refresh()
	})
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
	titleRefreshId += 1
	window.removeEventListener('scroll', updateReducedMotionActivation)
	window.removeEventListener('resize', updateReducedMotionActivation)
	reducedMotionActivationEnabled = false
	exhibitionTrigger = undefined
	exhibitionTimeline = undefined
	projectCards = []
	cleanupTitleReveal()
	ctx?.revert()
})
</script>
