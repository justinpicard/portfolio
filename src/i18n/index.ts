import {
	createI18n,
	type I18n
} from 'vue-i18n'
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

export function createI18nInstance(locale: Locale = DEFAULT_LOCALE) {
	return createI18n({
		legacy: false,
		locale,
		fallbackLocale: DEFAULT_LOCALE,
		messages: {
			en,
			nl
		}
	})
}

export function setActiveLocale(
	i18n: I18n<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, string, false>,
	locale: Locale
) {
	i18n.global.locale.value = locale

	if (typeof document !== 'undefined') {
		document.documentElement.lang = locale
	}
}
