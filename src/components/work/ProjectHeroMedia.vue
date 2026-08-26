<template>
	<BaseImage
		:src="imageSource"
		:alt="project.title"
		:fallback-format="imageFormat"
		:position="mediaPosition"
		loading="eager"
	/>

	<video
		v-if="shouldRenderVideo && project.heroVideo"
		class="project-layer-prototype__hero-video"
		:class="{ 'is-playing': isPlaying }"
		:poster="posterSource"
		:style="videoStyles"
		autoplay
		muted
		loop
		playsinline
		preload="metadata"
		aria-hidden="true"
		tabindex="-1"
		@playing="isPlaying = true"
		@error="isPlaying = false"
	>
		<source :src="`/images/${project.heroVideo.webm}`" type="video/webm">
		<source :src="`/images/${project.heroVideo.mp4}`" type="video/mp4">
	</video>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue'
import type { Project } from '../../content'
import BaseImage from '../base/BaseImage.vue'

const props = withDefaults(defineProps<{
	project: Project
	videoEnabled?: boolean
}>(), {
	videoEnabled: true
})

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const shouldRenderVideo = ref(false)
const isPlaying = ref(false)
let reducedMotionQuery: MediaQueryList | undefined

const imageSource = computed(() => (
	`/images/${props.project.heroPosterImage ?? props.project.heroImage}`
))
const imageFormat = computed(() => (
	props.project.heroPosterImageFormat ?? props.project.heroImageFormat
))
const mediaPosition = computed(() => props.project.heroImagePosition ?? 'center center')
const posterSource = computed(() => `${imageSource.value}.${imageFormat.value ?? 'jpg'}`)
const videoStyles = computed<CSSProperties>(() => ({
	'--project-hero-media-position': mediaPosition.value
} as CSSProperties))

function updateMotionPreference() {
	shouldRenderVideo.value = Boolean(
		props.videoEnabled
		&& props.project.heroVideo
		&& !reducedMotionQuery?.matches
	)

	if (!shouldRenderVideo.value) {
		isPlaying.value = false
	}
}

onMounted(() => {
	reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY)
	updateMotionPreference()
	reducedMotionQuery.addEventListener('change', updateMotionPreference)
})

watch(() => props.videoEnabled, updateMotionPreference)

onUnmounted(() => {
	reducedMotionQuery?.removeEventListener('change', updateMotionPreference)
})
</script>
