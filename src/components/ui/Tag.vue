<template>
	<span :class="['tag', `tag--${size}`]">
		<slot />
	</span>
</template>

<script setup lang="ts">
export type TagSize = 'sm' | 'md'

withDefaults(defineProps<{
	size?: TagSize
}>(), {
	size: 'md'
})
</script>
