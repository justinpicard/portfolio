import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routerOptions } from './router'
import {
	createI18nInstance,
	resolveLocale,
	setActiveLocale
} from './i18n'
import "./assets/styles/main.scss"

export const createApp = ViteSSG(
	App,
	routerOptions,
	({ app, router }) => {
		const i18n = createI18nInstance()

		app.use(i18n)
		router.beforeEach((to) => {
			setActiveLocale(i18n, resolveLocale(to.params.locale))
		})
	},
	{
		hydration: true
	}
)
