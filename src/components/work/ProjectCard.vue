<template>
	<article
		class="project-card"
		:style="cardStyles"
	>
		<button
			class="project-card__trigger"
			type="button"
			@click="handleOpen"
		>
			<div class="project-card__meta">
				<span class="project-card__number">{{ formattedNumber }}</span>
				<h3 class="project-card__title">{{ project.name }}</h3>
				<p class="project-card__context">{{ project.type }} · {{ project.job }}</p>
			</div>
			<div
				ref="mediaFrame"
				class="project-card__media"
				:class="{ 'project-card__media--transition-hidden': mediaHidden }"
			>
				<div class="project-card__media-inner">
					<BaseImage
						class-name="project-card__image"
						:src="`/images/${project.image}`"
						:alt="project.name"
						aspect-ratio="4 / 3"
					/>
				</div>
			</div>
		</button>
	</article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CSSProperties } from 'vue'
import type { Project, ProjectOpenPayload } from '../../types/project'
import BaseImage from '../base/BaseImage.vue'

const props = defineProps<{
	project: Project
	index: number
	mediaHidden?: boolean
}>()

const emit = defineEmits<{
	open: [payload: ProjectOpenPayload]
}>()

const mediaFrame = ref<HTMLElement | null>(null)
const formattedNumber = computed(() => String(props.index + 1).padStart(2, '0'))

const cardStyles = computed<CSSProperties>(() => ({
	'--project-card-mobile-order': props.index + 1
} as CSSProperties))

function handleOpen(event: MouseEvent) {
	if (event.currentTarget instanceof HTMLElement) {
		event.currentTarget.focus({ preventScroll: true })
	}

	emit('open', {
		projectIndex: props.index,
		sourceMediaElement: mediaFrame.value
	})
}

defineExpose({
	mediaFrame
})
</script>
