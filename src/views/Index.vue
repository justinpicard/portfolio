<template>
	<div ref="pageSurface" class="page-surface">
		<div ref="pageSurfaceScrims" class="page-surface__scrims" aria-hidden="true">
			<div ref="pageSurfaceScrimTop" class="page-surface__scrim page-surface__scrim--top" />
			<div ref="pageSurfaceScrimBottom" class="page-surface__scrim page-surface__scrim--bottom" />
		</div>
		<AppHeader
			:visible="isHeaderVisible"
			:overlay-active="activeOverlay !== null || isWorkOverlayOpen"
		/>
		<SectionHomeHero
			ref="hero"
			@intro-start="showHeader"
		/>
		<SectionHomeAbout />
		<SectionHomeWork @overlay-change="isWorkOverlayOpen = $event" />
		<HomePhotoStackSection />
		<AppFooter />
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
import { computed, onUnmounted, shallowRef, ref, watch } from "vue"
import type { CSSProperties } from "vue"
import AppHeader from "../components/AppHeader.vue"
import AppOverlay from "../components/overlay/AppOverlay.vue"
import CvOverlayContent from "../components/overlay/CvOverlayContent.vue"
import ProjectOverlayContent from "../components/overlay/ProjectOverlayContent.vue"
import HomePhotoStackSection from "../components/sections/HomePhotoStackSection.vue"
import SectionHomeHero from "../components/sections/SectionHomeHero.vue";
import SectionHomeAbout from "../components/sections/SectionHomeAbout.vue";
import SectionHomeWork from "../components/sections/SectionHomeWork.vue";
import projectsData from "../data/projects.json"
import type { Project } from "../types/project"
import { gsap, prefersReducedMotion, ScrollTrigger } from "../utils/animations/gsap"
import AppFooter from "../components/AppFooter.vue"

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
const pageSurface = ref<HTMLElement | null>(null)
const pageSurfaceScrims = ref<HTMLElement | null>(null)
const pageSurfaceScrimTop = ref<HTMLElement | null>(null)
const pageSurfaceScrimBottom = ref<HTMLElement | null>(null)
const appOverlay = ref<InstanceType<typeof AppOverlay> | null>(null)
const isHeaderVisible = ref(false)
const isWorkOverlayOpen = ref(false)
const activeOverlay = ref<OverlayState>(null)
const renderedOverlay = ref<OverlayState>(null)
const projectOverlay = ref<InstanceType<typeof ProjectOverlayContent> | null>(null)
const overlayFirstMediaHidden = ref(false)
const projectOpeningTransitionActive = ref(false)
const projects = projectsData as Project[]
let closeOverlayTimeout: ReturnType<typeof window.setTimeout> | undefined

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

	const project = projects[renderedOverlay.value.projectIndex]
	if (!project?.overlayBackground) return undefined

	return {
		'--project-overlay-background': project.overlayBackground
	}
})

function setPageSurfaceDepth(isOpen: boolean, isProjectOverlay = false) {
	if (!pageSurface.value) return
	const scrimLayers = [
		pageSurfaceScrimTop.value,
		pageSurfaceScrimBottom.value
	].filter(Boolean) as HTMLElement[]

	gsap.killTweensOf(pageSurface.value)
	gsap.killTweensOf(pageSurfaceScrims.value)
	gsap.killTweensOf(scrimLayers)

	if (prefersReducedMotion()) {
		gsap.set(pageSurface.value, {
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

	gsap.to(pageSurface.value, {
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
			gsap.set(pageSurface.value, {
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

onUnmounted(() => {
	if (closeOverlayTimeout) {
		window.clearTimeout(closeOverlayTimeout)
	}
	if (pageSurface.value) {
		gsap.killTweensOf(pageSurface.value)
		gsap.set(pageSurface.value, {
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
