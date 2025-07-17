<template>
	<main class="main">
        <AppHeader/>
        <router-view></router-view>
        <AppFooter/>
	</main>
</template>
<script setup lang="ts">
import AppFooter from "./components/AppFooter.vue";
import AppHeader from "./components/AppHeader.vue";
</script>