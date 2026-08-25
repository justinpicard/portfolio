<template>
	<figure
		class="case-media-block"
		:class="`case-media-block--${block.presentation ?? 'natural'}`"
	>
		<BaseImage
			class-name="case-media-block__image"
			:src="`/images/${block.src}`"
			:alt="block.alt"
			:fallback-format="block.format"
			:position="mediaPosition"
		/>
		<figcaption v-if="block.caption" class="case-media-block__caption">
			{{ block.caption }}
		</figcaption>
	</figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CaseMediaBlock } from '../../../content'
import BaseImage from '../../base/BaseImage.vue'

const props = defineProps<{
	block: CaseMediaBlock
}>()

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
