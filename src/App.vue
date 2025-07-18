<template>
	<main class="main">
		<AppHeader/>
		<router-view></router-view>
	</main>
</template>
<script setup lang="ts">
import AppHeader from "./components/AppHeader.vue";
</script>