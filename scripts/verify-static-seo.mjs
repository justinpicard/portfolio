import { access, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { MULTILINGUAL_ENABLED } from '../src/config/features.js'

const DIST_DIRECTORY = 'dist'
const PRODUCTION_ORIGIN = 'https://justinpicard.nl'
const SOCIAL_IMAGE_WIDTH = 1200
const SOCIAL_IMAGE_HEIGHT = 630

const englishPage = {
	file: 'dist/index.html',
	lang: 'en',
	title: 'Justin Picard ✦ Digital Product Designer',
	description: 'Digital Product Designer based in Middelburg, focused on product design, design systems and code.',
	canonical: 'https://justinpicard.nl/',
	ogLocale: 'en_US'
}
const dutchPage = {
	file: 'dist/nl/index.html',
	lang: 'nl',
	title: 'Justin Picard ✦ Digital Product Designer',
	description: 'Digital Product Designer uit Middelburg, met focus op productdesign, design systems en code.',
	canonical: 'https://justinpicard.nl/nl',
	ogLocale: 'nl_NL'
}
const pages = MULTILINGUAL_ENABLED
	? [englishPage, dutchPage]
	: [englishPage]

function assert(condition, message) {
	if (!condition) {
		throw new Error(message)
	}
}

function count(html, value) {
	return html.split(value).length - 1
}

function parseAttributes(tag) {
	const attributes = {}
	const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

	for (const match of tag.matchAll(attributePattern)) {
		const [, name, doubleQuotedValue, singleQuotedValue, unquotedValue] = match
		attributes[name.toLowerCase()] = doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? ''
	}

	return attributes
}

function getTags(html, tagName) {
	return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))]
		.map(match => parseAttributes(match[0]))
}

function getRequiredMetaContent(html, file, attribute, key) {
	const matches = getTags(html, 'meta')
		.filter(attributes => attributes[attribute] === key)

	assert(matches.length === 1, `${file}: expected exactly one ${key} meta tag`)

	const content = matches[0].content?.trim()
	assert(content, `${file}: ${key} meta content must not be empty`)

	return content
}

function getRequiredLink(html, file, rel) {
	const matches = getTags(html, 'link')
		.filter(attributes => attributes.rel?.split(/\s+/).includes(rel))

	assert(matches.length === 1, `${file}: expected exactly one ${rel} link`)

	const href = matches[0].href?.trim()
	assert(href, `${file}: ${rel} link must have a non-empty href`)

	return href
}

function getLocalDistPath(reference, documentUrl) {
	if (!reference || /^(?:data|blob):/i.test(reference)) return undefined

	const url = new URL(reference, documentUrl)
	if (url.origin !== PRODUCTION_ORIGIN) return undefined

	return join(DIST_DIRECTORY, decodeURIComponent(url.pathname).replace(/^\/+/, ''))
}

async function assertLocalAssetExists(reference, documentUrl, context) {
	const file = getLocalDistPath(reference, documentUrl)
	if (!file) return undefined

	try {
		await access(file)
	} catch {
		assert(false, `${context}: missing local asset ${reference}`)
	}

	return file
}

function getSrcsetReferences(srcset) {
	return srcset
		.split(',')
		.map(candidate => candidate.trim().split(/\s+/)[0])
		.filter(Boolean)
}

async function verifyLocalImageReferences(html, page) {
	const imageTags = getTags(html, 'img')
	const sourceTags = getTags(html, 'source')
	const references = [
		...imageTags.flatMap(attributes => [
			attributes.src,
			...getSrcsetReferences(attributes.srcset ?? '')
		]),
		...sourceTags.flatMap(attributes => [
			attributes.src,
			...getSrcsetReferences(attributes.srcset ?? '')
		])
	].filter(Boolean)

	for (const reference of new Set(references)) {
		await assertLocalAssetExists(reference, page.canonical, page.file)
	}

	for (const attributes of imageTags) {
		const alt = attributes.alt?.trim()
		assert(
			alt === undefined || alt === '' || !/^(?:\.{3}|…|todo|placeholder)$/i.test(alt),
			`${page.file}: placeholder alt text found: ${JSON.stringify(alt)}`
		)
	}
}

