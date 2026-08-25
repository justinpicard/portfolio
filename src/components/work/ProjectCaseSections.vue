<template>
	<div class="project-case-study">
		<section
			class="section-layout section-layout--case project-case-study__introduction"
			:class="`${projectSlug}-case__introduction`"
		>
			<div class="container">
				<div class="row">
					<div class="project-case-study__introduction-content">
						<p
							v-for="(paragraph, index) in caseStudy.introduction"
							:key="`introduction-${index}`"
							class="project-case-study__introduction-text"
						>
							{{ paragraph }}
						</p>
					</div>
				</div>
			</div>
		</section>

		<section
			v-for="section in renderedSections"
			:key="section.id"
			:id="section.id"
			class="section-layout section-layout--case project-case-study__section"
			:class="`section-layout--case-${section.spacing}`"
		>
			<div class="container">
				<div class="row project-case-study__section-row">
					<div
						v-if="section.title"
						class="project-case-study__section-heading"
					>
						<h3>{{ section.title }}</h3>
					</div>

					<CaseBlockRenderer
						v-for="(block, index) in section.blocks"
						:key="`${section.id}-${index}`"
						:block="block"
					/>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
	CaseBlock,
	ProjectCaseStudy,
	ProjectSlug
} from '../../content'
import CaseBlockRenderer from './case-blocks/CaseBlockRenderer.vue'

const props = defineProps<{
	caseStudy: ProjectCaseStudy
	projectSlug: ProjectSlug
}>()

const renderedSections = computed(() => props.caseStudy.sections.map((section) => ({
	id: section.id,
	title: section.title,
	spacing: section.spacing ?? 'default',
	blocks: section.blocks ?? [{
		type: 'text',
		paragraphs: section.paragraphs
	} satisfies CaseBlock]
})))
</script>
