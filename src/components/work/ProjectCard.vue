<template>
	<article
		ref="card"
		class="project-card"
		:class="[
			`project-card--${index + 1}`,
			{
				'project-card--active': active,
				'project-card--interactive': interactive,
				'project-card--transition-hidden': transitionHidden
			}
		]"
		:aria-label="`Prototype project ${index + 1}`"
		:aria-disabled="!interactive"
		:tabindex="interactive ? 0 : -1"
		:role="interactive ? 'button' : undefined"
		data-project-card
		@click="handleOpen"
		@keydown.enter.prevent="handleOpen"
		@keydown.space.prevent="handleOpen"
	>
		<span class="project-card__number" aria-hidden="true">
			{{ formattedNumber }}
		</span>
		<span
			class="project-card__shadow project-card__shadow--from-left"
			data-project-shadow-from-left
			aria-hidden="true"
		/>
		<span
			class="project-card__shadow project-card__shadow--from-right"
			data-project-shadow-from-right
			aria-hidden="true"
		/>
	</article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
	index: number
	active?: boolean
	interactive?: boolean
	transitionHidden?: boolean
}>()

const emit = defineEmits<{
	open: [payload: {
		projectIndex: number
		sourceElement: HTMLElement
	}]
}>()

const card = ref<HTMLElement | null>(null)
const formattedNumber = computed(() => String(props.index + 1).padStart(2, '0'))

function handleOpen() {
	if (!props.interactive || !card.value) return

	emit('open', {
		projectIndex: props.index,
		sourceElement: card.value
	})
}
</script>
