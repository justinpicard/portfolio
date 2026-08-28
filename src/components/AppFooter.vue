<template>
	<footer id="say-hi" ref="footerRoot" class="section-layout section-layout--editorial site-footer">
		<div class="container site-footer__container">
			<div class="site-footer__grid d-grid grid-cols-1 md:grid-cols-3">
				<div
					ref="footerDivider"
					class="site-footer__divider divider col-span-1 md:col-span-3"
					aria-hidden="true"
				/>
				<!--<p class="site-footer__eyebrow eyebrow text-secondary mb-8">{{ t('footer.eyebrow') }}</p>-->

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
								<a
									:href="RESUME_PDF_HREF || undefined"
									:aria-disabled="RESUME_PDF_HREF ? undefined : 'true'"
									data-stagger-link
									class="d-flex items-center"
								>
									<span data-stagger-link-container>{{ t('footer.resume') }}</span><span class="ml-1 mt-1">↓</span>
								</a>
							</li>
						</ul>
					</nav>
					<div class="site-footer__credits">
						<p class="site-footer__copyright">Hero portrait by
							<a
								href="https://percys.nl"
								target="_blank"
								rel="noopener noreferrer"
							>
								Percy's
							</a>
						</p>
						<p class="site-footer__copyright">
							&copy; {{ new Date().getFullYear() }} Justin Picard
						</p>
					</div>
				</div>
			</div>
		</div>
	</footer>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePortfolioContent } from '../composables/usePortfolioContent'
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
// Set this to the public PDF path once the standalone resume is available.
const RESUME_PDF_HREF = ''
const linkList = ref<HTMLUListElement | null>(null)
const footerRoot = ref<HTMLElement | null>(null)
const footerDivider = ref<HTMLElement | null>(null)
const footerMarquee = ref<HTMLElement | null>(null)
let staggerLinks: StaggerLinksController | undefined
let footerAnimationContext: gsap.Context | undefined

// Starting at 70% viewport height means roughly 30% of the footer is in view.
const FOOTER_DIVIDER_REVEAL_START = 'top 70%'

async function setupStaggerLinks() {
	await nextTick()
	staggerLinks?.destroy()

	if (!linkList.value) return

	staggerLinks = initStaggerLinks(linkList.value)
}

async function setupFooterAnimations() {
	await nextTick()
	footerAnimationContext?.revert()

	if (
		!footerRoot.value
		|| !footerDivider.value
		|| !footerMarquee.value
		|| prefersReducedMotion()
	) return

	registerGsapPlugins()

	footerAnimationContext = gsap.context(() => {
		const track = footerMarquee.value?.querySelector<HTMLElement>(
			'.site-footer__marquee-track'
		)

		if (!track) return

		gsap.fromTo(footerDivider.value, {
			width: '0%'
		}, {
			width: '100%',
			duration: 0.9,
			ease: animationEases.strongInOut,
			scrollTrigger: {
				trigger: footerRoot.value,
				start: FOOTER_DIVIDER_REVEAL_START,
				toggleActions: 'play none none none'
			}
		})

		const loop = gsap.to(track, {
			xPercent: -50,
			duration: 15,
			ease: animationEases.none,
			repeat: -1
		})
		let marqueeDirection = 1

		ScrollTrigger.create({
			start: 0,
			end: 'max',
			// Refresh after pinned sections so the global direction range stays accurate.
			refreshPriority: -1,
			onUpdate(self) {
				const nextDirection = self.direction > 0 ? 1 : -1

				if (nextDirection === marqueeDirection) return

				marqueeDirection = nextDirection
				gsap.to(loop, {
					timeScale: marqueeDirection,
					duration: 0.18,
					ease: animationEases.inOut,
					overwrite: true
				})
			}
		})
	}, footerRoot.value)
}

onMounted(() => {
	setupStaggerLinks()
	setupFooterAnimations()
})

watch(locale, () => {
	setupStaggerLinks()
	setupFooterAnimations()
}, { flush: 'post' })

onUnmounted(() => {
	staggerLinks?.destroy()
	footerAnimationContext?.revert()
})
</script>
