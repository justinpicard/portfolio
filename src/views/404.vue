<template>
  <AppHeader />
	<PageTitle :key="locale"/>
  <div class="page-intro mt-3 type-body-small">
    <div class="container">
      <div class="row">
        <div class="col-10">
          {{ t('errors.notFoundMessage') }}<br>
          {{ t('errors.backToHomepageBefore') }}
          <router-link :to="homeRoute">{{ t('errors.homepage') }}</router-link>{{ t('errors.backToHomepageAfter') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import PageTitle from '../components/PageHeader.vue'
import AppHeader from '../components/AppHeader.vue'
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
