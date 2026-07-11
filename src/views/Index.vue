<template>
	<AppHeader :visible="isHeaderVisible" />
	<SectionHomeHero ref="hero" />
	<SectionHomeAbout />
	<SectionHomeWork
		:transition-hidden-project-index="transitionHiddenProjectIndex"
		@open-project="openProject"
	/>
	<HomePhotoStackSection />
	<AppOverlay
		ref="appOverlay"
		:open="activeOverlay !== null"
		:labelled-by="overlayLabelledBy"
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
import { computed, onMounted, onUnmounted, shallowRef, ref } from "vue"
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
import type { Project, ProjectOpenPayload } from "../types/project"

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
const appOverlay = ref<InstanceType<typeof AppOverlay> | null>(null)
const isHeaderVisible = ref(false)
const activeOverlay = ref<OverlayState>(null)
const renderedOverlay = ref<OverlayState>(null)
const projectTransitionSource = shallowRef<HTMLElement | null>(null)
const projectOverlay = ref<InstanceType<typeof ProjectOverlayContent> | null>(null)
const transitionHiddenProjectIndex = ref<number | null>(null)
const overlayFirstMediaHidden = ref(false)
const projectOpeningTransitionActive = ref(false)
const projects = projectsData as Project[]
let heroObserver: IntersectionObserver | undefined

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

function resetProjectOpeningTransition() {
	transitionHiddenProjectIndex.value = null
	overlayFirstMediaHidden.value = false
	projectOpeningTransitionActive.value = false
}

function openProjectNormally(projectIndex: number) {
	const nextOverlay = {
		type: 'project',
		projectIndex
	} as const

	renderedOverlay.value = nextOverlay
	activeOverlay.value = nextOverlay
}

const openProject = (payload: ProjectOpenPayload) => {
	projectTransitionSource.value = payload.sourceMediaElement
	resetProjectOpeningTransition()
	openProjectNormally(payload.projectIndex)
}

const openCv = () => {
	const nextOverlay = {
		type: 'cv'
	} as const

	renderedOverlay.value = nextOverlay
	activeOverlay.value = nextOverlay
}

const closeOverlay = () => {
	activeOverlay.value = null
	resetProjectOpeningTransition()
}

const handleOverlayAfterClose = () => {
	if (activeOverlay.value !== null) return

	renderedOverlay.value = null
	projectTransitionSource.value = null
	resetProjectOpeningTransition()
}

const handleProjectChange = (nextIndex: number) => {
	if (activeOverlay.value?.type !== 'project') return

	resetProjectOpeningTransition()

	const nextOverlay = {
		type: 'project',
		projectIndex: nextIndex
	} as const

	renderedOverlay.value = nextOverlay
	activeOverlay.value = nextOverlay
}

onMounted(() => {
	const heroElement = hero.value?.element
	if (!heroElement) return

	heroObserver = new IntersectionObserver(([entry]) => {
		isHeaderVisible.value = !entry.isIntersecting
	}, {
		threshold: 0
	})

	heroObserver.observe(heroElement)
})

onUnmounted(() => {
	heroObserver?.disconnect()
	resetProjectOpeningTransition()
})
</script>
