<template>
	<div class="case-text-block">
		<span v-if="block.eyebrow" class="case-eyebrow eyebrow">{{ block.eyebrow }}</span>
		<h4 v-if="block.title" class="case-text-block__title">
			{{ block.title }}
		</h4>
		<p
			v-for="(paragraph, index) in block.paragraphs"
			:key="index"
		>
			{{ paragraph }}
		</p>
	</div>
</template>

<script setup lang="ts">
import type { CaseTextBlock } from '../../../content'

defineProps<{
	block: CaseTextBlock
}>()
</script>
