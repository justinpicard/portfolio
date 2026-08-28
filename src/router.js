import {
	getLocaleParams,
	PREFIXED_LOCALES,
	resolveLocale
} from './i18n'
import { MULTILINGUAL_ENABLED } from './config/features'
import Index from './views/Index.vue'

const localePattern = PREFIXED_LOCALES.join('|')
const localePrefix = MULTILINGUAL_ENABLED ? `/:locale(${localePattern})?` : ''
const localizedPath = (path = '') => `${localePrefix}${path}`

const disabledLocaleRedirects = MULTILINGUAL_ENABLED
	? []
	: [
		{
			path: `/:locale(${localePattern})/:pathMatch(.*)*`,
			redirect: (to) => {
				const pathSegments = Array.isArray(to.params.pathMatch)
					? to.params.pathMatch
					: to.params.pathMatch
						? [to.params.pathMatch]
						: []

				return {
					path: `/${pathSegments.join('/')}`,
					query: to.query,
					hash: to.hash
				}
			}
		}
	]

export const routes = [
	...disabledLocaleRedirects,
	{
		path: localizedPath(),
		name: 'home',
		meta: {
			seoKey: 'home',
			indexable: true
		},
		component: Index
	},
	{
		path: localizedPath('/home'),
		redirect: (to) => ({
			name: 'home',
			params: getLocaleParams(resolveLocale(to.params.locale))
		})
	},
	{
		path: localizedPath('/resume'),
		name: "resume",
		meta: {
			titleKey: 'pages.resumeTitle',
			indexable: false
		},
		component: () => import('./views/Resume.vue')
	},
	{
		path: localizedPath('/:pathMatch(.*)*'),
		name: '404notfound',
		meta: {
			titleKey: 'errors.notFoundTitle',
			indexable: false
		},
		component: () => import('./views/404.vue')
	}
]

export const routerOptions = {
	base: import.meta.env.BASE_URL,
	routes,
	scrollBehavior(_to, from, savedPosition) {
		if (savedPosition) return savedPosition

		// Preserve native restoration after reloads and discarded-tab restores.
		if (!from.name) return false

		return { top: 0 }
	}
}
