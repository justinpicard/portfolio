type ImageVariant = {
	url: string
	width: number
	height: number
	bytes: number
}

type OptimizedImage = ImageVariant & {
	variants: ImageVariant[]
}

// Production bundles share optimized sources; predev generates intrinsic dimensions only.
const manifests = import.meta.glob<Record<string, OptimizedImage>>('../../generated/image-manifest.json', {
	eager: true,
	import: 'default'
})
const manifest = import.meta.env.PROD ? Object.values(manifests)[0] ?? {} : {}

export function getOptimizedImage(originalUrl: string) {
	const image = manifest[originalUrl]
	if (import.meta.env.PROD && !image && !unoptimized[originalUrl]) {
		throw new Error(`Missing production image: ${originalUrl}. Check image generation and scripts/image-exclusions.json.`)
	}
	return image
}

const dimensionManifests = import.meta.glob<Record<string, { width: number; height: number }>>('../../generated/image-dimensions.json', {
	eager: true,
	import: 'default'
})
const dimensions = Object.values(dimensionManifests)[0] ?? {}

export function getImageDimensions(originalUrl: string) {
	return dimensions[originalUrl]
}

const unoptimizedManifests = import.meta.glob<Record<string, ImageVariant & { reason: string }>>('../../generated/image-unoptimized.json', {
	eager: true,
	import: 'default'
})
const unoptimized = Object.values(unoptimizedManifests)[0] ?? {}

export function getImageSource(originalUrl: string) {
	if (!import.meta.env.PROD) return originalUrl
	return getOptimizedImage(originalUrl)?.url ?? unoptimized[originalUrl].url
}
