import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { getContent, type SeoContent } from '../content'
import {
	getAbsoluteUrl,
	siteConfig
} from '../config/site'
import {
	resolveLocale,
	type Locale
} from '../i18n'
import { localizePath } from './useLocalizedRoute'

export function usePageSeo(seoKey: keyof SeoContent) {
	const route = useRoute()
	const locale = computed(() => resolveLocale(route.params.locale))
	const seo = computed(() => getContent(locale.value).seo[seoKey])
	const localizedUrls = computed(() => Object.fromEntries(
		siteConfig.supportedLocales.map(targetLocale => [
			targetLocale,
			getAbsoluteUrl(localizePath(route.path, targetLocale))
		])
	) as Partial<Record<Locale, string>>)
	const canonicalUrl = computed(() => (
		localizedUrls.value[locale.value]
		?? localizedUrls.value[siteConfig.defaultLocale]
		?? getAbsoluteUrl('/')
	))
	const alternateLocale = computed(() => (
		siteConfig.supportedLocales.find(candidate => candidate !== locale.value)
	))
	const socialImageUrl = computed(() => (
		getAbsoluteUrl(siteConfig.defaultSocialImage.path)
	))

	useHead(() => ({
		title: seo.value.title,
		htmlAttrs: {
			lang: locale.value
		},
		link: [
			{
				rel: 'canonical',
				href: canonicalUrl.value
			},
			...siteConfig.supportedLocales.map(targetLocale => ({
				rel: 'alternate',
				hreflang: targetLocale,
				href: localizedUrls.value[targetLocale] ?? canonicalUrl.value
			})),
			{
				rel: 'alternate',
				hreflang: 'x-default',
				href: localizedUrls.value[siteConfig.defaultLocale] ?? canonicalUrl.value
			}
		],
		meta: [
			{ name: 'description', content: seo.value.description },
			{ name: 'author', content: siteConfig.name },
			{ name: 'robots', content: 'index,follow' },
			{ property: 'og:type', content: 'website' },
			{ property: 'og:site_name', content: siteConfig.name },
			{ property: 'og:title', content: seo.value.ogTitle ?? seo.value.title },
			{ property: 'og:description', content: seo.value.ogDescription ?? seo.value.description },
			{ property: 'og:url', content: canonicalUrl.value },
			{ property: 'og:locale', content: siteConfig.openGraphLocales[locale.value] },
			...(alternateLocale.value ? [{
				property: 'og:locale:alternate',
				content: siteConfig.openGraphLocales[alternateLocale.value]
			}] : []),
			{ name: 'twitter:card', content: 'summary_large_image' },
			{ name: 'twitter:title', content: seo.value.ogTitle ?? seo.value.title },
			{ name: 'twitter:description', content: seo.value.ogDescription ?? seo.value.description },
			{ property: 'og:image', content: socialImageUrl.value },
			{ property: 'og:image:width', content: String(siteConfig.defaultSocialImage.width) },
			{ property: 'og:image:height', content: String(siteConfig.defaultSocialImage.height) },
			{ property: 'og:image:alt', content: siteConfig.defaultSocialImage.alt },
			{ name: 'twitter:image', content: socialImageUrl.value },
			{ name: 'twitter:image:alt', content: siteConfig.defaultSocialImage.alt }
		],
		script: [
			{
				type: 'application/ld+json',
				innerHTML: JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'Person',
					name: siteConfig.name,
					jobTitle: 'Digital Product Designer',
					url: siteConfig.baseUrl,
					description: seo.value.description,
					homeLocation: {
						'@type': 'City',
						name: 'Middelburg'
					},
					sameAs: siteConfig.profiles
				})
			}
		]
	}))
}
