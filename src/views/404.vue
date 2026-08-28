<template>
	<AppHeader
		copy-visible
		status-number="404"
		:status-label="t('errors.notFoundHeading')"
	/>
	<ErrorState
		eyebrow="404"
		:title="t('errors.notFoundHeading')"
		:message="t('errors.notFoundMessage')"
	>
		<template #actions>
			<Button
				:label="t('errors.backToHomepage')"
				:to="homeRoute"
			/>
		</template>
	</ErrorState>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import AppHeader from '../components/AppHeader.vue'
import Button from '../components/Button.vue'
import ErrorState from '../components/ErrorState.vue'
import { getLocaleParams, resolveLocale } from '../i18n'

const { locale, t } = useI18n()
useHead(() => ({
	title: t('errors.notFoundTitle'),
	htmlAttrs: {
		lang: resolveLocale(locale.value)
	},
	meta: [
		{ name: 'robots', content: 'noindex,nofollow' }
	]
}))
const homeRoute = computed(() => ({
	name: 'home',
	params: getLocaleParams(resolveLocale(locale.value))
}))
</script>
