<script setup>
import AppHeader from "./components/AppHeader.vue";
</script>

<template>
	<main class="main">
		<AppHeader/>
		<div class="main-wrap">
			<router-view/>
		</div>
	</main>
</template>