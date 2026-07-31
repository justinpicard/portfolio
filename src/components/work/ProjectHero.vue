<template>
	<div class="project-hero">
		<div class="container">
			<div class="row">
				<div class="col-12 lg:col-8 lg:offset-2 mb-3">
					<div class="project-layer-prototype__copy">
						<span
							ref="intro"
							class="eyebrow"
							data-project-shared="intro"
						>
							{{ project.name }}
						</span>
						<h2
							ref="title"
							id="project-layer-title"
							data-project-transition-text
							data-project-shared="title"
							class="text-4xl"
						>
							{{ project.description }}
						</h2>
					</div>
				</div>
			</div>
			<div class="row">
				<div class="col-12 mb-3">
					<div
						ref="metadata"
						class="project-layer-prototype__copy project-layer-prototype__metadata d-flex flex-row justify-between"
					>
						<div 
							ref="year" 
							data-project-shared="year" 
							data-project-metadata 
							class="d-flex gap-2 items-baseline"
						>
								<span class="eyebrow text-2xs opacity-50">Year</span>
								<span class="text-md">{{ project.year }}</span>
						</div>
						<div 
							data-project-metadata
							class="d-flex gap-2 items-baseline"
						>
							<span class="eyebrow text-2xs opacity-50">Job</span>
							<span class="text-md">{{ project.job }}</span>
						</div>
						<div 
							data-project-metadata
							class="d-flex gap-2 items-baseline"
						>
							<span class="eyebrow text-2xs opacity-50">Role</span>
							<span class="text-md">{{ project.role }}</span>
						</div>
						<div 
							class="project-layer-prototype__intro d-flex gap-2 items-baseline" 
							data-project-metadata
						>
							<span class="eyebrow text-2xs opacity-50">Type</span>
							<span class="text-md">{{ project.type }}</span>
						</div>
					</div>
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

		<div class="container">
			<div class="row">
				<div class="col-12 lg:col-8 lg:offset-2 mb-3">
					<div
						ref="metadata"
						class="project-layer-prototype__copy project-layer-prototype__metadata"
					>
						<p ref="year" data-project-shared="year" data-project-metadata>{{ project.year }}</p>
						<p data-project-metadata>{{ project.job }}</p>
						<p data-project-metadata>{{ project.role }}</p>
						<p class="project-layer-prototype__intro text-2xl" data-project-metadata>
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
				</div>
				</div>
			</div>

		</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Project } from '../../types/project'
import BaseImage from '../base/BaseImage.vue'
import Tag from '../ui/Tag.vue'

defineProps<{
	project: Project
}>()

const media = ref<HTMLElement | null>(null)
const year = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const intro = ref<HTMLElement | null>(null)
const tags = ref<HTMLElement | null>(null)
const metadata = ref<HTMLElement | null>(null)

defineExpose({
	getMediaElement: () => media.value,
	getSharedElements: () => ({
		media: media.value,
		year: year.value,
		title: title.value,
		intro: intro.value,
		tags: tags.value
	}),
	getMetadataElements: () => Array.from(
		metadata.value?.querySelectorAll<HTMLElement>(
			'[data-project-metadata], .project-layer-prototype__tags .tag'
		) ?? []
	).concat(intro.value ? [intro.value] : []),
	getDetailElements: () => [
		metadata.value
	].filter(Boolean) as HTMLElement[],
	getContextBodyElements: () => [
		tags.value,
		metadata.value
	].filter(Boolean) as HTMLElement[]
})
</script>
