<script setup>
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
</script>

<template>
	<main class="main">
		<AppHeader/>
		<div class="main-wrap">
			<router-view/>
		</div>
		<AppFooter/>
	</main>
</template>