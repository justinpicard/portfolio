<template>
	<section id="about" class="section-layout section-layout--editorial about" ref="root">
		<div class="container">
			<div class="row">
				<div
					:key="locale"
					class="about-text d-flex flex-column col-12 lg:col-8 lg:offset-2 mb-3"
					ref="aboutText"
				>
					<h2 class="about-section__eyebrow eyebrow font-body mb-8 text-secondary" ref="aboutLabel">{{ t('home.aboutLabel') }}</h2>
					<p class="about-section__title heading-font mb-8 md:mb-16" ref="aboutIntro">
						{{ about.greeting }}.
						<span class="wave">👋🏼</span>
						{{ about.introduction }}
						<span
							v-for="(paragraph, index) in about.paragraphs"
							:key="index"
							class="about-section__continuation"
						>
							{{ paragraph }}
						</span>
					</p>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
// TEMPORARY mobile scroll isolation; see src/config/mobileScrollDiagnostics.ts.
import { isScrollDiagnosticGroupEnabled } from '../../config/mobileScrollDiagnostics'
import { nextTick, ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePortfolioContent } from '../../composables/usePortfolioContent'
import {
	gsap,
	prefersReducedMotion,
	ScrollTrigger,
	SplitText,
	registerGsapPlugins
} from '../../utils/animations/gsap'

const { locale, t } = useI18n()
const { about } = usePortfolioContent()
const root = ref<HTMLElement | null>(null)
const aboutText = ref<HTMLElement | null>(null)
const aboutLabel = ref<HTMLHeadingElement | null>(null)
const aboutIntro = ref<HTMLParagraphElement | null>(null)
let aboutSplits: SplitText[] = []
let ctx: gsap.Context | undefined
let isMounted = false
let revealRequestId = 0
const ABOUT_NAVIGATION_TEXT_VIEWPORT_POSITION = 0.2
// Keep dimmed text readable against the primary background, including the small label.
const ABOUT_CHARACTER_INITIAL_OPACITY = 0.5
const ABOUT_EYEBROW_INITIAL_OPACITY = 0.75
const ABOUT_CHARACTER_REVEAL_DURATION = 1
const ABOUT_CHARACTER_REVEAL_STAGGER = 1
const ABOUT_EYEBROW_REVEAL_START = 'top 72%'
const ABOUT_EYEBROW_REVEAL_END = 'bottom 60%'
const ABOUT_INTRO_REVEAL_START = 'top 72%'
const ABOUT_INTRO_REVEAL_END = 'bottom 60%'

function cleanupAboutReveal() {
	revealRequestId += 1
	ctx?.revert()
	ctx = undefined
	aboutSplits.forEach((split) => split.revert())
	aboutSplits = []
	if (root.value) delete root.value.dataset.sectionNavigationScrollY
}

function waitForFonts() {
	return 'fonts' in document
		? document.fonts.ready
		: Promise.resolve()
}

function waitForFrame() {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve())
	})
}

async function initAboutReveal() {
	if (!isScrollDiagnosticGroupEnabled('about')) return

	const requestId = ++revealRequestId
	const reduceMotion = prefersReducedMotion()

	registerGsapPlugins()

	await waitForFonts()
	await nextTick()
	await waitForFrame()

	if (!isMounted || requestId !== revealRequestId) return

	ctx = gsap.context(() => {
		if (!aboutText.value || !aboutLabel.value || !aboutIntro.value) return

		ScrollTrigger.create({
			trigger: aboutText.value,
			start: () => `top ${ABOUT_NAVIGATION_TEXT_VIEWPORT_POSITION * 100}%`,
			onRefresh(self) {
				if (root.value) {
					root.value.dataset.sectionNavigationScrollY = String(self.start)
				}
			}
		})

		if (reduceMotion) return

		const labelSplit = new SplitText(aboutLabel.value, {
			type: 'words,chars',
			wordsClass: 'about-section__word',
			charsClass: 'about-section__char'
		})
		const introSplit = new SplitText(aboutIntro.value, {
			type: 'words,chars',
			wordsClass: 'about-section__word',
			charsClass: 'about-section__char'
		})
		aboutSplits = [labelSplit, introSplit]
		// Set every character before the stagger starts so waiting text stays readable.
		gsap.set(labelSplit.chars, { opacity: ABOUT_EYEBROW_INITIAL_OPACITY })
		gsap.set(introSplit.chars, { opacity: ABOUT_CHARACTER_INITIAL_OPACITY })

		gsap.to(labelSplit.chars, {
			opacity: 1,
			duration: ABOUT_CHARACTER_REVEAL_DURATION,
			stagger: ABOUT_CHARACTER_REVEAL_STAGGER,
			ease: 'none',
			scrollTrigger: {
				trigger: aboutLabel.value,
				start: ABOUT_EYEBROW_REVEAL_START,
				end: ABOUT_EYEBROW_REVEAL_END,
				scrub: true,
				invalidateOnRefresh: true
			}
		})

		gsap.to(introSplit.chars, {
			opacity: 1,
			duration: ABOUT_CHARACTER_REVEAL_DURATION,
			stagger: ABOUT_CHARACTER_REVEAL_STAGGER,
			ease: 'none',
			scrollTrigger: {
				trigger: aboutIntro.value,
				start: ABOUT_INTRO_REVEAL_START,
				end: ABOUT_INTRO_REVEAL_END,
				scrub: true,
				invalidateOnRefresh: true
			}
		})
		ScrollTrigger.refresh()
	}, root.value ?? undefined)
}

onMounted(() => {
	isMounted = true
	initAboutReveal()
})

watch(locale, async () => {
	cleanupAboutReveal()
	await nextTick()

	if (isMounted) {
		initAboutReveal()
	}
}, { flush: 'pre' })

onUnmounted(() => {
	isMounted = false
	cleanupAboutReveal()
})
</script>
