import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import {
	getAbsoluteUrl,
	indexableRoutePaths,
	prerenderRoutes,
	siteConfig
} from './src/config/site'

function createSitemap() {
	const urls = indexableRoutePaths.flatMap(routePaths => (
		siteConfig.supportedLocales.map(locale => {
			const path = routePaths[locale]
			const alternates = siteConfig.supportedLocales.map((targetLocale) => {
				return `    <xhtml:link rel="alternate" hreflang="${targetLocale}" href="${getAbsoluteUrl(routePaths[targetLocale])}" />`
			})

			alternates.push(
				`    <xhtml:link rel="alternate" hreflang="x-default" href="${getAbsoluteUrl(routePaths[siteConfig.defaultLocale])}" />`
			)

			return [
				'  <url>',
				`    <loc>${getAbsoluteUrl(path)}</loc>`,
				...alternates,
				'  </url>'
			].join('\n')
		})
	))

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
		'        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...urls,
		'</urlset>',
		''
	].join('\n')
}

function staticSeoFiles() {
	return {
		name: 'static-seo-files',
		apply: 'build',
		generateBundle() {
			this.emitFile({
				type: 'asset',
				fileName: 'sitemap.xml',
				source: createSitemap()
			})
			this.emitFile({
				type: 'asset',
				fileName: 'robots.txt',
				source: [
					'User-agent: *',
					'Allow: /',
					`Sitemap: ${getAbsoluteUrl('/sitemap.xml')}`,
					''
				].join('\n')
			})
		}
	}
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), staticSeoFiles()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern'
      }
    }
  },
  server: {
    host: true
  },
  ssgOptions: {
    entry: 'src/main.js',
    dirStyle: 'nested',
    includedRoutes: () => [...prerenderRoutes]
  }
})
