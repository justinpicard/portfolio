import { createRouter, createWebHistory } from 'vue-router'
import {
	getLocaleParams,
	PREFIXED_LOCALES,
	resolveLocale,
	setActiveLocale
} from './i18n'
import Index from './views/Index.vue'

const localePattern = PREFIXED_LOCALES.join('|')
const localePrefix = `/:locale(${localePattern})?`
const localizedPath = (path = '') => `${localePrefix}${path}`

const routes = [
	{
		path: localizedPath(),
		name: 'home',
		meta: { title: 'Justin Picard ✦ Digital Product Designer' },
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
		meta: { titleKey: 'pages.resumeTitle' },
		component: () => import('./views/Resume.vue')
	},
	{
		path: localizedPath('/:pathMatch(.*)*'),
		name: '404notfound',
		meta: { titleKey: 'errors.notFoundTitle' },
		component: () => import('./views/404.vue')
	}
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
	scrollBehavior() {
		return { top: 0 }
	}
})

router.beforeEach((to) => {
	setActiveLocale(resolveLocale(to.params.locale))
})

export default router
