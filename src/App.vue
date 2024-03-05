<script setup>
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
import MainNav from "./components/MainNav.vue";
</script>

<template>
	<main class="main">
		<MainNav/>
		<div class="main-wrap">
			<router-view/>
		</div>
		<AppFooter/>
	</main>
</template>