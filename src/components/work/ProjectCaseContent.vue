<template>
	<div
		v-if="caseStudy.layout === 'contained'"
		class="container"
	>
		<div class="row">
			<div class="col-12 lg:col-8 lg:offset-2 mb-3">
				<ProjectCaseSections :case-study="caseStudy" />
			</div>
		</div>
	</div>
	<ProjectCaseSections
		v-else
		:case-study="caseStudy"
	/>
</template>

<script setup lang="ts">
import type { ProjectCaseStudy } from '../../content'
import ProjectCaseSections from './ProjectCaseSections.vue'

defineProps<{
	caseStudy: ProjectCaseStudy
}>()
</script>
