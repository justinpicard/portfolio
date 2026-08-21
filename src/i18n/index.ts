import {
	createI18n,
	type I18n
} from 'vue-i18n'
import en from './locales/en'
import nl from './locales/nl'
import { MULTILINGUAL_ENABLED } from '../config/features'

export const DEFAULT_LOCALE = 'en'
export const SUPPORTED_LOCALES = ['en', 'nl'] as const
export type Locale = typeof SUPPORTED_LOCALES[number]
export const PUBLIC_LOCALES: readonly Locale[] = MULTILINGUAL_ENABLED
	? SUPPORTED_LOCALES
	: [DEFAULT_LOCALE]
export const PREFIXED_LOCALES = SUPPORTED_LOCALES.filter(
	(locale) => locale !== DEFAULT_LOCALE
)

export function resolveLocale(value: unknown): Locale {
	if (!MULTILINGUAL_ENABLED) return DEFAULT_LOCALE

	const candidate = Array.isArray(value) ? value[0] : value

	return SUPPORTED_LOCALES.includes(candidate as Locale)
		? candidate as Locale
		: DEFAULT_LOCALE
}

export function getLocaleParams(locale: Locale) {
	return !MULTILINGUAL_ENABLED || locale === DEFAULT_LOCALE ? {} : { locale }
}

export function createI18nInstance(locale: Locale = DEFAULT_LOCALE) {
	return createI18n({
		legacy: false,
		locale: resolveLocale(locale),
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
	const activeLocale = resolveLocale(locale)

	i18n.global.locale.value = activeLocale

	if (typeof document !== 'undefined') {
		document.documentElement.lang = activeLocale
	}
}
