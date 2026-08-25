<template>
	<div class="case-columns-block">
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
						class="case-block case-block--contained"
					/>
				</template>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { CaseColumnsBlock } from '../../../content'
import CaseMediaBlock from './CaseMediaBlock.vue'
import CaseTextBlock from './CaseTextBlock.vue'

defineProps<{
	block: CaseColumnsBlock
}>()
</script>
