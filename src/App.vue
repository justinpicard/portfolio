<template>
	<main class="main" :class="{ 'scrolled': hasScrolled }">
		<AppHeader/>
		<router-view></router-view>
		<AppFooter />
	</main>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from "./components/AppHeader.vue"
import AppFooter from "./components/AppFooter.vue"

const hasScrolled = ref(false)

function handleScroll() {
	hasScrolled.value = window.scrollY > 10
}

onMounted(() => {
	window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
	window.removeEventListener('scroll', handleScroll)
})
</script>
