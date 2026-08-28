<template>
	<main
		class="main"
		:class="{
			'scrolled': hasScrolled,
			'scrolled-after': hasScrolledAfter,
			'page-bottom': isAtPageBottom
		}"
	>
		<AppHeader
			v-if="hasRuntimeError"
			copy-visible
			status-number="500"
			:status-label="t('errors.unexpectedTitle')"
		/>
		<ErrorState
			v-if="hasRuntimeError"
			:eyebrow="t('errors.unexpectedEyebrow')"
			:title="t('errors.unexpectedTitle')"
			:message="t('errors.unexpectedMessage')"
		>
			<template #actions>
				<Button
					:label="t('errors.retry')"
					variant="filled"
					color="light"
					@click="retry"
				/>
				<Button
					:label="t('errors.backToHomepage')"
					variant="ghost"
					color="light"
					@click="returnHome"
				/>
			</template>
		</ErrorState>
		<router-view v-else />
	</main>
</template>
<script setup>
import { onErrorCaptured, onMounted, onUnmounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import Button from './components/Button.vue'
import ErrorState from './components/ErrorState.vue'
import { getLocaleParams, resolveLocale } from './i18n'
import {
	clearRuntimeError,
	reportRuntimeError,
	useRuntimeError
} from './composables/useRuntimeError'

const SCROLL_THRESHOLD = 10
const AFTER_SCROLL_THRESHOLD = 200

const hasScrolled = ref(false)
const hasScrolledAfter = ref(false)
const isAtPageBottom = ref(false)
const { locale, t } = useI18n()
const router = useRouter()
const { hasRuntimeError } = useRuntimeError()
let maximumScrollY = 0
let documentResizeObserver

useHead(() => hasRuntimeError.value ? {
	title: t('errors.unexpectedTitle'),
	meta: [
		{ name: 'robots', content: 'noindex,nofollow' }
	]
} : {})

onErrorCaptured((error, _instance, info) => {
	console.error('[Portfolio] Unexpected component error', { error, info })
	reportRuntimeError()
	return false
})

function retry() {
	window.location.reload()
}

async function returnHome() {
	clearRuntimeError()
	await router.push({
		name: 'home',
		params: getLocaleParams(resolveLocale(locale.value))
	})
}

function handleScroll() {
	hasScrolled.value = window.scrollY > SCROLL_THRESHOLD
	hasScrolledAfter.value = window.scrollY > AFTER_SCROLL_THRESHOLD
	isAtPageBottom.value = window.scrollY >= maximumScrollY - 2
}

function updateScrollBounds() {
	maximumScrollY = document.documentElement.scrollHeight - window.innerHeight
	handleScroll()
}

onMounted(() => {
	updateScrollBounds()
	documentResizeObserver = new ResizeObserver(updateScrollBounds)
	documentResizeObserver.observe(document.body)
	window.addEventListener('scroll', handleScroll, { passive: true })
	window.addEventListener('resize', updateScrollBounds)
})

onUnmounted(() => {
	documentResizeObserver?.disconnect()
	window.removeEventListener('scroll', handleScroll)
	window.removeEventListener('resize', updateScrollBounds)
})
</script>
