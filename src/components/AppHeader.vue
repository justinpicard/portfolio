<template>
	<header
		ref="header"
		class="site-header fixed fixed-nav"
		:class="{
			'site-header--hidden': isInitiallyHidden,
			'site-header--overlay-active': overlayActive
		}"
	>
		<SiteNav />
	</header>
	<div class="logo-trigger"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { gsap } from '../utils/animations/gsap'
import SiteNav from './SiteNav.vue'

const props = withDefaults(defineProps<{
	visible?: boolean
	overlayActive?: boolean
}>(), {
	visible: true,
	overlayActive: false
})

const header = ref<HTMLElement | null>(null)
const isInitiallyHidden = ref(!props.visible)

function setHeaderState(isVisible: boolean) {
	if (!header.value) return

	gsap.set(header.value, {
		autoAlpha: isVisible ? 1 : 0,
		y: isVisible ? 0 : -16
	})
}

function animateHeader(isVisible: boolean) {
	if (!header.value) return

	gsap.to(header.value, {
		autoAlpha: isVisible ? 1 : 0,
		y: isVisible ? 0 : -16,
		duration: isVisible ? 0.45 : 0.3,
		ease: 'power2.out',
		overwrite: true
	})
}

onMounted(() => {
	setHeaderState(props.visible)
	isInitiallyHidden.value = false
})

watch(
	() => props.visible,
	(isVisible) => {
		animateHeader(isVisible)
	}
)

onUnmounted(() => {
	if (!header.value) return

	gsap.killTweensOf(header.value)
})
</script>
