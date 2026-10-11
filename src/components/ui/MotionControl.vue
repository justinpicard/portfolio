<template>
	<button
		class="motion-control"
		type="button"
		:aria-label="t(paused ? 'accessibility.resumeMotion' : 'accessibility.pauseMotion')"
		@click="emit('toggle')"
	>
		<span aria-hidden="true">{{ paused ? '▶' : 'Ⅱ' }}</span>
	</button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ paused: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
const { t } = useI18n()
</script>
