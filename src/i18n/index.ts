import { createI18n } from 'vue-i18n'
import en from './locales/en'
import nl from './locales/nl'

export const DEFAULT_LOCALE = 'en'
export const SUPPORTED_LOCALES = ['en', 'nl'] as const
export const PREFIXED_LOCALES = SUPPORTED_LOCALES.filter(
	(locale) => locale !== DEFAULT_LOCALE
)

export type Locale = typeof SUPPORTED_LOCALES[number]

export function resolveLocale(value: unknown): Locale {
	const candidate = Array.isArray(value) ? value[0] : value

	return SUPPORTED_LOCALES.includes(candidate as Locale)
		? candidate as Locale
		: DEFAULT_LOCALE
}

export function getLocaleParams(locale: Locale) {
	return locale === DEFAULT_LOCALE ? {} : { locale }
}

export const i18n = createI18n({
	legacy: false,
	locale: DEFAULT_LOCALE,
	fallbackLocale: DEFAULT_LOCALE,
	messages: {
		en,
		nl
	}
})

export function setActiveLocale(locale: Locale) {
	i18n.global.locale.value = locale
	document.documentElement.lang = locale
}

export default i18n
