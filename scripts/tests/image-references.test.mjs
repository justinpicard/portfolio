import assert from 'node:assert/strict'
import test from 'node:test'
import { validateImageReferences } from '../image-references.mjs'

test('image inventory covers content stems, development URLs and public video assets', () => {
	assert.doesNotThrow(() => validateImageReferences("src: 'projects/case/screen', src: '/images/avatar', webm: 'projects/case/hero.webm'", ['projects/case/screen.png', 'avatar.jpg', 'projects/case/hero.webm'], []))
})

test('missing dynamic case assets fail before generation with an actionable path', () => {
	assert.throws(() => validateImageReferences("src: 'projects/case/missing'", [], []), /Missing image or public asset: \/images\/projects\/case\/missing/)
})

test('archived images cannot silently reenter a case without updating exclusions', () => {
	assert.throws(() => validateImageReferences("src: 'projects/case/old'", ['projects/case/old.png'], ['projects/case/old.png']), /Excluded image is referenced again/)
})

test('development-only middleware serves originals without generated images and rejects traversal', async () => {
	const { imageDistribution } = await import('../image-distribution.mjs')
	const { readFile } = await import('node:fs/promises')
	const plugin = imageDistribution()
	let middleware
	plugin.configureServer({ middlewares: { use(handler) { middleware = handler } } })
	const headers = {}
	let body
	let passed = false
	await middleware({ url: '/images/justin-picard-hero.jpg', method: 'GET' }, {
		setHeader(key, value) { headers[key] = value },
		end(data) { body = data }
	}, () => { passed = true })
	assert.equal(passed, false)
	assert.equal(headers['Content-Type'], 'image/jpeg')
	assert(body.equals(await readFile('assets/source-images/justin-picard-hero.jpg')))
	await middleware({ url: '/images/%2e%2e%2fpackage.png' }, {}, () => { passed = true })
	assert.equal(passed, true)
	assert.equal(plugin.configurePreviewServer, undefined)
})

test('root public assets such as PDFs, social images and favicons must exist', () => {
	assert.throws(() => validateImageReferences("href: '/resume.pdf'", [], []), /Missing public asset: \/resume.pdf/)
	assert.doesNotThrow(() => validateImageReferences("href: '/resume.pdf'", [], [], ['resume.pdf']))
})
