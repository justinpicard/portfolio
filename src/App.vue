<template>
	<main
		class="main"
		:class="{
			'scrolled': hasScrolled,
			'scrolled-after': hasScrolledAfter,
			'page-bottom': isAtPageBottom
		}"
	>
		<router-view></router-view>
	</main>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const SCROLL_THRESHOLD = 10
const AFTER_SCROLL_THRESHOLD = 200

const hasScrolled = ref(false)
const hasScrolledAfter = ref(false)
const isAtPageBottom = ref(false)
let maximumScrollY = 0
let documentResizeObserver

function handleScroll() {
	hasScrolled.value = window.scrollY > SCROLL_THRESHOLD
	hasScrolledAfter.value = window.scrollY > AFTER_SCROLL_THRESHOLD
	isAtPageBottom.value = window.scrollY >= maximumScrollY - 2
}

function updateScrollBounds() {
	maximumScrollY = document.documentElement.scrollHeight - window.innerHeight
	handleScroll()
}

onMounted(() => {
	updateScrollBounds()
	documentResizeObserver = new ResizeObserver(updateScrollBounds)
	documentResizeObserver.observe(document.body)
	window.addEventListener('scroll', handleScroll, { passive: true })
	window.addEventListener('resize', updateScrollBounds)
})

onUnmounted(() => {
	documentResizeObserver?.disconnect()
	window.removeEventListener('scroll', handleScroll)
	window.removeEventListener('resize', updateScrollBounds)
})
</script>
