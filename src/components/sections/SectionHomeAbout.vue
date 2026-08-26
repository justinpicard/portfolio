<template>
	<section id="about" class="section-layout section-layout--editorial about" ref="root">
		<div class="container">
			<div class="row">
				<div
					:key="locale"
					class="about-text d-flex flex-column col-12 lg:col-8 lg:offset-2 mb-3"
					ref="aboutText"
				>
					<p class="about-section__eyebrow eyebrow mb-8 text-secondary" ref="aboutEyebrow">{{ t('home.aboutLabel') }}</p>
					<h2 class="about-section__title heading-font mb-8 md:mb-16" ref="aboutTitle">
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
					</h2>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
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
const aboutEyebrow = ref<HTMLParagraphElement | null>(null)
const aboutTitle = ref<HTMLHeadingElement | null>(null)
let aboutSplits: SplitText[] = []
let ctx: gsap.Context | undefined
let isMounted = false
let revealRequestId = 0
const ABOUT_NAVIGATION_TEXT_VIEWPORT_POSITION = 0.2
const ABOUT_CHARACTER_INITIAL_SCALE = 2
const ABOUT_CHARACTER_INITIAL_BLUR = 15
const ABOUT_CHARACTER_INITIAL_OPACITY = 0
const ABOUT_EYEBROW_REVEAL_DURATION = 0.06
const ABOUT_EYEBROW_REVEAL_STAGGER_AMOUNT = 0.12
const ABOUT_EYEBROW_REVEAL_START = 'top 72%'
const ABOUT_EYEBROW_REVEAL_END = 'bottom 60%'
const ABOUT_HEADING_REVEAL_DURATION = 0.1
const ABOUT_HEADING_REVEAL_STAGGER_AMOUNT = 1.1
const ABOUT_HEADING_REVEAL_START = 'top 72%'
const ABOUT_HEADING_REVEAL_END = 'bottom 60%'

function cleanupAboutReveal() {
	revealRequestId += 1
	ctx?.revert()
	ctx = undefined
	aboutSplits.forEach((split) => split.revert())
	aboutSplits = []
	if (aboutText.value) gsap.set(aboutText.value, { clearProps: 'visibility' })
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
	const requestId = ++revealRequestId
	const reduceMotion = prefersReducedMotion()

	registerGsapPlugins()
	if (aboutText.value && !reduceMotion) {
		// Avoid flashing the sharp state while fonts and character boundaries settle.
		gsap.set(aboutText.value, { visibility: 'hidden' })
	}

	await waitForFonts()
	await nextTick()
	await waitForFrame()

	if (!isMounted || requestId !== revealRequestId) return

	ctx = gsap.context(() => {
		if (!aboutText.value || !aboutEyebrow.value || !aboutTitle.value) return

		ScrollTrigger.create({
			trigger: aboutText.value,
			start: () => `top ${ABOUT_NAVIGATION_TEXT_VIEWPORT_POSITION * 100}%`,
			onRefresh(self) {
				if (root.value) {
					root.value.dataset.sectionNavigationScrollY = String(self.start)
				}
			}
		})

		if (reduceMotion) {
			gsap.set(aboutText.value, { clearProps: 'visibility' })
			return
		}

		const eyebrowSplit = new SplitText(aboutEyebrow.value, {
			type: 'words,chars',
			wordsClass: 'about-section__word',
			charsClass: 'about-section__char'
		})
		const headingSplit = new SplitText(aboutTitle.value, {
			type: 'words,chars',
			wordsClass: 'about-section__word',
			charsClass: 'about-section__char'
		})
		aboutSplits = [eyebrowSplit, headingSplit]
		const allCharacters = aboutSplits.flatMap((split) => split.chars)

		gsap.set(allCharacters, {
			filter: `blur(${ABOUT_CHARACTER_INITIAL_BLUR}px)`,
			opacity: ABOUT_CHARACTER_INITIAL_OPACITY,
			scale: ABOUT_CHARACTER_INITIAL_SCALE,
			transformOrigin: 'center center'
		})
		gsap.set(aboutText.value, { visibility: 'visible' })

		gsap.to(eyebrowSplit.chars, {
			filter: 'blur(0px)',
			opacity: 1,
			scale: 1,
			duration: ABOUT_EYEBROW_REVEAL_DURATION,
			stagger: {
				amount: ABOUT_EYEBROW_REVEAL_STAGGER_AMOUNT,
				from: 'start'
			},
			ease: 'none',
			scrollTrigger: {
				trigger: aboutEyebrow.value,
				start: ABOUT_EYEBROW_REVEAL_START,
				end: ABOUT_EYEBROW_REVEAL_END,
				scrub: true,
				invalidateOnRefresh: true
			}
		})

		gsap.to(headingSplit.chars, {
			filter: 'blur(0px)',
			opacity: 1,
			scale: 1,
			duration: ABOUT_HEADING_REVEAL_DURATION,
			stagger: {
				amount: ABOUT_HEADING_REVEAL_STAGGER_AMOUNT,
				from: 'start'
			},
			ease: 'none',
			scrollTrigger: {
				trigger: aboutTitle.value,
				start: ABOUT_HEADING_REVEAL_START,
				end: ABOUT_HEADING_REVEAL_END,
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
