<template>
	<footer class="site-footer section pb-16">
		<div class="container site-footer__container">
			<div class="site-footer__grid d-grid grid-cols-1 md:grid-cols-3">
				<p class="site-footer__eyebrow eyebrow text-secondary mb-8">{{ t('footer.eyebrow') }}</p>

				<div
					ref="footerMarquee"
					class="site-footer__marquee col-span-1 md:col-span-3"
				>
					<div class="site-footer__marquee-track">
						<div
							v-for="sequence in 2"
							:key="sequence"
							class="site-footer__marquee-sequence"
							:aria-hidden="sequence === 2 ? 'true' : undefined"
						>
							<div
								v-for="item in 3"
								:key="item"
								class="site-footer__marquee-group"
								:aria-hidden="sequence === 1 && item === 1 ? undefined : 'true'"
							>
								<h2
									v-if="sequence === 1 && item === 1"
									class="site-footer__title huge-title"
								>
									{{ t('footer.title') }}
								</h2>
								<span v-else class="site-footer__title huge-title">
									{{ t('footer.title') }}
								</span>
								<span class="wave" aria-hidden="true">👋🏼</span>
							</div>
						</div>
					</div>
				</div>

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
import {
	gsap,
	prefersReducedMotion,
	registerGsapPlugins,
	ScrollTrigger
} from '../utils/animations/gsap'
import { animationEases } from '../utils/animations/presets'
import { initStaggerLinks, type StaggerLinksController } from '../utils/animations/staggerLinks'
import Button from './Button.vue'

const { locale, t } = useI18n()
const { footer } = usePortfolioContent()
const { currentLocale } = useLocalizedRoute()
const linkList = ref<HTMLUListElement | null>(null)
const footerMarquee = ref<HTMLElement | null>(null)
let staggerLinks: StaggerLinksController | undefined
let marqueeContext: gsap.Context | undefined

async function setupStaggerLinks() {
	await nextTick()
	staggerLinks?.destroy()

	if (!linkList.value) return

	staggerLinks = initStaggerLinks(linkList.value)
}

async function setupFooterMarquee() {
	await nextTick()
	marqueeContext?.revert()

	if (!footerMarquee.value || prefersReducedMotion()) return

	registerGsapPlugins()

	marqueeContext = gsap.context(() => {
		const track = footerMarquee.value?.querySelector<HTMLElement>(
			'.site-footer__marquee-track'
		)

		if (!track) return

		const loop = gsap.to(track, {
			xPercent: -50,
			duration: 15,
			ease: animationEases.none,
			repeat: -1
		})

		ScrollTrigger.create({
			onUpdate(self) {
				gsap.to(loop, {
					timeScale: self.direction > 0 ? 1 : -1,
					duration: 0.18,
					ease: animationEases.inOut,
					overwrite: true
				})
			}
		})
	}, footerMarquee.value)
}

onMounted(() => {
	setupStaggerLinks()
	setupFooterMarquee()
})

watch(locale, () => {
	setupStaggerLinks()
	setupFooterMarquee()
}, { flush: 'post' })

onUnmounted(() => {
	staggerLinks?.destroy()
	marqueeContext?.revert()
})
</script>
