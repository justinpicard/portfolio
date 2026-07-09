<template>
	<SectionHomeHero/>
	<SectionHomeAbout />
	<SectionHomeProjects />
	<HomePhotoStackSection />
	
</template>

<script setup>
import LoadingScreen from "../components/LoadingScreen.vue"
import HomePhotoStackSection from "../components/sections/HomePhotoStackSection.vue"
import SectionHomeHero from "../components/sections/SectionHomeHero.vue";
import SectionHomeAbout from "../components/sections/SectionHomeAbout.vue";
import SectionHomeProjects from "../components/sections/SectionHomeProjects.vue";
</script>
