import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'

const manifest = JSON.parse(await readFile('src/generated/image-manifest.json', 'utf8'))
for (const [original, image] of Object.entries(manifest)) {
	const source = await readFile(`public${original}`)
	assert(source.equals(await readFile(`dist${original}`)), `Fallback changed: ${original}`)
	assert(image.bytes <= source.length * 0.9, `Insufficient savings: ${original}`)
	const sourceMetadata = await sharp(source).rotate().toBuffer({ resolveWithObject: true })
	assert.equal(image.width, sourceMetadata.info.width)
	assert.equal(image.height, sourceMetadata.info.height)
	for (const variant of [...image.variants, image]) {
		const output = await readFile(`dist${variant.url}`)
		const metadata = await sharp(output).metadata()
		assert.equal(metadata.format, 'webp')
		assert.equal(metadata.width, variant.width)
		assert.equal(metadata.height, variant.height)
		assert(variant.width <= image.width)
		assert.equal(output.length, variant.bytes)
	}
	if (original.endsWith('.png')) {
		const before = await sharp(source).rotate().ensureAlpha().raw().toBuffer()
		const after = await sharp(`dist${image.url}`).ensureAlpha().raw().toBuffer()
		assert.equal(before.length, after.length)
		for (let offset = 0; offset < before.length; offset += 4) {
			assert.equal(before[offset + 3], after[offset + 3], `Alpha changed: ${original}`)
			// WebP may discard invisible RGB beneath fully transparent pixels.
			if (before[offset + 3] > 0) assert(before.subarray(offset, offset + 3).equals(after.subarray(offset, offset + 3)), `Visible PNG pixels changed: ${original}`)
		}
	}
}
const html = await readFile('dist/index.html', 'utf8')
assert(html.includes('type="image/webp"'), 'Prerender must include optimized sources')
assert(html.includes('loading="lazy"'), 'Lazy loading must remain the default')
assert(!html.includes('fetchpriority="high"'), 'Do not broadly prioritize images')
console.log(`Image verification passed: ${Object.keys(manifest).length} originals, dimensions, WebP outputs, lossless PNG pixels and prerendered sources.`)
