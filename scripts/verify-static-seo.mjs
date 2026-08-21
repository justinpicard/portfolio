import { readFile } from 'node:fs/promises'
import { MULTILINGUAL_ENABLED } from '../src/config/features.js'

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

for (const page of pages) {
	const html = await readFile(page.file, 'utf8')

	assert(html.includes(`<html lang="${page.lang}"`), `${page.file}: incorrect html lang`)
	assert(html.includes(`<title>${page.title}</title>`), `${page.file}: incorrect title`)
	assert(
		html.includes(`<meta name="description" content="${page.description}">`),
		`${page.file}: incorrect description`
	)
	assert(
		html.includes(`<link rel="canonical" href="${page.canonical}">`),
		`${page.file}: incorrect canonical`
	)
	assert(
		html.includes(`<meta property="og:url" content="${page.canonical}">`),
		`${page.file}: incorrect og:url`
	)
	assert(
		html.includes(`<meta property="og:locale" content="${page.ogLocale}">`),
		`${page.file}: incorrect Open Graph locale`
	)
	assert(html.includes('hreflang="en"'), `${page.file}: missing English alternate`)
	assert(
		MULTILINGUAL_ENABLED === html.includes('hreflang="nl"'),
		`${page.file}: Dutch alternate availability is incorrect`
	)
	assert(html.includes('hreflang="x-default"'), `${page.file}: missing x-default alternate`)
	assert(html.includes('name="twitter:card"'), `${page.file}: missing Twitter card`)
	assert(html.includes('type="application/ld+json"'), `${page.file}: missing JSON-LD`)
	assert(html.includes('<h1'), `${page.file}: missing rendered page content`)
	assert(count(html, '<title>') === 1, `${page.file}: duplicate title`)
	assert(count(html, 'name="description"') === 1, `${page.file}: duplicate description`)
	assert(count(html, 'rel="canonical"') === 1, `${page.file}: duplicate canonical`)
	assert(!/localhost|justinpicard\.com|moeamaya|href="[^"]*\/en(?:\/|")/.test(html), `${page.file}: forbidden URL found`)
}

const sitemap = await readFile('dist/sitemap.xml', 'utf8')
const robots = await readFile('dist/robots.txt', 'utf8')

assert(sitemap.includes('<loc>https://justinpicard.nl/</loc>'), 'sitemap: missing English route')
assert(
	MULTILINGUAL_ENABLED === sitemap.includes('<loc>https://justinpicard.nl/nl</loc>'),
	'sitemap: Dutch route availability is incorrect'
)
assert(!sitemap.includes('/en'), 'sitemap: unexpected English prefix')
assert(robots.includes('Allow: /'), 'robots.txt: crawling is not allowed')
assert(
	robots.includes('Sitemap: https://justinpicard.nl/sitemap.xml'),
	'robots.txt: sitemap reference is missing'
)

console.log(`Static SEO verification passed for ${MULTILINGUAL_ENABLED ? '/ and /nl' : '/'}.`)
