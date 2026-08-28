<template>
	<div class="page-surface__scrims" aria-hidden="true">
		<div class="page-surface__scrim page-surface__scrim--top" />
		<div class="page-surface__scrim page-surface__scrim--bottom" />
	</div>
	<AppHeader
		:visible="isHeaderVisible"
		:overlay-active="workOverlayLifecycle !== 'closed'"
		:section-tracking-suspended="workOverlayLifecycle !== 'closed'"
		@overlay-scroll-top="scrollActiveOverlayToTop"
	/>
	<LoadingScreen ref="loadingScreen" />
	<div class="page-surface__background" aria-hidden="true" />
	<div id="smooth-wrapper" ref="smoothWrapper">
		<div id="smooth-content" ref="smoothContent">
			<div class="page-surface">
				<SectionHomeHero
					:loading-screen="loadingScreen"
					@intro-start="showHeader"
				/>
				<SectionHomeAbout />
				<SectionHomeWork
					ref="workSection"
					@overlay-lifecycle-change="workOverlayLifecycle = $event"
				/>
				<HomeLifeStackExperiment />
				<AppFooter />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue"
import AppHeader from "../components/AppHeader.vue"
import LoadingScreen from "../components/LoadingScreen.vue"
import HomeLifeStackExperiment from "../components/sections/HomeLifeStackExperiment.vue"
import SectionHomeHero from "../components/sections/SectionHomeHero.vue";
import SectionHomeAbout from "../components/sections/SectionHomeAbout.vue";
import SectionHomeWork from "../components/sections/SectionHomeWork.vue";
import AppFooter from "../components/AppFooter.vue"
import { usePageSeo } from '../composables/usePageSeo'
import { initPortfolioScrollSmoother } from '../utils/animations/portfolioScrollSmoother'
import type { WorkOverlayLifecycle } from '../config/workOverlay'

usePageSeo('home')

const loadingScreen = ref<InstanceType<typeof LoadingScreen> | null>(null)
const smoothWrapper = ref<HTMLElement | null>(null)
const smoothContent = ref<HTMLElement | null>(null)
const workSection = ref<InstanceType<typeof SectionHomeWork> | null>(null)
const isHeaderVisible = ref(false)
const workOverlayLifecycle = ref<WorkOverlayLifecycle>('closed')
let destroyScrollSmoother: (() => void) | undefined

function scrollActiveOverlayToTop() {
	workSection.value?.scrollProjectToTop()
}

function showHeader() {
	isHeaderVisible.value = true
}

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
})
</script>
