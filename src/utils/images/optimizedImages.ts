type ImageVariant = {
	url: string
	width: number
	height: number
	bytes: number
}

type OptimizedImage = ImageVariant & {
	variants: ImageVariant[]
}

// A clean development checkout needs no generated files. Both production bundles use the same manifest.
const manifests = import.meta.glob<Record<string, OptimizedImage>>('../../generated/image-manifest.json', {
	eager: true,
	import: 'default'
})
const manifest = import.meta.env.PROD ? Object.values(manifests)[0] ?? {} : {}

export function getOptimizedImage(originalUrl: string) {
	return manifest[originalUrl]
}
