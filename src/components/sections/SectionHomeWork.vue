<template>
	<section class="work-section" id="work" ref="root">
		<div class="work-section__stage" ref="stage">
			<div class="work-section__title-wrapper" aria-hidden="true">
				<div class="work-section__title-inner">
					<h2 class="work-section__title huge-title" ref="titleRef">Work.</h2>
				</div>
			</div>

			<div
				class="work-section__exhibition"
				ref="exhibition"
				aria-label="Selected work exhibition"
			>
				<ProjectCard
					v-for="projectIndex in projectCount"
					:key="projectIndex"
					:index="projectIndex - 1"
					:active="activeProjectIndex === projectIndex - 1"
					:interactive="interactiveProjectIndex === projectIndex - 1"
					:transition-hidden="openProjectIndex === projectIndex - 1"
					@open="openProject"
				/>
			</div>
		</div>
		<ProjectLayerPrototype
			v-if="openProjectIndex !== null && layerOrigin"
			ref="projectLayer"
			:project-index="openProjectIndex"
			:origin="layerOrigin"
			@close="closeProject"
			@header-contrast-change="emit('overlay-change', $event)"
		/>
	</section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { gsap, prefersReducedMotion, ScrollTrigger, SplitText, registerGsapPlugins } from '../../utils/animations/gsap'
import ProjectCard from '../work/ProjectCard.vue'
import ProjectLayerPrototype from '../work/ProjectLayerPrototype.vue'

const emit = defineEmits<{
	'overlay-change': [isOpen: boolean]
}>()

const projectCount = 4

const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const exhibition = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLHeadingElement | null>(null)
const projectLayer = ref<InstanceType<typeof ProjectLayerPrototype> | null>(null)
const activeProjectIndex = ref(0)
const interactiveProjectIndex = ref<number | null>(null)
const openProjectIndex = ref<number | null>(null)
const openProjectSource = ref<HTMLElement | null>(null)
const layerOrigin = ref<LayerOrigin | null>(null)

let ctx: gsap.Context | undefined
let splitTitle: SplitText | undefined

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
	if (interactiveProjectIndex.value !== payload.projectIndex) return

	openProjectSource.value = payload.sourceElement
	layerOrigin.value = getElementOrigin(payload.sourceElement)
	openProjectIndex.value = payload.projectIndex
}

async function closeProject() {
	if (!openProjectSource.value || !projectLayer.value) return

	const sourceElement = openProjectSource.value
	await projectLayer.value.animateClose(getElementOrigin(sourceElement))
	openProjectIndex.value = null
	layerOrigin.value = null
	openProjectSource.value = null
	await nextTick()
	sourceElement.focus({ preventScroll: true })
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

function setupExhibition() {
	if (
		!root.value
		|| !stage.value
		|| !exhibition.value
		|| !titleRef.value
	) return

	const cards = gsap.utils.toArray<HTMLElement>('[data-project-card]', exhibition.value)
	if (cards.length === 0) return
	const shadowsFromLeft = cards.map((card) => (
		card.querySelector<HTMLElement>('[data-project-shadow-from-left]')
	))
	const shadowsFromRight = cards.map((card) => (
		card.querySelector<HTMLElement>('[data-project-shadow-from-right]')
	))
	if (shadowsFromLeft.some((shadow) => !shadow) || shadowsFromRight.some((shadow) => !shadow)) return
	const titleChars = splitTitle?.chars ?? []

	if (prefersReducedMotion()) return

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

	const galleryEntryPosition = titleRevealDistance + titleRestDistance

	timeline
		.to(titleChars, {
			y: 0,
			duration: titleRevealDistance * 0.78,
			stagger: 0.06,
			ease: 'power4.out'
		}, 0)
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
	const activeWindows = snapPoints.map((_, index) => {
		const start = timeline.labels[`project-${index}`]

		return {
			index,
			start,
			end: start + restDistance
		}
	})
	const scrollDistance = timeline.duration() * window.innerHeight * (scrollPerProject / 100)
	const snapRange = readCssNumber('--exhibition-snap-range', 100)
	const snapThreshold = snapRange / scrollDistance

	ScrollTrigger.create({
		trigger: root.value,
		start: 'top top',
		end: `+=${scrollDistance}`,
		pin: root.value,
		pinSpacing: true,
		scrub: true,
		anticipatePin: 1,
		invalidateOnRefresh: true,
		animation: timeline,
		onUpdate: (self) => {
			const currentTime = self.progress * timeline.duration()
			const activeWindow = activeWindows.find((window) => (
				currentTime >= window.start && currentTime <= window.end
			))

			interactiveProjectIndex.value = activeWindow?.index ?? null
			if (activeWindow) {
				activeProjectIndex.value = activeWindow.index
			}
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
		if (titleRef.value && !prefersReducedMotion()) {
			splitTitle = new SplitText(titleRef.value, {
				type: 'chars',
				charsClass: 'split-display-char'
			})

			wrapSplitElements(splitTitle.chars, 'split-display-char-wrapper')

			gsap.set(splitTitle.chars, {
				y: () => window.innerHeight,
				yPercent: 0
			})

		}

		setupExhibition()
	}, root.value ?? undefined)

	requestAnimationFrame(() => {
		ScrollTrigger.refresh()
	})
})

onUnmounted(() => {
	emit('overlay-change', false)
	ctx?.revert()
	splitTitle?.revert()
})
</script>
