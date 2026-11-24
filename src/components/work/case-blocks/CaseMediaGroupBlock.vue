<template>
	<component
		:is="block.caption ? 'figure' : 'div'"
		class="case-media-group"
		:class="`case-media-group--${block.layout}`"
	>
		<div
			class="case-media-group__composition"
			:class="`case-media-group__composition--${block.layout}`"
			:style="compositionStyles"
		>
			<div
				v-for="(item, index) in block.items"
				:key="index"
				class="case-media-group__item"
				:style="itemStyles(item)"
			>
				<CaseMediaBlock
					:block="mediaBlock(item)"
					:inside-shared-figure="Boolean(block.caption)"
					:sizes="itemSizes(item)"
				/>
			</div>
		</div>
		<CaseMediaCaption
			v-if="block.caption"
			:caption="block.caption"
		/>
	</component>
</template>

<script setup lang="ts">
import CaseMediaCaption from './CaseMediaCaption.vue'
import { computed, type CSSProperties } from 'vue'
import type { CaseMediaBlock as MediaBlock, CaseMediaGroupBlock, CaseMediaGroupItem } from '../../../content'
import { caseImageSizes } from '../../../utils/images/caseImageSizes'
import { mediaAppearanceStyles, mapMediaSizes, mediaSpacing, mediaSpacingLengths } from '../../../utils/media/caseMedia'
import CaseMediaBlock from './CaseMediaBlock.vue'

const props = defineProps<{ block: CaseMediaGroupBlock }>()
const threeUpShare = computed(() => props.block.width === 'narrow' ? 0.5 : props.block.width === 'full' ? 1 : 0.75)
const percent = (width = 100) => Math.max(1, Math.min(100, width))
const compositionStyles = computed<CSSProperties>(() => ({
	...Object.fromEntries(Object.entries(mediaAppearanceStyles(props.block.appearance))
		.map(([key, value]) => [key.replace('--case-media-', '--case-group-'), value])),
	'--case-group-three-up-width': props.block.layout === 'three-up' ? `${threeUpShare.value * 100}%` : undefined,
	'--case-group-gap': mediaSpacing[props.block.gap ?? 'medium'],
	'--case-group-vertical-align': props.block.verticalAlign ?? 'center'
} as CSSProperties))

function itemStyles(item: CaseMediaGroupItem): CSSProperties {
	return {
		'--case-group-item-width': `${percent(item.width)}%`,
		'--case-group-item-weight': percent(item.width),
		'--case-group-item-align': item.align ?? 'center',
		'--case-group-item-offset': mediaSpacing[item.offsetBlock ?? 'none'],
		'--case-group-item-mobile-width': `${percent(item.belowMd?.width)}%`,
		'--case-group-item-mobile-align': item.belowMd?.align ?? 'center',
		'--case-group-item-mobile-offset': mediaSpacing[item.belowMd?.offsetBlock ?? 'none']
	} as CSSProperties
}

function mediaBlock(item: CaseMediaGroupItem): MediaBlock {
	const { width, align, offsetBlock, belowMd, ...media } = item
	return media
}

function itemSizes(item: CaseMediaGroupItem) {
	const block = props.block
	const rowShare = percent(item.width) / block.items.reduce((sum, entry) => sum + percent(entry.width), 0)
	const threeUp = block.layout === 'three-up'
	return mapMediaSizes(caseImageSizes(threeUp ? 'full' : block.width), (length, mobile) => {
		const padding = mobile ? block.appearance?.belowMd?.padding ?? block.appearance?.padding : block.appearance?.padding
		const gaps = !mobile ? block.layout === 'grid' ? 1 : block.layout === 'row' ? block.items.length - 1 : 0 : 0
		let share = mobile ? percent(item.belowMd?.width) / 100 : block.layout === 'grid' ? percent(item.width) / 200 : block.layout === 'row' ? rowShare : percent(item.width) / 100
		if (threeUp && !mobile) {
			// The three-up composition spans the viewport without desktop page gutters.
			length = '100vw'
			share = threeUpShare.value
		}
		return `calc((${length} - 2 * ${mediaSpacingLengths[padding ?? 'none']} - ${gaps} * ${mediaSpacingLengths[block.gap ?? 'medium']}) * ${share})`
	})
}
</script>
