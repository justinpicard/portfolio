// Content stores complete image stems; templates prepend /images at runtime.
// Keep exclusions explicit so dynamic layouts do not depend on bundler tree-shaking.
export function validateImageReferences(source, available, exclusions, publicAssets = []) {
	for (const file of exclusions) {
		if (source.includes(file.replace(/\.(jpe?g|png)$/i, ''))) {
			throw new Error(`Excluded image is referenced again: ${file}. Remove it from scripts/image-exclusions.json.`)
		}
	}
	for (const match of source.matchAll(/['"](\/[^'"\n${}]+\.(?:png|jpe?g|svg|webm|mp4|pdf))['"]/g)) {
		const url = match[1]
		if (!url.startsWith('/images/') && !publicAssets.includes(url.slice(1))) {
			throw new Error(`Missing public asset: ${url}. Restore it in public before building.`)
		}
	}
	const stems = new Set(available.map(file => file.replace(/\.(jpe?g|png)$/i, '')))
	for (const match of source.matchAll(/['"]((?:\/images\/|projects\/)[^'"\n${}]+)['"]/g)) {
		const file = match[1].replace(/^\/images\//, '')
		if (!stems.has(file.replace(/\.(jpe?g|png)$/i, ''))) {
			throw new Error(`Missing image or public asset: /images/${file}. Restore the source in assets/source-images or the asset in public/images.`)
		}
	}
}
