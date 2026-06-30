<template>
	<LoadingScreen />
	<SectionHomeHero/>
	<SectionHomeAbout />
	<SectionHomeProjects />
</template>

<script setup>
import LoadingScreen from "../components/LoadingScreen.vue"
import SectionHomeHero from "./home/SectionHomeHero.vue";
import SectionHomeAbout from "./home/SectionHomeAbout.vue";
import SectionHomeProjects from "./home/SectionHomeProjects.vue";
</script>