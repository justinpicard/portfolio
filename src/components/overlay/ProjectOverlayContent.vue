<template>
	<article
		ref="content"
		class="project-overlay"
		:class="{ 'project-overlay--opening-transition': openingTransitionActive }"
	>
		<div class="project-overlay__media-column">
			<div
				ref="firstMediaFrame"
				class="project-overlay__media project-overlay__media--first"
				:class="{ 'project-overlay__media--transition-hidden': firstMediaHidden }"
			>
				<BaseImage
					class-name="project-overlay__image"
					:src="`/images/${activeProject.image}`"
					:alt="activeProject.name"
					aspect-ratio="3 / 3.75"
				/>
			</div>

			<div
				v-for="(image, index) in secondaryImages"
				:key="image"
				:ref="setSecondaryMediaItem"
				class="project-overlay__media project-overlay__secondary-media"
			>
				<BaseImage
					class-name="project-overlay__image"
					:src="`/images/${image}`"
					:alt="`${activeProject.name} project image ${index + 2}`"
					aspect-ratio="16 / 10"
				/>
			</div>
		</div>

		<aside
			ref="sidebar"
			class="project-overlay__sidebar"
		>
			<header class="project-overlay__header">
				<p class="project-overlay__number">{{ formattedNumber }}</p>
				<h2
					id="project-overlay-title"
					ref="title"
					class="project-overlay__title"
				>
					{{ activeProject.name }}
				</h2>
				<p
					ref="meta"
					class="project-overlay__meta"
				>
					{{ activeProject.type }} · {{ activeProject.job }} · {{ activeProject.year }}
				</p>
			</header>

			<div
				ref="body"
				class="project-overlay__body"
			>
				<p>
					A compact project introduction will be added here in the case-study pass.
					For now this overlay uses the existing project data and image as the source of truth.
				</p>
			</div>

			<a
				class="project-overlay__link"
				:href="activeProject.link"
				target="_blank"
				rel="noreferrer"
			>
				Visit project
			</a>

			<footer
				ref="nav"
				class="project-overlay__nav"
			>
				<button
					class="project-overlay__nav-button"
					type="button"
					:disabled="isTransitioning"
					@click="changeProject(previousIndex, 'previous')"
				>
					<span class="project-overlay__nav-label">Previous project</span>
					<span class="project-overlay__nav-title">{{ previousProject.name }}</span>
				</button>
				<button
					class="project-overlay__nav-button project-overlay__nav-button--next"
					type="button"
					:disabled="isTransitioning"
					@click="changeProject(nextIndex, 'next')"
				>
					<span class="project-overlay__nav-label">Next project</span>
					<span class="project-overlay__nav-title">{{ nextProject.name }}</span>
				</button>
			</footer>
		</aside>
	</article>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUpdate, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/animations/gsap'
import type { Project } from '../../types/project'
import BaseImage from '../base/BaseImage.vue'
import { overlayScrollContainerKey } from './overlayContext'

const props = defineProps<{
	projects: Project[]
	activeIndex: number
	firstMediaHidden?: boolean
	openingTransitionActive?: boolean
}>()

const emit = defineEmits<{
	'change-project': [nextIndex: number]
}>()

const content = ref<HTMLElement | null>(null)
const firstMediaFrame = ref<HTMLElement | null>(null)
const sidebar = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const meta = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)
const nav = ref<HTMLElement | null>(null)
const secondaryMediaItems = ref<HTMLElement[]>([])
const scrollContainer = inject(overlayScrollContainerKey)
const isTransitioning = ref(false)

const activeProject = computed(() => props.projects[props.activeIndex])
const secondaryImages = computed(() => activeProject.value.secondaryImages ?? [])
const previousIndex = computed(() => (
	(props.activeIndex - 1 + props.projects.length) % props.projects.length
))
const nextIndex = computed(() => (
	(props.activeIndex + 1) % props.projects.length
))
const previousProject = computed(() => props.projects[previousIndex.value])
const nextProject = computed(() => props.projects[nextIndex.value])
const formattedNumber = computed(() => String(props.activeIndex + 1).padStart(2, '0'))

function resetOverlayScroll() {
	scrollContainer?.value?.scrollTo({
		top: 0,
		behavior: 'auto'
	})
}

function setSecondaryMediaItem(element: Element | ComponentPublicInstance | null) {
	if (element instanceof HTMLElement) {
		secondaryMediaItems.value.push(element)
	}
}

function tweenTo(target: HTMLElement, vars: gsap.TweenVars) {
	return new Promise<void>((resolve) => {
		gsap.to(target, {
			...vars,
			onComplete: resolve
		})
	})
}

async function changeProject(nextProjectIndex: number, direction: 'previous' | 'next') {
	if (isTransitioning.value || nextProjectIndex === props.activeIndex) return

	if (prefersReducedMotion()) {
		emit('change-project', nextProjectIndex)
		await nextTick()
		resetOverlayScroll()
		return
	}

	const contentElement = content.value
	if (!contentElement) return

	isTransitioning.value = true
	const outgoingY = direction === 'next' ? -20 : 20
	const incomingY = direction === 'next' ? 20 : -20

	await tweenTo(contentElement, {
		autoAlpha: 0,
		y: outgoingY,
		duration: 0.22,
		ease: 'power2.in',
		overwrite: true
	})

	emit('change-project', nextProjectIndex)
	await nextTick()
	resetOverlayScroll()

	gsap.fromTo(contentElement, {
		autoAlpha: 0,
		y: incomingY
	}, {
		autoAlpha: 1,
		y: 0,
		duration: 0.4,
		ease: 'power3.out',
		overwrite: true,
		onComplete: () => {
			isTransitioning.value = false
		}
	})
}

onBeforeUpdate(() => {
	secondaryMediaItems.value = []
})

defineExpose({
	content,
	firstMediaFrame,
	sidebar,
	title,
	meta,
	body,
	nav,
	secondaryMediaItems
})
</script>
