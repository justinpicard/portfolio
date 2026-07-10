<template>
	<AppHeader :visible="isHeaderVisible" />
	<SectionHomeHero ref="hero" />
	<SectionHomeAbout />
	<SectionHomeWork />
	<HomePhotoStackSection />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue"
import AppHeader from "../components/AppHeader.vue"
import HomePhotoStackSection from "../components/sections/HomePhotoStackSection.vue"
import SectionHomeHero from "../components/sections/SectionHomeHero.vue";
import SectionHomeAbout from "../components/sections/SectionHomeAbout.vue";
import SectionHomeWork from "../components/sections/SectionHomeWork.vue";

const hero = ref<InstanceType<typeof SectionHomeHero> | null>(null)
const isHeaderVisible = ref(false)
let heroObserver: IntersectionObserver | undefined

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
})
</script>
