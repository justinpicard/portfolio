<template>
	<main class="main" :class="{ 'scrolled': hasScrolled, 'scrolled-after': hasScrolledAfter }">
		<router-view></router-view>
	</main>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const SCROLL_THRESHOLD = 10
const AFTER_SCROLL_THRESHOLD = 200

const hasScrolled = ref(false)
const hasScrolledAfter = ref(false)

function handleScroll() {
	hasScrolled.value = window.scrollY > SCROLL_THRESHOLD
	hasScrolledAfter.value = window.scrollY > AFTER_SCROLL_THRESHOLD
}

onMounted(() => {
	handleScroll()
	window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
	window.removeEventListener('scroll', handleScroll)
})
</script>
