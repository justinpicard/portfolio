<template>
	<section id="about" class="section about" ref="root">
		<div class="container">
			<div class="row">
				<div
					:key="locale"
					class="about-text d-flex flex-column col-12 lg:col-8 lg:offset-2 mb-3"
					ref="aboutText"
				>
					<p class="about-section__eyebrow eyebrow mb-8 text-secondary" ref="aboutEyebrow">{{ t('home.aboutLabel') }}</p>
					<h2 class="about-section__title heading-font mb-8 md:mb-16" ref="aboutTitle">
						{{ about.title }}
					</h2>
					<p>{{ about.greeting }} <span class="wave">👋🏼</span> {{ about.introduction }}</p>
					<p
						v-for="(paragraph, index) in about.paragraphs"
						:key="index"
					>
						{{ paragraph }}
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
import { gsap, ScrollTrigger, SplitText, registerGsapPlugins } from '../../utils/animations/gsap'
import { animationDurations, animationEases, animationStaggers } from '../../utils/animations/presets'

const { locale, t } = useI18n()
const { about } = usePortfolioContent()
const root = ref<HTMLElement | null>(null)
const aboutText = ref<HTMLElement | null>(null)
const aboutEyebrow = ref<HTMLParagraphElement | null>(null)
const aboutTitle = ref<HTMLHeadingElement | null>(null)
let eyebrowSplit: SplitText | undefined
let titleSplit: SplitText | undefined
let bodySplit: SplitText | undefined
let ctx: gsap.Context | undefined
let isMounted = false
let hasRevealCompleted = false
let revealRequestId = 0
const ABOUT_NAVIGATION_TEXT_VIEWPORT_POSITION = 0.2

function cleanupAboutReveal() {
	revealRequestId += 1
	ctx?.revert()
	ctx = undefined
	eyebrowSplit?.revert()
	titleSplit?.revert()
	bodySplit?.revert()
	if (root.value) delete root.value.dataset.sectionNavigationScrollY
	eyebrowSplit = undefined
	titleSplit = undefined
	bodySplit = undefined
}

function wrapSplitLines(lines: Element[]) {
	lines.forEach((line: Element) => {
		const wrapper = document.createElement('div')
		wrapper.classList.add('split-line-wrapper')
		line.parentNode?.insertBefore(wrapper, line)
		wrapper.appendChild(line)
	})
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

	registerGsapPlugins()

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

		const aboutBody = gsap.utils.toArray<HTMLParagraphElement>(
			aboutText.value.querySelectorAll('p:not(.about-section__eyebrow)')
		)

		eyebrowSplit = new SplitText(aboutEyebrow.value, { type: 'lines', linesClass: 'split-line' })
		titleSplit = new SplitText(aboutTitle.value, { type: 'lines', linesClass: 'split-line' })
		bodySplit = new SplitText(aboutBody, { type: 'lines', linesClass: 'split-line' })

		wrapSplitLines(eyebrowSplit.lines)
		wrapSplitLines(titleSplit.lines)
		wrapSplitLines(bodySplit.lines)

		const revealLines = [
			...eyebrowSplit.lines,
			...titleSplit.lines,
			...bodySplit.lines
		]

		if (hasRevealCompleted) {
			gsap.set(revealLines, { y: 0, opacity: 1 })
			return
		}

		const timeline = gsap.timeline({
			scrollTrigger: {
				trigger: root.value,
				start: 'top 50%',
				toggleActions: 'play none none none'
			}
		})

		timeline.fromTo(revealLines, {
			y: 90,
			opacity: 1
		}, {
			y: 0,
			opacity: 1,
			duration: animationDurations.reveal,
			stagger: animationStaggers.lines,
			ease: animationEases.strongOut,
			onComplete: () => {
				hasRevealCompleted = true
			}
		})
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
