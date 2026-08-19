<template>
	<div class="project-hero">
		<div class="container">
			<div class="row">
				<div class="col-12 lg:col-8 lg:offset-2">
					<div class="project-layer-prototype__copy">
						<span
							ref="intro"
							class="eyebrow"
							data-project-shared="intro"
						>
							{{ project.title }}
						</span>
						<h2
							ref="title"
							id="project-layer-title"
							data-project-transition-text
							data-project-shared="title"
							class="text-4xl"
						>
							{{ project.summary }}
						</h2>
					</div>
				</div>
			</div>
			<div class="row">
				<div class="col-12 mb-6">
					<div
						ref="metadata"
						class="project-layer-prototype__copy project-layer-prototype__metadata d-flex flex-row justify-between"
					>
						<div 
							ref="year" 
							data-project-shared="year" 
							data-project-metadata 
							class="d-flex gap-1 flex-column"
						>
								<span class="eyebrow text-2xs opacity-50">{{ t('project.year') }}</span>
								<span class="text-md">{{ project.year }}</span>
						</div>
						<div 
							data-project-metadata
							class="d-flex gap-1 flex-column"
						>
							<span class="eyebrow text-2xs opacity-50">{{ t('project.job') }}</span>
							<span class="text-md">{{ project.job }}</span>
						</div>
						<div 
							data-project-metadata
							class="d-flex gap-1 flex-column"
						>
							<span class="eyebrow text-2xs opacity-50">{{ t('project.role') }}</span>
							<span class="text-md">{{ project.role }}</span>
						</div>
						<div 
							class="d-flex gap-1 flex-column"
							data-project-metadata
						>
							<span class="eyebrow text-2xs opacity-50">{{ t('project.type') }}</span>
							<span class="text-md">{{ project.type }}</span>
						</div>
						<div
							v-if="project.live"
							class="d-flex gap-1 flex-column"
							data-project-metadata
						>
							<span class="eyebrow text-2xs opacity-50">{{ t('project.live') }}</span>
							<a
								class="text-md text-primary"
								:href="project.live"
								target="_blank"
								rel="noopener noreferrer"
							>
								{{ displayLiveUrl }}
							</a>
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
			<ProjectHeroMedia
				:key="project.id"
				:project="project"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Project } from '../../content'
import ProjectHeroMedia from './ProjectHeroMedia.vue'

const props = defineProps<{
	project: Project
}>()

const { t } = useI18n()
const displayLiveUrl = computed(() => (
	props.project.live
		?.replace(/^https?:\/\//, '')
		.replace(/\/$/, '')
	?? ''
))
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
