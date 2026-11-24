<template>
	<CaseTextBlock
		v-if="block.type === 'text'"
		:block="block"
		:class="layoutClasses"
	/>
	<CaseMediaBlock
		v-else-if="block.type === 'media'"
		:block="block"
		:class="layoutClasses"
	/>
	<CaseFeatureBlock
		v-else-if="block.type === 'feature'"
		:block="block"
		:class="layoutClasses"
	/>
	<CaseMediaGroupBlock
		v-else-if="block.type === 'media-group'"
		:block="block"
		:class="layoutClasses"
	/>
	<CaseMediaCarouselBlock
		v-else-if="block.type === 'media-carousel'"
		:block="block"
		:class="layoutClasses"
	/>
	<CaseColumnsBlock
		v-else
		:block="block"
		:class="layoutClasses"
	/>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CaseBlock } from '../../../content'
import CaseMediaCarouselBlock from './CaseMediaCarouselBlock.vue'
import CaseMediaGroupBlock from './CaseMediaGroupBlock.vue'
import CaseColumnsBlock from './CaseColumnsBlock.vue'
import CaseFeatureBlock from './CaseFeatureBlock.vue'
import CaseMediaBlock from './CaseMediaBlock.vue'
import CaseTextBlock from './CaseTextBlock.vue'

const props = defineProps<{
	block: CaseBlock
}>()

const layoutClasses = computed(() => {
	return [
		'case-block',
		`case-block--width-${props.block.width ?? 'content'}`,
		`case-block--align-${props.block.align ?? 'center'}`,
		props.block.spacingAfter ? `case-block--spacing-after-${props.block.spacingAfter}` : undefined
	]
})
</script>
