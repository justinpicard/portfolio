import {
	DEFAULT_LOCALE,
	SUPPORTED_LOCALES,
	type Locale
} from '../i18n'

export const siteConfig = {
	name: 'Justin Picard',
	baseUrl: 'https://justinpicard.nl',
	defaultLocale: DEFAULT_LOCALE,
	supportedLocales: SUPPORTED_LOCALES,
	defaultSocialImage: {
		path: '/justin-picard-portfolio.png',
		width: 1200,
		height: 630,
		alt: 'Justin Picard — Digital Product Designer'
	},
	profiles: [
		'https://www.linkedin.com/in/picardjustin/',
		'https://unsplash.com/@justinpicard'
	],
	openGraphLocales: {
		en: 'en_US',
		nl: 'nl_NL'
	} satisfies Record<Locale, string>
} as const

export const indexableRoutePaths = [
	{
		en: '/',
		nl: '/nl'
	}
] as const satisfies ReadonlyArray<Record<Locale, string>>

export const prerenderRoutes = indexableRoutePaths.flatMap(routePaths => (
	siteConfig.supportedLocales.map(locale => routePaths[locale])
))

export function normalizePath(path: string) {
	if (path === '/') return path

	return path.replace(/\/+$/, '')
}

export function getAbsoluteUrl(path: string) {
	return new URL(normalizePath(path), `${siteConfig.baseUrl}/`).href
}
