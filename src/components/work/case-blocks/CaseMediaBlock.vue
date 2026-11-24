<template>
	<component
		:is="rootElement"
		class="case-media-block"
		:class="[
			`case-media-block--${block.presentation ?? 'natural'}`,
			{ 'case-media-block--full-bleed': block.fullBleed }
		]"
	>
		<div class="case-media-block__frame" :style="appearanceStyles">
			<BaseImage
				class-name="case-media-block__image"
				:src="`/images/${block.src}`"
				:alt="block.alt"
				:fallback-format="block.format"
				:position="mediaPosition"
				:sizes="imageSizes"
			/>
		</div>
		<CaseMediaCaption
			v-if="block.caption"
			:caption="block.caption"
			class="case-media-block__caption"
		/>
	</component>
</template>

<script setup lang="ts">
import CaseMediaCaption from './CaseMediaCaption.vue'
import { computed } from 'vue'
import type { CaseMediaBlock } from '../../../content'
import BaseImage from '../../base/BaseImage.vue'
import { mediaAppearanceStyles, mediaImageSizes } from '../../../utils/media/caseMedia'
import { caseImageSizes } from '../../../utils/images/caseImageSizes'

const props = defineProps<{
	block: CaseMediaBlock
	insideSharedFigure?: boolean
	sizes?: string
}>()

const appearanceStyles = computed(() => mediaAppearanceStyles(props.block.appearance))
const imageSizes = computed(() => mediaImageSizes(
	props.sizes ?? (props.block.fullBleed ? '100vw' : caseImageSizes(props.block.width)),
	props.block.appearance
))

const rootElement = computed(() => (
	props.insideSharedFigure && !props.block.caption ? 'div' : 'figure'
))

const mediaPositions = {
	center: 'center center',
	top: 'center top',
	right: 'right center',
	bottom: 'center bottom',
	left: 'left center'
} as const

const mediaPosition = computed(() => (
	mediaPositions[props.block.position ?? 'center']
))
</script>
