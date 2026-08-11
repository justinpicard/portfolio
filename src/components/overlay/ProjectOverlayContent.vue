<template>
	<div
		ref="content"
		class="project-overlay"
		:class="{
			'project-overlay--opening-transition': openingTransitionActive,
			'project-overlay--transitioning': isTransitioning
		}"
	>
		<article
			v-for="surface in projectSurfaces"
			:key="surface.key"
			:ref="(element) => setSurfaceElement(surface.role, element)"
			class="project-overlay__surface"
			:class="`project-overlay__surface--${surface.role}`"
			:style="getSurfaceStyle(surface.project)"
		>
			<div
				:ref="(element) => setSurfaceContentElement(surface.role, element)"
				class="project-overlay__surface-content"
			>
				<div class="project-overlay__media-column">
					<div
						:ref="(element) => setFirstMediaFrame(element, surface.role)"
						class="project-overlay__media project-overlay__media--first"
						:class="{ 'project-overlay__media--transition-hidden': firstMediaHidden && surface.role === 'current' }"
						data-project-media
					>
						<BaseImage
							class-name="project-overlay__image"
							:src="`/images/${surface.project.thumbnailImage}`"
							:alt="surface.project.title"
							:fallback-format="surface.project.thumbnailImageFormat"
							aspect-ratio="3 / 3.75"
						/>
					</div>

					<div
						v-for="(image, index) in getSecondaryImages(surface.project)"
						:key="`${surface.key}-${image}`"
						:ref="surface.role === 'current' ? setSecondaryMediaItem : undefined"
						class="project-overlay__media project-overlay__secondary-media"
						data-project-media
					>
						<BaseImage
							class-name="project-overlay__image"
							:src="`/images/${image}`"
							:alt="t('project.imageAlt', {
								title: surface.project.title,
								number: index + 2
							})"
							aspect-ratio="16 / 10"
						/>
					</div>
				</div>

				<aside
					:ref="(element) => setSidebarElement(element, surface.role)"
					class="project-overlay__sidebar"
				>
					<header class="project-overlay__header">
						<p class="project-overlay__number">{{ formatProjectNumber(surface.index) }}</p>
						<h2
							:id="surface.role === 'current' ? 'project-overlay-title' : undefined"
							:ref="(element) => setTitleElement(element, surface.role)"
							class="project-overlay__title"
						>
							{{ surface.project.title }}
						</h2>
						<div
							:ref="(element) => setMetaElement(element, surface.role)"
							class="project-overlay__meta font-medium"
						>
							{{ surface.project.year }}<span class="star mx-2">✦</span>{{ surface.project.type }}<span class="star mx-2">✦</span>{{ surface.project.job }}
							<div class="role d-flex flex-column mt-8">
								<span class="role-label text-xs font-bold uppercase tracking-extrawide">{{ t('project.role') }}</span>
								<span class="role-title text-sm">{{ surface.project.role }}</span>
							</div>
						</div>
					</header>

					<div
						:ref="(element) => setBodyElement(element, surface.role)"
						class="project-overlay__body"
					>
						<p>{{ surface.project.summary }}</p>
					</div>

					<a
						v-if="surface.project.live"
						class="project-overlay__link"
						:href="surface.project.live"
						target="_blank"
						rel="noopener noreferrer"
					>
						{{ t('project.visit') }}
					</a>

					<footer
						:ref="(element) => setNavElement(element, surface.role)"
						class="project-overlay__nav"
					>
						<button
							class="project-overlay__nav-button"
							type="button"
							:disabled="isTransitioning"
							@click="changeProject(getPreviousIndex(surface.index))"
						>
							<span class="project-overlay__nav-label">{{ t('project.previous') }}</span>
							<span class="project-overlay__nav-title">
								{{ getProjectAt(getPreviousIndex(surface.index)).title }}
							</span>
						</button>
						<button
							class="project-overlay__nav-button project-overlay__nav-button--next"
							type="button"
							:disabled="isTransitioning"
							@click="changeProject(getNextIndex(surface.index))"
						>
							<span class="project-overlay__nav-label">{{ t('project.next') }}</span>
							<span class="project-overlay__nav-title">
								{{ getProjectAt(getNextIndex(surface.index)).title }}
							</span>
						</button>
					</footer>
				</aside>
			</div>
		</article>
	</div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUpdate, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ComponentPublicInstance, CSSProperties } from 'vue'
