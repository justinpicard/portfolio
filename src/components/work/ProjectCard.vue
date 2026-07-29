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
		:aria-label="project.name"
		:aria-disabled="!interactive"
		:tabindex="interactive ? 0 : -1"
		:role="interactive ? 'button' : undefined"
		:style="cardStyles"
		data-project-card
		@click="handleOpen"
		@keydown.enter.prevent="handleOpen"
		@keydown.space.prevent="handleOpen"
	>

		<div class="project-card__content">
			<p class="project-card__year" data-project-shared="year">{{ project.year }}</p>
			<h3 class="project-card__title" data-project-shared="title">{{ project.name }}</h3>
			<p class="project-card__description" data-project-shared="intro">
				{{ project.type }}
			</p>
			<div class="project-card__tags" data-project-shared="tags">
				<Tag
					v-for="tag in project.tags"
					:key="tag"
				>
					{{ tag }}
				</Tag>
			</div>
		</div>

		<div class="project-card__visual" data-project-shared="media">
			<BaseImage
				:src="`/images/${project.image}`"
				:alt="project.name"
				:fallback-format="project.imageFormat"
				aspect-ratio="16 / 7"
			/>
		</div>

		<CircularScrollIndicator
			ref="projectIndicator"
			variant="project"
			text="VIEW PROJECT • VIEW PROJECT •"
			:href="undefined"
			aria-label=""
			:show-icon="false"
			aria-hidden="true"
		/>

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
import {
	computed,
	onMounted,
	onUnmounted,
	ref,
	watch,
	type CSSProperties
} from 'vue'
import { useCursorFollowIndicator } from '../../composables/useCursorFollowIndicator'
import type { Project } from '../../types/project'
import BaseImage from '../base/BaseImage.vue'
import CircularScrollIndicator from '../ui/CircularScrollIndicator.vue'
import Tag from '../ui/Tag.vue'

const props = defineProps<{
	index: number
	project: Project
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

const cardStyles = computed<CSSProperties>(() => (
	props.project.overlayBackground
		? {
			'--project-card-color': props.project.overlayBackground
		} as CSSProperties
		: {}
))

const card = ref<HTMLElement | null>(null)
const projectIndicator = ref<InstanceType<typeof CircularScrollIndicator> | null>(
	null
)
const projectIndicatorWrapper = computed(
	() => projectIndicator.value?.element ?? null
)
const projectIndicatorVisual = computed(
	() => projectIndicator.value?.indicator ?? null
)
let cursorFollowIndicator: ReturnType<typeof useCursorFollowIndicator> | undefined

function handleOpen() {
	if (!props.interactive || !card.value) return

	emit('open', {
		projectIndex: props.index,
		sourceElement: card.value
	})
}

onMounted(() => {
	if (!projectIndicatorWrapper.value || !projectIndicatorVisual.value) return

	cursorFollowIndicator = useCursorFollowIndicator({
		triggerElement: card,
		wrapperElement: projectIndicatorWrapper,
		visualElement: projectIndicatorVisual
	})

	if (props.interactive) {
		cursorFollowIndicator.enable()
	}
})

watch(() => props.interactive, (interactive) => {
	if (interactive) {
		cursorFollowIndicator?.enable()
		return
	}

	cursorFollowIndicator?.disable()
})

onUnmounted(() => {
	cursorFollowIndicator?.cleanup()
})
</script>
