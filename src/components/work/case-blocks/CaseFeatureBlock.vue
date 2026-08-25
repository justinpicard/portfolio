<template>
	<div
		class="case-feature-block"
		:class="`case-feature-block--${block.direction ?? 'text-media'}`"
	>
		<CaseTextBlock
			:block="block.text"
			class="case-feature-block__text"
		/>
		<CaseMediaBlock
			:block="block.media"
			class="case-feature-block__media"
		/>
	</div>
</template>

<script setup lang="ts">
import type { CaseFeatureBlock } from '../../../content'
import CaseMediaBlock from './CaseMediaBlock.vue'
import CaseTextBlock from './CaseTextBlock.vue'

defineProps<{
	block: CaseFeatureBlock
}>()
</script>