import { gsap, prefersReducedMotion, registerGsapPlugins, ScrollTrigger } from '../../utils/animations/gsap'
import type { Project } from '../../content'
import BaseImage from '../base/BaseImage.vue'
import { overlayScrollContainerKey } from './overlayContext'

const { t } = useI18n()
const props = defineProps<{
	projects: Project[]
	activeIndex: number
	firstMediaHidden?: boolean
	openingTransitionActive?: boolean
}>()

const emit = defineEmits<{
	'change-project': [nextIndex: number]
}>()

registerGsapPlugins()

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

type SurfaceRole = 'current' | 'outgoing' | 'incoming'

type ProjectSurface = {
	key: string
	role: SurfaceRole
	index: number
	project: Project
}

const currentIndex = ref(props.activeIndex)
const outgoingProjectIndex = ref<number | null>(null)
const incomingProjectIndex = ref<number | null>(null)
const surfaceElements = new Map<SurfaceRole, HTMLElement>()
const surfaceContentElements = new Map<SurfaceRole, HTMLElement>()
let projectTimeline: gsap.core.Timeline | undefined
let previousOverlayOverflowY: string | undefined
let mediaScrollTriggers: Array<ReturnType<typeof ScrollTrigger.create>> = []
const initializedMediaSurfaces = new WeakSet<HTMLElement>()

const MEDIA_REVEAL_Y = 64

const projectSurfaces = computed<ProjectSurface[]>(() => {
	if (outgoingProjectIndex.value !== null && incomingProjectIndex.value !== null) {
		return [
			createProjectSurface('outgoing', outgoingProjectIndex.value),
			createProjectSurface('incoming', incomingProjectIndex.value)
		]
	}

	return [
		createProjectSurface('current', currentIndex.value)
	]
})
function createProjectSurface(role: SurfaceRole, index: number): ProjectSurface {
	return {
		key: props.projects[index].id,
		role,
		index,
		project: props.projects[index]
	}
}

function getPreviousIndex(projectIndex: number) {
	return (projectIndex - 1 + props.projects.length) % props.projects.length
}

function getNextIndex(projectIndex: number) {
	return (projectIndex + 1) % props.projects.length
}

function getProjectAt(projectIndex: number) {
	return props.projects[projectIndex]
}

function formatProjectNumber(projectIndex: number) {
	return String(projectIndex + 1).padStart(2, '0')
}

function getSecondaryImages(project: Project) {
	return project.secondaryImages ?? []
}

function getSurfaceStyle(project: Project): CSSProperties {
	return {
		'--project-surface-background': project.overlayBackground ?? 'var(--color-secondary)'
	} as CSSProperties
}

function waitForAnimationFrame() {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve())
	})
}

function getSurfaceMediaElements(surface: HTMLElement) {
	return Array.from(surface.querySelectorAll<HTMLElement>('[data-project-media]'))
}

function setMediaVisible(mediaElements: HTMLElement[]) {
	gsap.set(mediaElements, {
		y: 0,
		autoAlpha: 1
	})
}

function prepareSurfaceMedia(surface: HTMLElement) {
	const mediaElements = getSurfaceMediaElements(surface)

	if (prefersReducedMotion()) {
		setMediaVisible(mediaElements)
		return
	}

	gsap.set(mediaElements, {
		y: MEDIA_REVEAL_Y,
		autoAlpha: 0
	})
}

function killMediaScrollTriggers() {
	mediaScrollTriggers.forEach((trigger) => trigger.kill())
	mediaScrollTriggers = []
}

function createMediaReveals(surface: HTMLElement) {
	if (initializedMediaSurfaces.has(surface)) return

	const mediaElements = getSurfaceMediaElements(surface)
	const scroller = scrollContainer?.value

	if (mediaElements.length === 0) return
	initializedMediaSurfaces.add(surface)

	if (prefersReducedMotion() || !scroller) {
		setMediaVisible(mediaElements)
		return
	}

	gsap.set(mediaElements, {
		y: MEDIA_REVEAL_Y,
		autoAlpha: 0
	})

	mediaElements.forEach((mediaElement) => {
		const tween = gsap.to(mediaElement, {
			y: 0,
			autoAlpha: 1,
			duration: 0.9,
			ease: 'expo.out',
			overwrite: true,
			scrollTrigger: {
				trigger: mediaElement,
				scroller,
				start: 'top 88%',
				once: true
			}
		})

		if (tween.scrollTrigger) {
			mediaScrollTriggers.push(tween.scrollTrigger)
		}
	})
}

