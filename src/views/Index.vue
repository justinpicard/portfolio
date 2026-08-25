<template>
	<div ref="pageSurfaceScrims" class="page-surface__scrims" aria-hidden="true">
		<div ref="pageSurfaceScrimTop" class="page-surface__scrim page-surface__scrim--top" />
		<div ref="pageSurfaceScrimBottom" class="page-surface__scrim page-surface__scrim--bottom" />
	</div>
	<AppHeader
		:visible="isHeaderVisible"
		:overlay-active="activeOverlay !== null"
		@overlay-scroll-top="scrollActiveOverlayToTop"
	/>
	<LoadingScreen ref="loadingScreen" />
	<div ref="pageSurfaceBackground" class="page-surface__background" aria-hidden="true" />
	<div id="smooth-wrapper" ref="smoothWrapper">
		<div id="smooth-content" ref="smoothContent">
			<div ref="pageSurface" class="page-surface">
				<SectionHomeHero
					ref="hero"
					:loading-screen="loadingScreen"
					@intro-start="showHeader"
				/>
				<SectionHomeAbout />
				<SectionHomeWork />
				<HomeLifeStackExperiment />
				<AppFooter />
			</div>
		</div>
	</div>
	<AppOverlay
		ref="appOverlay"
		:open="activeOverlay !== null"
		:labelled-by="overlayLabelledBy"
		:animate-content="renderedOverlay?.type !== 'project'"
		:style="projectOverlayStyle"
		@close="closeOverlay"
		@after-close="handleOverlayAfterClose"
	>
		<ProjectOverlayContent
			v-if="renderedOverlay?.type === 'project'"
			ref="projectOverlay"
			:projects="projects"
			:active-index="renderedOverlay.projectIndex"
			:first-media-hidden="overlayFirstMediaHidden"
			:opening-transition-active="projectOpeningTransitionActive"
			@change-project="handleProjectChange"
		/>
		<CvOverlayContent
			v-else-if="renderedOverlay?.type === 'cv'"
		/>
	</AppOverlay>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, shallowRef, ref, watch } from "vue"
import type { CSSProperties } from "vue"
import AppHeader from "../components/AppHeader.vue"
import LoadingScreen from "../components/LoadingScreen.vue"
import AppOverlay from "../components/overlay/AppOverlay.vue"
import CvOverlayContent from "../components/overlay/CvOverlayContent.vue"
import ProjectOverlayContent from "../components/overlay/ProjectOverlayContent.vue"
import HomeLifeStackExperiment from "../components/sections/HomeLifeStackExperiment.vue"
import SectionHomeHero from "../components/sections/SectionHomeHero.vue";
import SectionHomeAbout from "../components/sections/SectionHomeAbout.vue";
import SectionHomeWork from "../components/sections/SectionHomeWork.vue";
import { usePortfolioContent } from "../composables/usePortfolioContent"
import { gsap, prefersReducedMotion, ScrollTrigger } from "../utils/animations/gsap"
import AppFooter from "../components/AppFooter.vue"
import { usePageSeo } from '../composables/usePageSeo'
import { initPortfolioScrollSmoother } from '../utils/animations/portfolioScrollSmoother'

usePageSeo('home')

type OverlayState =
	| {
		type: 'project'
		projectIndex: number
	}
	| {
		type: 'cv'
	}
	| null

const hero = ref<InstanceType<typeof SectionHomeHero> | null>(null)
const loadingScreen = ref<InstanceType<typeof LoadingScreen> | null>(null)
const smoothWrapper = ref<HTMLElement | null>(null)
const smoothContent = ref<HTMLElement | null>(null)
const pageSurface = ref<HTMLElement | null>(null)
const pageSurfaceBackground = ref<HTMLElement | null>(null)
const pageSurfaceScrims = ref<HTMLElement | null>(null)
const pageSurfaceScrimTop = ref<HTMLElement | null>(null)
const pageSurfaceScrimBottom = ref<HTMLElement | null>(null)
const appOverlay = ref<InstanceType<typeof AppOverlay> | null>(null)
const isHeaderVisible = ref(false)
const activeOverlay = ref<OverlayState>(null)
const renderedOverlay = ref<OverlayState>(null)
const projectOverlay = ref<InstanceType<typeof ProjectOverlayContent> | null>(null)
const overlayFirstMediaHidden = ref(false)
const projectOpeningTransitionActive = ref(false)
const { projects } = usePortfolioContent()
let closeOverlayTimeout: ReturnType<typeof window.setTimeout> | undefined
let destroyScrollSmoother: (() => void) | undefined

function scrollActiveOverlayToTop() {
	appOverlay.value?.scrollToTop()
}

const overlayLabelledBy = computed(() => {
	if (renderedOverlay.value?.type === 'project') return 'project-overlay-title'
	if (renderedOverlay.value?.type === 'cv') return 'cv-overlay-title'

	return undefined
})

type ProjectOverlayStyle = CSSProperties & {
	'--project-overlay-background'?: string
}

const projectOverlayStyle = computed<ProjectOverlayStyle | undefined>(() => {
	if (renderedOverlay.value?.type !== 'project') return undefined

	const project = projects.value[renderedOverlay.value.projectIndex]
	if (!project?.overlayBackground) return undefined

	return {
		'--project-overlay-background': project.overlayBackground
	}
})

