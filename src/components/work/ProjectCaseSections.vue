<template>
	<div>
		<template
			v-for="section in caseStudy.sections"
			:key="section.id"
		>
			<p v-if="section.title"><strong>{{ section.title }}</strong></p>
			<p
				v-for="(paragraph, index) in section.paragraphs"
				:key="`${section.id}-${index}`"
			>
				{{ paragraph }}
			</p>
		</template>
	</div>
</template>

<script setup lang="ts">
import type { ProjectCaseStudy } from '../../content'

defineProps<{
	caseStudy: ProjectCaseStudy
}>()
</script>