function finalizeCurrentMediaState() {
	const surface = surfaceElements.get('current')
	if (!surface) return

	killMediaScrollTriggers()

	if (prefersReducedMotion()) {
		setMediaVisible(getSurfaceMediaElements(surface))
		return
	}

	createMediaReveals(surface)
}

function resetOverlayScroll() {
	scrollContainer?.value?.scrollTo({
		top: 0,
		behavior: 'auto'
	})
}

function setOverlayScrollLocked(isLocked: boolean) {
	const container = scrollContainer?.value
	if (!container) return

	if (isLocked) {
		previousOverlayOverflowY = container.style.overflowY
		container.style.overflowY = 'hidden'
		return
	}

	container.style.overflowY = previousOverlayOverflowY ?? ''
	previousOverlayOverflowY = undefined
}

function resolveHTMLElement(element: Element | ComponentPublicInstance | null) {
	return element instanceof HTMLElement ? element : null
}

function setSurfaceElement(role: SurfaceRole, element: Element | ComponentPublicInstance | null) {
	const resolvedElement = resolveHTMLElement(element)
	if (resolvedElement) {
		surfaceElements.set(role, resolvedElement)
		return
	}

	surfaceElements.delete(role)
}

function setSurfaceContentElement(role: SurfaceRole, element: Element | ComponentPublicInstance | null) {
	const resolvedElement = resolveHTMLElement(element)
	if (resolvedElement) {
		surfaceContentElements.set(role, resolvedElement)
		return
	}

	surfaceContentElements.delete(role)
}

function setCurrentRef(
	role: SurfaceRole,
	element: Element | ComponentPublicInstance | null,
	target: typeof firstMediaFrame
) {
	if (role !== 'current') return

	target.value = resolveHTMLElement(element)
}

function setFirstMediaFrame(element: Element | ComponentPublicInstance | null, role: SurfaceRole) {
	setCurrentRef(role, element, firstMediaFrame)
}

function setSidebarElement(element: Element | ComponentPublicInstance | null, role: SurfaceRole) {
	setCurrentRef(role, element, sidebar)
}

function setTitleElement(element: Element | ComponentPublicInstance | null, role: SurfaceRole) {
	setCurrentRef(role, element, title)
}

function setMetaElement(element: Element | ComponentPublicInstance | null, role: SurfaceRole) {
	setCurrentRef(role, element, meta)
}

function setBodyElement(element: Element | ComponentPublicInstance | null, role: SurfaceRole) {
	setCurrentRef(role, element, body)
}

function setNavElement(element: Element | ComponentPublicInstance | null, role: SurfaceRole) {
	setCurrentRef(role, element, nav)
}

function setSecondaryMediaItem(element: Element | ComponentPublicInstance | null) {
	if (element instanceof HTMLElement) {
		secondaryMediaItems.value.push(element)
	}
}

function getActiveSurfaceElement() {
	return surfaceElements.get('current')
		?? surfaceElements.get('incoming')
		?? surfaceElements.get('outgoing')
		?? null
}

function getActiveSurfaceContentElement() {
	return surfaceContentElements.get('current')
		?? surfaceContentElements.get('incoming')
		?? surfaceContentElements.get('outgoing')
		?? null
}

function normalizeProjectTransition() {
	projectTimeline?.kill()
	projectTimeline = undefined
	killMediaScrollTriggers()

	if (incomingProjectIndex.value !== null) {
		currentIndex.value = incomingProjectIndex.value
	}

	outgoingProjectIndex.value = null
	incomingProjectIndex.value = null
	isTransitioning.value = false
	setOverlayScrollLocked(false)
}

