<template>
	<component :is="block.caption ? 'figure' : 'div'" class="case-columns-block">
		<div class="case-columns-block__grid">
			<div
				v-for="(column, columnIndex) in block.columns"
				:key="columnIndex"
				class="case-columns-block__column"
				:class="`case-columns-block__column--${column.emphasis ?? 'equal'}`"
			>
				<template
					v-for="(columnBlock, blockIndex) in column.blocks"
					:key="blockIndex"
				>
					<CaseTextBlock
						v-if="columnBlock.type === 'text'"
						:block="columnBlock"
						class="case-block case-block--contained"
					/>
					<CaseMediaBlock
						v-else
						:block="columnBlock"
						:inside-shared-figure="Boolean(block.caption)"
						:sizes="caseImageSizes(block.width, (column.emphasis === 'wide' ? 2 : 1) / columnWeight, block.columns.length - 1)"
						class="case-block case-block--contained"
					/>
				</template>
			</div>
		</div>
		<CaseMediaCaption
			v-if="block.caption"
			:caption="block.caption"
			class="case-columns-block__caption"
		/>
	</component>
</template>

<script setup lang="ts">
import CaseMediaCaption from './CaseMediaCaption.vue'
import { computed } from 'vue'
import { caseImageSizes } from '../../../utils/images/caseImageSizes'
import type { CaseColumnsBlock } from '../../../content'
import CaseMediaBlock from './CaseMediaBlock.vue'
import CaseTextBlock from './CaseTextBlock.vue'

const props = defineProps<{
	block: CaseColumnsBlock
}>()
const columnWeight = computed(() => props.block.columns.reduce((sum, column) => sum + (column.emphasis === 'wide' ? 2 : 1), 0))
</script>
