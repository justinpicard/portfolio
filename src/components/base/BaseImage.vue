<template>
	<picture
		class="base-image"
		:class="[
			className,
			{ 'base-image--rounded': rounded }
		]"
		:style="imageStyles"
	>
		<source
			v-if="!useFallbackOnly"
			:srcset="formatSource('avif')"
			type="image/avif"
		>
		<source
			v-if="!useFallbackOnly"
			:srcset="formatSource('webp')"
			type="image/webp"
		>
		<img
			:src="fallbackSource"
			:alt="alt"
			:width="width"
			:height="height"
			:loading="loading"
			:decoding="decoding"
			@error="handleImageError"
		>
	</picture>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'

type ImageFormat = 'avif' | 'webp' | 'jpg' | 'jpeg' | 'png'

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

const formatSource = (format: ImageFormat) => `${props.src}.${format}`
const fallbackSource = computed(() => formatSource(props.fallbackFormat))
const useFallbackOnly = ref(false)

watch(() => props.src, () => {
	useFallbackOnly.value = false
})

const handleImageError = () => {
	if (useFallbackOnly.value) return

	useFallbackOnly.value = true
}

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
