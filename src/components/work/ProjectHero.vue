<template>
	<div class="project-hero">
		<div class="project-layer-prototype__copy">
			<p data-project-transition-text>
				<span ref="year" data-project-shared="year">{{ project.year }}</span>
			</p>
			<h2
				ref="title"
				id="project-layer-title"
				data-project-transition-text
				data-project-shared="title"
				class="text-5xl"
			>
				{{ project.name }}
			</h2>
			<p
				ref="intro"
				class="project-layer-prototype__intro text-2xl"
				data-project-transition-text
				data-project-shared="intro"
			>
				{{ project.type }}
			</p>
			<div class="project-layer-prototype__body">
				<div
					ref="tags"
					class="project-layer-prototype__tags"
					data-project-shared="tags"
				>
					<Tag
						v-for="tag in project.tags"
						:key="tag"
					>
						{{ tag }}
					</Tag>
				</div>
			</div>
		</div>

		<div
			ref="media"
			class="project-layer-prototype__media"
			data-project-shared="media"
		>
			<BaseImage
				:key="project.id"
				:src="`/images/${project.image}`"
				:alt="project.name"
				:fallback-format="project.imageFormat"
				loading="eager"
			/>
		</div>

		<div class="project-layer-prototype__copy">
			<div ref="description">
				<RichTextContent :content="project.description" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Project } from '../../types/project'
import BaseImage from '../base/BaseImage.vue'
import RichTextContent from '../base/RichTextContent.vue'
import Tag from '../ui/Tag.vue'

defineProps<{
	project: Project
}>()

const media = ref<HTMLElement | null>(null)
const year = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const intro = ref<HTMLElement | null>(null)
const tags = ref<HTMLElement | null>(null)
const description = ref<HTMLElement | null>(null)

defineExpose({
	getMediaElement: () => media.value,
	getSharedElements: () => ({
		media: media.value,
		year: year.value,
		title: title.value,
		intro: intro.value,
		tags: tags.value
	}),
	getDetailElements: () => [
		description.value
	].filter(Boolean) as HTMLElement[],
	getContextBodyElements: () => [
		tags.value,
		description.value
	].filter(Boolean) as HTMLElement[]
})
</script>
