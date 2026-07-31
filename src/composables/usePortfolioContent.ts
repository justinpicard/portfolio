import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getContent, getProjectBySlug } from '../content'
import { resolveLocale } from '../i18n'

export function usePortfolioContent() {
	const { locale } = useI18n()
	const activeLocale = computed(() => resolveLocale(locale.value))
	const portfolio = computed(() => getContent(activeLocale.value))

	return {
		hero: computed(() => portfolio.value.home.hero),
		about: computed(() => portfolio.value.home.about),
		footer: computed(() => portfolio.value.home.footer),
		projects: computed(() => portfolio.value.projects),
		seo: computed(() => portfolio.value.seo),
		getProjectBySlug: (slug: string) => getProjectBySlug(activeLocale.value, slug)
	}
}
