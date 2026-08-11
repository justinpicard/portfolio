<template>
	<div class="sfvonline-case">
		<ProjectCaseSections
			:case-study="project.caseStudy"
			:project-slug="project.slug"
		/>
	</div>
</template>

<script setup lang="ts">
import type { Project } from '../../../content'
import ProjectCaseSections from '../ProjectCaseSections.vue'

defineProps<{
	project: Project
}>()
</script>
