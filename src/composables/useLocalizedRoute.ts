import { computed } from 'vue'
import {
	useRoute,
	type RouteLocationRaw,
	type RouteParamsGeneric
} from 'vue-router'
import {
	DEFAULT_LOCALE,
	getLocaleParams,
	PREFIXED_LOCALES,
	resolveLocale,
	type Locale
} from '../i18n'
import { MULTILINGUAL_ENABLED } from '../config/features'

export function localizePath(path: string, locale: Locale) {
	const localePattern = PREFIXED_LOCALES.join('|')
	const localePrefixPattern = new RegExp(`^/(${localePattern})(?=/|$)`)
	const pathWithoutLocale = path.replace(localePrefixPattern, '') || '/'
	const localeParams = getLocaleParams(locale)

	return !MULTILINGUAL_ENABLED || locale === DEFAULT_LOCALE
		? pathWithoutLocale
		: pathWithoutLocale === '/'
			? `/${localeParams.locale}`
			: `/${localeParams.locale}${pathWithoutLocale}`
}

export function useLocalizedRoute() {
	const route = useRoute()
	const currentLocale = computed(() => resolveLocale(route.params.locale))

	function getLocalizedRoute(locale: Locale): RouteLocationRaw {
		if (!route.name) {
			return {
				path: localizePath(route.path, locale),
				query: { ...route.query },
				hash: route.hash
			}
		}

		const params: RouteParamsGeneric = { ...route.params }

		delete params.locale
		Object.assign(params, getLocaleParams(locale))

		return {
			name: route.name,
			params,
			query: { ...route.query },
			hash: route.hash
		}
	}

	return {
		currentLocale,
		getLocalizedRoute
	}
}
