<template>
	<section class="cv-overlay">
		<h2
			id="cv-overlay-title"
			class="cv-overlay__title"
		>
			{{ t('cv.title') }}
		</h2>
		<p class="cv-overlay__text">
			{{ t('cv.placeholder') }}
		</p>
	</section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
