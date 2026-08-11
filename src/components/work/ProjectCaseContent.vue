<template>
	<component
		:is="caseComponent"
		:project="project"
	/>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '../../content'
import { getCaseComponent } from './cases/caseRegistry'

const props = defineProps<{
	project: Project
}>()

const caseComponent = computed(() => getCaseComponent(props.project.slug))
</script>
