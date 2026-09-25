<template>
	<picture
		class="base-image"
		:class="[
			className,
			{ 'base-image--rounded': rounded }
		]"
		:style="imageStyles"
	>
		<source v-if="optimizedImage" type="image/webp" :srcset="webpSrcset" :sizes="sizes" />
		<img
			:src="fallbackSource"
			:alt="alt"
			:width="width ?? optimizedImage?.width"
			:height="height ?? optimizedImage?.height"
			:loading="loading"
			:decoding="decoding"
		>
	</picture>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { getOptimizedImage } from '../../utils/images/optimizedImages'

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
	sizes?: string
}>(), {
	loading: 'lazy',
	decoding: 'async',
	fit: 'cover',
	position: 'center',
	rounded: false,
	fallbackFormat: 'jpg'
})

const fallbackSource = computed(() => `${props.src}.${props.fallbackFormat}`)
const optimizedImage = computed(() => getOptimizedImage(fallbackSource.value))
const webpSrcset = computed(() => {
	const image = optimizedImage.value
	if (!image) return undefined
	if (!props.sizes || !image.variants.length) return image.url
	return [...image.variants, image].map(variant => `${variant.url} ${variant.width}w`).join(', ')
})

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
