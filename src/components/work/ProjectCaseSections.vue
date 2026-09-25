<template>
	<div class="project-case-study">
		<section
			class="section-layout section-layout--case section-layout--case-spacious project-case-study__introduction"
			:class="`${projectSlug}-case__introduction`"
		>
			<div class="container">
				<div class="row">
					<div class="project-case-study__introduction-content case-block--width-content case-block--align-center">
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

		<component
			v-for="section in renderedSections"
			:is="section.isMedia ? 'div' : 'section'"
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
						:class="section.isFirst
							? [`case-block--width-${section.headingWidth}`, 'case-block--align-center']
							: undefined"
					>
						<span v-if="section.eyebrow" class="case-eyebrow eyebrow">{{ section.eyebrow }}</span>
						<h3>{{ section.title }}</h3>
					</div>

					<CaseBlockRenderer
						v-for="(block, index) in section.blocks"
						:key="`${section.id}-${index}`"
						:block="block"
					/>
				</div>
			</div>
		</component>
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

const renderedSections = computed(() => props.caseStudy.sections.map((section, sectionIndex) => {
	if ('type' in section) {
		return {
			id: section.id,
			spacing: section.spacing ?? 'default',
			isMedia: true,
			isFirst: false,
			title: undefined,
			eyebrow: undefined,
			headingWidth: undefined,
			blocks: [section]
		}
	}

	// Interstitial media must not change the first story section's layout defaults.
	const isFirst = sectionIndex === props.caseStudy.sections.findIndex(item => !('type' in item))
	const blocks: CaseBlock[] = section.blocks ?? [{
		type: 'text',
		paragraphs: section.paragraphs
	}]
	const firstTextBlockIndex = isFirst
		? blocks.findIndex(block => block.type === 'text')
		: -1

	return {
		id: section.id,
		eyebrow: section.eyebrow,
		title: section.title,
		spacing: section.spacing ?? 'default',
		isFirst,
		isMedia: false,
		headingWidth: blocks[firstTextBlockIndex]?.width ?? 'narrow',
		blocks: blocks.map((block, blockIndex) => (
			blockIndex === firstTextBlockIndex
				? {
					...block,
					width: block.width ?? 'narrow',
					align: block.align ?? 'center'
				}
				: block
		))
	}
}))
</script>
