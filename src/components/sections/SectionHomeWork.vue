<template>
	<section class="section work-section" id="work" ref="root">
		<div class="work-section__title-wrapper">
			<div class="work-section__title-inner">
				<h2 class="work-section__title huge-title" ref="titleRef">Work.</h2>
			</div>
		</div>
		<div class="work-section__projects">
			<ProjectCard
				v-for="project in orderedProjects"
				:key="project.id"
				:project="project"
				:index="project.index"
				:media-hidden="transitionHiddenProjectIndex === project.index"
				@open="emit('open-project', $event)"
			/>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { gsap, prefersReducedMotion, ScrollTrigger, SplitText, registerGsapPlugins } from '../../utils/animations/gsap'
import projects from '../../data/projects.json'
import ProjectCard from '../work/ProjectCard.vue'
import type { Project, ProjectOpenPayload } from '../../types/project'

withDefaults(defineProps<{
	transitionHiddenProjectIndex?: number | null
}>(), {
	transitionHiddenProjectIndex: null
})

const emit = defineEmits<{
	'open-project': [payload: ProjectOpenPayload]
}>()

const root = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLHeadingElement | null>(null)
let splitTitle: SplitText | undefined
let ctx: gsap.Context | undefined
let stackTriggers: Array<ReturnType<typeof ScrollTrigger.create>> = []

const projectData = projects as Project[]

const orderedProjects = computed(() => (
	projectData.map((project, index) => ({
		...project,
		index
	}))
))

function wrapSplitElements(elements: Element[], className: string, tagName: 'span' = 'span') {
	elements.forEach((element) => {
		const wrapper = document.createElement(tagName)
		wrapper.classList.add(className)
		element.parentNode?.insertBefore(wrapper, element)
		wrapper.appendChild(element)
	})
}

function setupProjectStack() {
	if (!root.value || prefersReducedMotion()) return

	const projectsElement = root.value.querySelector<HTMLElement>('.work-section__projects')
	const cards = gsap.utils.toArray<HTMLElement>('[data-project-card]', root.value)
	if (!projectsElement || cards.length === 0) return

	const getCenteredPinOffset = (card: HTMLElement) => (
		Math.max((window.innerHeight - card.getBoundingClientRect().height) / 2, 0)
	)
	const sectionStyles = window.getComputedStyle(root.value)
	const stackOffset = Number.parseFloat(sectionStyles.getPropertyValue('--project-stack-offset')) || 12
	const scaleStep = 0.018

	stackTriggers = cards.map((card, index) => {
		const remainingCards = cards.length - index - 1
		const targetScale = index === cards.length - 1
			? 1
			: 1 - remainingCards * scaleStep

		gsap.set(card, {
			zIndex: index + 1,
			transformOrigin: 'center top'
		})

		const tween = gsap.to(card, {
			scale: targetScale,
			ease: 'none',
			paused: true
		})

		return ScrollTrigger.create({
			trigger: card,
			start: () => `top ${getCenteredPinOffset(card) + index * stackOffset}px`,
			endTrigger: projectsElement,
			end: 'bottom bottom',
			pin: true,
			pinSpacing: false,
			scrub: true,
			animation: tween,
			invalidateOnRefresh: true
		})
	})

	requestAnimationFrame(() => {
		ScrollTrigger.refresh()
	})
}

onMounted(() => {
	registerGsapPlugins()

	ctx = gsap.context(() => {
		if (!titleRef.value) return

		splitTitle = new SplitText(titleRef.value, {
			type: 'chars',
			charsClass: 'split-display-char'
		})

		wrapSplitElements(splitTitle.chars, 'split-display-char-wrapper')

		gsap.set(splitTitle.chars, {
			yPercent: 115
		})

		gsap.to(splitTitle.chars, {
			yPercent: 0,
			duration: 0.9,
			stagger: 0.06,
			ease: 'power4.out',
			scrollTrigger: {
				trigger: root.value?.querySelector('.work-section__title-wrapper'),
				start: 'top top',
				toggleActions: 'play none none reverse'
			}
		})

		setupProjectStack()
	}, root.value ?? undefined)
})

onUnmounted(() => {
	stackTriggers.forEach((trigger) => trigger.kill())
	stackTriggers = []
	ctx?.revert()
	splitTitle?.revert()
})
</script>