function verifyJsonLd(html, file) {
	const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
		.filter(match => parseAttributes(match[1]).type === 'application/ld+json')

	assert(blocks.length > 0, `${file}: missing JSON-LD`)

	for (const [, , source] of blocks) {
		try {
			JSON.parse(source)
		} catch (error) {
			const reason = error instanceof Error ? error.message : String(error)
			assert(false, `${file}: invalid JSON-LD (${reason})`)
		}
	}
}

async function verifySocialImage(reference, page) {
	const file = await assertLocalAssetExists(reference, page.canonical, `${page.file}: social image`)
	assert(file, `${page.file}: social image must use the production domain`)
	assert(extname(file).toLowerCase() === '.png', `${page.file}: expected a PNG social image`)

	const image = await readFile(file)
	const isPng = image.length >= 24
		&& image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
	assert(isPng, `${page.file}: social image is not a valid PNG`)

	const width = image.readUInt32BE(16)
	const height = image.readUInt32BE(20)
	assert(
		width === SOCIAL_IMAGE_WIDTH && height === SOCIAL_IMAGE_HEIGHT,
		`${page.file}: social image must be ${SOCIAL_IMAGE_WIDTH}x${SOCIAL_IMAGE_HEIGHT}, received ${width}x${height}`
	)
}

