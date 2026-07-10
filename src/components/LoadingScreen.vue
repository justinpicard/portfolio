<template>
	<div
		ref="intro"
		class="intro-screen"
		aria-hidden="true"
	>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const intro = ref<HTMLElement | null>(null)

defineExpose({
	element: intro
})
</script>
