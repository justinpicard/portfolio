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
	return manifest[originalUrl]
}

const dimensionManifests = import.meta.glob<Record<string, { width: number; height: number }>>('../../generated/image-dimensions.json', {
	eager: true,
	import: 'default'
})
const dimensions = Object.values(dimensionManifests)[0] ?? {}

export function getImageDimensions(originalUrl: string) {
	return dimensions[originalUrl]
}
