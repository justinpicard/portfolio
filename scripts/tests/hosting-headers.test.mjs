import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { inlineScriptHashes, hostingHeaders } from '../hosting-headers.mjs'

test('CSP hashes preserve exact prerendered inline script bytes and omit external scripts', () => {
	const script = '\n  history.scrollRestoration = "manual"\n'
	const json = '{"@type":"Person"}'
	const hashes = inlineScriptHashes(`<script>${script}</script><script src="/app.js"></script><script type="application/ld+json">${json}</script>`)
	assert.deepEqual(hashes, [script, json].map(value => `'sha256-${createHash('sha256').update(value).digest('base64')}'`))
	const headers = hostingHeaders(hashes)
	for (const hash of hashes) assert(headers.includes(hash))
	assert(!headers.includes("script-src 'self' 'unsafe-inline'"))
	assert(!headers.includes("'unsafe-eval'"))
})

test('immutable caching is restricted to generated image and Vite asset paths', () => {
	const headers = hostingHeaders([])
	const pattern = headers.match(/SetEnvIf Request_URI "([^"]+)"/)[1]
	const immutable = new RegExp(pattern)
	for (const path of ['/assets/app-1234abCD.js', '/assets/app-1234abCD.css', '/assets/Font-1234abCD.woff2', '/generated/images/1234567890abcdef.webp', '/generated/images/1234567890abcdef.png']) assert(immutable.test(path), path)
	for (const path of ['/', '/index.html', '/favicon.png', '/justin-picard-portfolio.png', '/app-1234abCD.js', '/assets/app.js', '/images/1234567890abcdef.webp']) assert(!immutable.test(path), path)
	assert(headers.includes('max-age=0, must-revalidate'))
	assert(headers.includes('Cache-Control "no-cache"'))
})