for (const page of pages) {
	const html = await readFile(page.file, 'utf8')
	const canonical = getRequiredLink(html, page.file, 'canonical')

	assert(html.includes(`<html lang="${page.lang}"`), `${page.file}: incorrect html lang`)
	assert(html.includes(`<title>${page.title}</title>`), `${page.file}: incorrect title`)
	assert(getRequiredMetaContent(html, page.file, 'name', 'description') === page.description, `${page.file}: incorrect description`)
	assert(canonical === page.canonical, `${page.file}: incorrect canonical`)
	assert(html.includes('hreflang="en"'), `${page.file}: missing English alternate`)
	assert(
		MULTILINGUAL_ENABLED === html.includes('hreflang="nl"'),
		`${page.file}: Dutch alternate availability is incorrect`
	)
	assert(html.includes('hreflang="x-default"'), `${page.file}: missing x-default alternate`)

	const expectedOpenGraph = {
		'og:type': 'website',
		'og:site_name': 'Justin Picard',
		'og:title': page.title,
		'og:description': page.description,
		'og:url': page.canonical,
		'og:locale': page.ogLocale,
		'og:image:width': String(SOCIAL_IMAGE_WIDTH),
		'og:image:height': String(SOCIAL_IMAGE_HEIGHT)
	}
	for (const [property, expectedValue] of Object.entries(expectedOpenGraph)) {
		assert(
			getRequiredMetaContent(html, page.file, 'property', property) === expectedValue,
			`${page.file}: incorrect ${property}`
		)
	}

	const openGraphImage = getRequiredMetaContent(html, page.file, 'property', 'og:image')
	getRequiredMetaContent(html, page.file, 'property', 'og:image:alt')

	const expectedTwitter = {
		'twitter:card': 'summary_large_image',
		'twitter:title': page.title,
		'twitter:description': page.description
	}
	for (const [name, expectedValue] of Object.entries(expectedTwitter)) {
		assert(
			getRequiredMetaContent(html, page.file, 'name', name) === expectedValue,
			`${page.file}: incorrect ${name}`
		)
	}

	const twitterImage = getRequiredMetaContent(html, page.file, 'name', 'twitter:image')
	getRequiredMetaContent(html, page.file, 'name', 'twitter:image:alt')
	assert(twitterImage === openGraphImage, `${page.file}: Open Graph and Twitter images must match`)

	assert((html.match(/<h1\b/gi) ?? []).length === 1, `${page.file}: homepage must contain exactly one h1`)
	assert(count(html, '<title>') === 1, `${page.file}: duplicate title`)
	assert(!/localhost|127\.0\.0\.1|staging|justinpicard\.com|moeamaya|href="[^"]*\/en(?:\/|")/i.test(html), `${page.file}: forbidden URL found`)

	verifyJsonLd(html, page.file)
	await verifySocialImage(openGraphImage, page)
	await verifyLocalImageReferences(html, page)

	const faviconLinks = getTags(html, 'link')
		.filter(attributes => attributes.rel?.split(/\s+/).includes('icon'))
	assert(faviconLinks.length > 0, `${page.file}: missing favicon link`)
	for (const favicon of faviconLinks) {
		assert(favicon.href?.trim(), `${page.file}: favicon link must have a non-empty href`)
		const faviconFile = await assertLocalAssetExists(favicon.href, page.canonical, `${page.file}: favicon`)
		assert(faviconFile, `${page.file}: favicon must be a local production asset`)
	}
}

const sitemap = await readFile('dist/sitemap.xml', 'utf8')
const robots = await readFile('dist/robots.txt', 'utf8')
const notFoundPage = await readFile('dist/404.html', 'utf8')
const htaccess = await readFile('dist/.htaccess', 'utf8')

const sitemapUrls = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
	.map(match => match[1])
const expectedSitemapUrls = pages.map(page => page.canonical)
const forbiddenSitemapPaths = new Set(['/home', '/404', '/resume'])
if (!MULTILINGUAL_ENABLED) forbiddenSitemapPaths.add('/nl')

assert(new Set(sitemapUrls).size === sitemapUrls.length, 'sitemap: duplicate URLs found')
for (const sitemapUrl of sitemapUrls) {
	const url = new URL(sitemapUrl)
	const path = url.pathname.replace(/\/$/, '') || '/'
	assert(url.origin === PRODUCTION_ORIGIN, `sitemap: unexpected domain in ${sitemapUrl}`)
	assert(!forbiddenSitemapPaths.has(path), `sitemap: non-canonical route found: ${path}`)
}
assert(
	JSON.stringify([...sitemapUrls].sort()) === JSON.stringify([...expectedSitemapUrls].sort()),
	`sitemap: URLs must exactly match ${expectedSitemapUrls.join(', ')}`
)
assert(
	notFoundPage.includes('<meta name="robots" content="noindex,nofollow">'),
	'dist/404.html: missing noindex directive'
)
assert(notFoundPage.includes('<h1'), 'dist/404.html: missing rendered error content')
assert(
	htaccess.includes('ErrorDocument 404 /404.html'),
	'dist/.htaccess: missing custom 404 mapping'
)
assert(
	htaccess.includes('RewriteRule ^home/?$ / [R=301,L]'),
	'dist/.htaccess: /home must permanently redirect to /'
)
assert(
	htaccess.includes('RewriteRule ^nl/?$ / [R=301,L]') === !MULTILINGUAL_ENABLED,
	'dist/.htaccess: disabled-locale root redirect is incorrect'
)
assert(
	htaccess.includes('RewriteRule ^nl/(.*)$ /$1 [R=301,L]') === !MULTILINGUAL_ENABLED,
	'dist/.htaccess: disabled-locale nested redirect is incorrect'
)
assert(!/R=302\b/i.test(htaccess), 'dist/.htaccess: unexpected temporary redirect found')
assert(robots.includes('Allow: /'), 'robots.txt: crawling is not allowed')
assert(
	robots.includes('Sitemap: https://justinpicard.nl/sitemap.xml'),
	'robots.txt: sitemap reference is missing'
)

await verifyLocalImageReferences(notFoundPage, {
	file: 'dist/404.html',
	canonical: `${PRODUCTION_ORIGIN}/404`
})

console.log(`Static SEO verification passed for ${MULTILINGUAL_ENABLED ? '/ and /nl' : '/'}.`)
