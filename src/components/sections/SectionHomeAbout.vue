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
const ABOUT_CHARACTER_INITIAL_SCALE = 2
const ABOUT_CHARACTER_INITIAL_BLUR = 15
const ABOUT_CHARACTER_INITIAL_OPACITY = 0
const ABOUT_EYEBROW_REVEAL_DURATION = 0.06
const ABOUT_EYEBROW_REVEAL_STAGGER_AMOUNT = 0.12
const ABOUT_EYEBROW_REVEAL_START = 'top 72%'
const ABOUT_EYEBROW_REVEAL_END = 'bottom 60%'
const ABOUT_INTRO_REVEAL_DURATION = 0.1
const ABOUT_INTRO_REVEAL_STAGGER_AMOUNT = 1.1
const ABOUT_INTRO_REVEAL_START = 'top 72%'
const ABOUT_INTRO_REVEAL_END = 'bottom 60%'
const COMPACT_OR_TOUCH_QUERY = '(max-width: 63.999rem), (hover: none) and (pointer: coarse)'
const ABOUT_TOUCH_INITIAL_Y_PERCENT = 24

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
		if (!aboutText.value || !aboutLabel.value || !aboutIntro.value) return
		const useTouchReveal = window.matchMedia(COMPACT_OR_TOUCH_QUERY).matches

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

		const labelSplit = new SplitText(aboutLabel.value, {
			type: useTouchReveal ? 'words' : 'words,chars',
			wordsClass: 'about-section__word',
			charsClass: 'about-section__char'
		})
		const introSplit = new SplitText(aboutIntro.value, {
			type: useTouchReveal ? 'words' : 'words,chars',
			wordsClass: 'about-section__word',
			charsClass: 'about-section__char'
		})
		aboutSplits = [labelSplit, introSplit]
		const labelTargets = useTouchReveal ? labelSplit.words : labelSplit.chars
		const introTargets = useTouchReveal ? introSplit.words : introSplit.chars
		const revealTargets = [...labelTargets, ...introTargets]

		gsap.set(revealTargets, {
			opacity: ABOUT_CHARACTER_INITIAL_OPACITY,
			...(useTouchReveal
				? { yPercent: ABOUT_TOUCH_INITIAL_Y_PERCENT }
				: {
					filter: `blur(${ABOUT_CHARACTER_INITIAL_BLUR}px)`,
					scale: ABOUT_CHARACTER_INITIAL_SCALE,
					transformOrigin: 'center center'
				})
		})
		gsap.set(aboutText.value, { visibility: 'visible' })

		gsap.to(labelTargets, {
			opacity: 1,
			...(useTouchReveal
				? { yPercent: 0 }
				: { filter: 'blur(0px)', scale: 1 }),
			duration: ABOUT_EYEBROW_REVEAL_DURATION,
			stagger: {
				amount: ABOUT_EYEBROW_REVEAL_STAGGER_AMOUNT,
				from: 'start'
			},
			ease: 'none',
			scrollTrigger: {
				trigger: aboutLabel.value,
				start: ABOUT_EYEBROW_REVEAL_START,
				end: ABOUT_EYEBROW_REVEAL_END,
				scrub: true,
				invalidateOnRefresh: true
			}
		})

		gsap.to(introTargets, {
			opacity: 1,
			...(useTouchReveal
				? { yPercent: 0 }
				: { filter: 'blur(0px)', scale: 1 }),
			duration: ABOUT_INTRO_REVEAL_DURATION,
			stagger: {
				amount: ABOUT_INTRO_REVEAL_STAGGER_AMOUNT,
				from: 'start'
			},
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
