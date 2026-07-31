<template>
	<footer class="site-footer section pb-16">
		<div class="container site-footer__container">
			<div class="site-footer__grid d-grid grid-cols-1 md:grid-cols-3">
				<p class="site-footer__eyebrow eyebrow mb-8">{{ t('footer.eyebrow') }}</p>
				<h2 class="site-footer__title huge-title col-span-1 md:col-span-3">{{ t('footer.title') }}</h2>

				<div class="site-footer__intro col-span-1 md:col-span-2">
					<p class="site-footer__copy">
						{{ footer.introduction }}
					</p>
					<Button :label="t('footer.emailButton')" href="mailto:hallo@justinpicard.nl" />
				</div>

				<div class="site-footer__links col-span-1 md:col-span-1">
					<nav :aria-label="t('footer.socialNavigationLabel')">
						<ul
							:key="locale"
							ref="linkList"
							class="site-footer__link-list d-flex flex-column"
						>
							<!--<li><a href="mailto:hallo@justinpicard.nl">hallo@justinpicard.nl</a></li>-->
							<li>
								<a
									href="https://www.linkedin.com/in/picardjustin/"
									target="_blank"
									rel="noopener"
									data-stagger-link
									class="d-flex items-center"
								>
									<span data-stagger-link-container>LinkedIn</span><span class="ml-1 mt-1">↗</span>
								</a>
							</li>
							<li>
								<a
									href="https://unsplash.com/@justinpicard"
									target="_blank"
									rel="noopener"
									data-stagger-link
									class="d-flex items-center"
								>
									<span data-stagger-link-container>Unsplash</span><span class="ml-1 mt-1">↗</span>
								</a>
							</li>
							<li>
								<router-link
									:to="{ name: 'resume', params: getLocaleParams(currentLocale) }"
									data-stagger-link
									class="d-flex items-center"
								>
									<span data-stagger-link-container>{{ t('footer.resume') }}</span><span class="ml-1 mt-1">↓</span>
								</router-link>
							</li>
						</ul>
					</nav>
					<p class="site-footer__copyright">&copy; {{ new Date().getFullYear() }} Justin Picard</p>
				</div>
			</div>
		</div>
	</footer>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePortfolioContent } from '../composables/usePortfolioContent'
import { useLocalizedRoute } from '../composables/useLocalizedRoute'
import { getLocaleParams } from '../i18n'
import { initStaggerLinks, type StaggerLinksController } from '../utils/animations/staggerLinks'
import Button from './Button.vue'

const { locale, t } = useI18n()
const { footer } = usePortfolioContent()
const { currentLocale } = useLocalizedRoute()
const linkList = ref<HTMLUListElement | null>(null)
let staggerLinks: StaggerLinksController | undefined

async function setupStaggerLinks() {
	await nextTick()
	staggerLinks?.destroy()

	if (!linkList.value) return

	staggerLinks = initStaggerLinks(linkList.value)
}

onMounted(() => {
	setupStaggerLinks()
})

watch(locale, setupStaggerLinks, { flush: 'post' })

onUnmounted(() => {
	staggerLinks?.destroy()
})
</script>
