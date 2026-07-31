import {
	getLocaleParams,
	PREFIXED_LOCALES,
	resolveLocale
} from './i18n'
import Index from './views/Index.vue'

const localePattern = PREFIXED_LOCALES.join('|')
const localePrefix = `/:locale(${localePattern})?`
const localizedPath = (path = '') => `${localePrefix}${path}`

export const routes = [
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
	scrollBehavior() {
		return { top: 0 }
	}
}