async function animateInitialProjectSurface() {
	if (prefersReducedMotion()) return

	const surface = surfaceElements.get('current')
	const surfaceContent = surfaceContentElements.get('current')
	if (!surface || !surfaceContent) return

	prepareSurfaceMedia(surface)
	gsap.set(surface, {
		yPercent: 100,
		scale: 1,
		opacity: 1
	})
	gsap.set(surfaceContent, {
		autoAlpha: 0,
		y: 40
	})

	projectTimeline?.kill()
	projectTimeline = gsap.timeline({
		onComplete: () => {
			createMediaReveals(surface)
		}
	})
		.to(surface, {
			yPercent: 0,
			duration: 0.8,
			ease: 'power3.inOut'
		}, 0.12)
		.to(surfaceContent, {
			autoAlpha: 1,
			y: 0,
			duration: 0.6,
			ease: 'expo.out'
		}, 0.46)
}

async function changeProject(nextProjectIndex: number) {
	if (isTransitioning.value || nextProjectIndex === currentIndex.value) return

	if (prefersReducedMotion()) {
		currentIndex.value = nextProjectIndex
		emit('change-project', nextProjectIndex)
		await nextTick()
		resetOverlayScroll()
		return
	}

	if (!content.value) return

	isTransitioning.value = true
	setOverlayScrollLocked(true)
	outgoingProjectIndex.value = currentIndex.value
	incomingProjectIndex.value = nextProjectIndex
	await nextTick()
	resetOverlayScroll()

	const outgoingSurface = surfaceElements.get('outgoing')
	const incomingSurface = surfaceElements.get('incoming')
	const incomingContent = surfaceContentElements.get('incoming')

	if (!outgoingSurface || !incomingSurface || !incomingContent) {
		normalizeProjectTransition()
		currentIndex.value = nextProjectIndex
		emit('change-project', nextProjectIndex)
		await nextTick()
		resetOverlayScroll()
		return
	}

	prepareSurfaceMedia(incomingSurface)
	gsap.set(incomingSurface, {
		autoAlpha: 1,
		yPercent: 100,
		scale: 1,
		opacity: 1,
		visibility: 'visible'
	})
	gsap.set(incomingContent, {
		autoAlpha: 0,
		y: 40
	})
	await waitForAnimationFrame()

	projectTimeline?.kill()
	projectTimeline = gsap.timeline({
		onComplete: async () => {
			currentIndex.value = nextProjectIndex
			outgoingProjectIndex.value = null
			incomingProjectIndex.value = null
			emit('change-project', nextProjectIndex)
			await nextTick()
			resetOverlayScroll()
			finalizeCurrentMediaState()
			setOverlayScrollLocked(false)
			isTransitioning.value = false
		}
	})
		.to(outgoingSurface, {
			scale: 0.88,
			y: '-12vh',
			opacity: 0.45,
			duration: 0.9,
			ease: 'power2.inOut',
			overwrite: true
		}, 0)
		.to(incomingSurface, {
			yPercent: 0,
			duration: 0.8,
			ease: 'power3.inOut',
			overwrite: true
		}, 0.14)
		.to(incomingContent, {
			autoAlpha: 1,
			y: 0,
			duration: 0.6,
			ease: 'expo.out',
			overwrite: true
		}, 0.46)
}

async function animateClose() {
	normalizeProjectTransition()
	await nextTick()

	if (prefersReducedMotion()) return

	const surface = getActiveSurfaceElement()
	const surfaceContent = getActiveSurfaceContentElement()
	if (!surface || !surfaceContent) return

	projectTimeline?.kill()
	projectTimeline = gsap.timeline()
		.to(surfaceContent, {
			autoAlpha: 0,
			y: -40,
			duration: 0.28,
			ease: 'power2.in',
			overwrite: true
		}, 0)
		.to(surface, {
			yPercent: 100,
			duration: 0.8,
			ease: 'power3.inOut',
			overwrite: true
		}, 0.08)
}

onBeforeUpdate(() => {
	secondaryMediaItems.value = []
})

watch(
	() => props.activeIndex,
	(activeIndex) => {
		if (isTransitioning.value) return

		currentIndex.value = activeIndex
	}
)

onMounted(async () => {
	await nextTick()
	animateInitialProjectSurface()
})

onUnmounted(() => {
	projectTimeline?.kill()
	killMediaScrollTriggers()
	setOverlayScrollLocked(false)
})

defineExpose({
	content,
	firstMediaFrame,
	sidebar,
	title,
	meta,
	body,
	nav,
	secondaryMediaItems,
	animateClose
})
</script>
