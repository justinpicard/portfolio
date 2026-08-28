import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routerOptions } from './router'
import {
	createI18nInstance,
	resolveLocale,
	setActiveLocale
} from './i18n'
import { reportRuntimeError } from './composables/useRuntimeError'
import "./assets/styles/main.scss"

export const createApp = ViteSSG(
	App,
	routerOptions,
	({ app, router }) => {
		const i18n = createI18nInstance()

		app.use(i18n)
		app.config.errorHandler = (error, _instance, info) => {
			console.error('[Portfolio] Unexpected application error', { error, info })
			reportRuntimeError()
		}
		router.onError((error) => {
			console.error('[Portfolio] Unexpected router error', error)
			reportRuntimeError()
		})
		router.beforeEach((to) => {
			setActiveLocale(i18n, resolveLocale(to.params.locale))
		})
	},
	{
		// Development starts from an empty shell; production hydrates prerendered HTML.
		hydration: import.meta.env.PROD
	}
)