function setPageSurfaceDepth(isOpen: boolean, isProjectOverlay = false) {
	if (!pageSurface.value) return
	const surfaceLayers = [pageSurface.value, pageSurfaceBackground.value]
		.filter(Boolean) as HTMLElement[]
	const scrimLayers = [
		pageSurfaceScrimTop.value,
		pageSurfaceScrimBottom.value
	].filter(Boolean) as HTMLElement[]

	gsap.killTweensOf(surfaceLayers)
	gsap.killTweensOf(pageSurfaceScrims.value)
	gsap.killTweensOf(scrimLayers)

	if (prefersReducedMotion()) {
		gsap.set(surfaceLayers, {
			clearProps: 'transform,opacity,borderRadius,transformOrigin'
		})
		gsap.set(pageSurfaceScrims.value, {
			opacity: isOpen ? 0 : 1
		})
		gsap.set(scrimLayers, {
			clearProps: 'transform'
		})
		return
	}

	if (isOpen) {
		gsap.set(scrimLayers, {
			clearProps: 'transform'
		})
	} else {
		gsap.set(pageSurfaceScrimTop.value, { y: -24 })
		gsap.set(pageSurfaceScrimBottom.value, { y: 24 })
		gsap.to(scrimLayers, {
			y: 0,
			duration: 0.5,
			delay: isProjectOverlay ? 0.6 : 0,
			ease: 'power2.inOut',
			overwrite: true,
			onComplete: () => {
				gsap.set(scrimLayers, { clearProps: 'transform' })
			}
		})
	}

	gsap.to(surfaceLayers, {
		scale: isOpen ? 0.88 : 1,
		y: isOpen ? '-12vh' : 0,
		opacity: isOpen ? 0.45 : 1,
		borderRadius: 0,
		transformOrigin: 'center top',
		duration: 1,
		delay: 0,
		ease: 'power2.inOut',
		overwrite: true,
		onComplete: () => {
			if (isOpen || !pageSurface.value) return

			// Remove the transformed containing block before recalculating pinned sections.
			gsap.set(surfaceLayers, {
				clearProps: 'transform,opacity,borderRadius,transformOrigin'
			})
			ScrollTrigger.refresh()
		}
	})

	gsap.to(pageSurfaceScrims.value, {
		opacity: isOpen ? 0 : 1,
		duration: 0.5,
		delay: !isOpen && isProjectOverlay ? 0.6 : 0,
		ease: isOpen ? 'power2.out' : 'power2.inOut',
		overwrite: true
	})
}

function resetProjectOpeningTransition() {
	overlayFirstMediaHidden.value = false
	projectOpeningTransitionActive.value = false
}

const openCv = () => {
	const nextOverlay = {
		type: 'cv'
	} as const

	renderedOverlay.value = nextOverlay
	activeOverlay.value = nextOverlay
}

function showHeader() {
	isHeaderVisible.value = true
}

const closeOverlay = () => {
	if (activeOverlay.value === null || closeOverlayTimeout) return

	const isProjectOverlay = activeOverlay.value.type === 'project'
	if (isProjectOverlay) {
		projectOverlay.value?.animateClose()
	}

	closeOverlayTimeout = window.setTimeout(() => {
		activeOverlay.value = null
		resetProjectOpeningTransition()
		closeOverlayTimeout = undefined
	}, isProjectOverlay ? 20 : 0)
}

const handleOverlayAfterClose = () => {
	if (activeOverlay.value !== null) return

	renderedOverlay.value = null
	resetProjectOpeningTransition()
}

const handleProjectChange = (nextIndex: number) => {
	if (closeOverlayTimeout) return
	if (activeOverlay.value?.type !== 'project') return

	resetProjectOpeningTransition()

	const nextOverlay = {
		type: 'project',
		projectIndex: nextIndex
	} as const

	renderedOverlay.value = nextOverlay
	activeOverlay.value = nextOverlay
}

watch(
	() => activeOverlay.value !== null,
	(isOverlayOpen) => {
		setPageSurfaceDepth(
			isOverlayOpen,
			renderedOverlay.value?.type === 'project'
		)
	}
)

onMounted(async () => {
	await nextTick()
	if (!smoothWrapper.value || !smoothContent.value) return

	destroyScrollSmoother = initPortfolioScrollSmoother({
		wrapper: smoothWrapper.value,
		content: smoothContent.value
	})
})

onUnmounted(() => {
	destroyScrollSmoother?.()
	destroyScrollSmoother = undefined
	if (closeOverlayTimeout) {
		window.clearTimeout(closeOverlayTimeout)
	}
	if (pageSurface.value) {
		const surfaceLayers = [pageSurface.value, pageSurfaceBackground.value]
			.filter(Boolean) as HTMLElement[]
		gsap.killTweensOf(surfaceLayers)
		gsap.set(surfaceLayers, {
			clearProps: 'transform,opacity,borderRadius,transformOrigin'
		})
	}
	if (pageSurfaceScrims.value) {
		gsap.killTweensOf(pageSurfaceScrims.value)
		gsap.set(pageSurfaceScrims.value, {
			clearProps: 'opacity'
		})
	}
	const scrimLayers = [pageSurfaceScrimTop.value, pageSurfaceScrimBottom.value]
		.filter(Boolean) as HTMLElement[]
	gsap.killTweensOf(scrimLayers)
	gsap.set(scrimLayers, {
		clearProps: 'transform'
	})
	resetProjectOpeningTransition()
})
</script>
