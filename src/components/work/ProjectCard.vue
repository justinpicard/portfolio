<template>
	<article
		class="project-card"
		:style="cardStyles"
	>
		<a
			class="project-card__trigger"
			:href="project.link"
			target="_blank"
			rel="noopener"
		>
			<div class="project-card__meta">
				<span class="project-card__number">{{ formattedNumber }}</span>
				<h3 class="project-card__title">{{ project.name }}</h3>
				<p class="project-card__context">{{ project.type }} · {{ project.job }}</p>
			</div>
			<div class="project-card__media">
				<div class="project-card__media-inner">
					<BaseImage
						class-name="project-card__image"
						:src="`/images/${project.image}`"
						:alt="project.name"
						aspect-ratio="4 / 3"
					/>
				</div>
			</div>
		</a>
	</article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import BaseImage from '../base/BaseImage.vue'

type Project = {
	id: string
	name: string
	image: string
	link: string
	job: string
	type: string
	year: string
}

const props = defineProps<{
	project: Project
	index: number
}>()

const formattedNumber = computed(() => String(props.index + 1).padStart(2, '0'))

const cardStyles = computed<CSSProperties>(() => ({
	'--project-card-mobile-order': props.index + 1
} as CSSProperties))
</script>
