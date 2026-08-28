<template>
	<picture
		class="base-image"
		:class="[
			className,
			{ 'base-image--rounded': rounded }
		]"
		:style="imageStyles"
	>
		<img
			:src="fallbackSource"
			:alt="alt"
			:width="width"
			:height="height"
			:loading="loading"
			:decoding="decoding"
		>
	</picture>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
	src: string
	alt: string
	width?: number | string
	height?: number | string
	loading?: 'lazy' | 'eager'
	decoding?: 'async' | 'sync' | 'auto'
	fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
	position?: string
	rounded?: boolean
	aspectRatio?: string
	className?: string
	fallbackFormat?: 'jpg' | 'jpeg' | 'png'
}>(), {
	loading: 'lazy',
	decoding: 'async',
	fit: 'cover',
	position: 'center',
	rounded: false,
	fallbackFormat: 'jpg'
})

const fallbackSource = computed(() => `${props.src}.${props.fallbackFormat}`)

const toCssSize = (value?: number | string) => {
	if (value === undefined) return undefined

	if (typeof value === 'number') return `${value}px`

	return /^\d+(\.\d+)?$/.test(value) ? `${value}px` : value
}

const imageStyles = computed<CSSProperties>(() => ({
	'--base-image-width': toCssSize(props.width),
	'--base-image-height': toCssSize(props.height),
	'--base-image-aspect-ratio': props.aspectRatio,
	'--base-image-fit': props.fit,
	'--base-image-position': props.position
} as CSSProperties))
</script>
