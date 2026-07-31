<template>
	foobar
</template>

<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { resolveLocale } from '../i18n'

const { locale, t } = useI18n()

useHead(() => ({
	title: t('pages.resumeTitle'),
	htmlAttrs: {
		lang: resolveLocale(locale.value)
	},
	meta: [
		{ name: 'robots', content: 'noindex,nofollow' }
	]
}))
</script>
