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

function handleScroll() {
	const maximumScrollY = document.documentElement.scrollHeight - window.innerHeight

	hasScrolled.value = window.scrollY > SCROLL_THRESHOLD
	hasScrolledAfter.value = window.scrollY > AFTER_SCROLL_THRESHOLD
	isAtPageBottom.value = window.scrollY >= maximumScrollY - 2
}

onMounted(() => {
	handleScroll()
	window.addEventListener('scroll', handleScroll, { passive: true })
	window.addEventListener('resize', handleScroll)
})

onUnmounted(() => {
	window.removeEventListener('scroll', handleScroll)
	window.removeEventListener('resize', handleScroll)
})
</script>
