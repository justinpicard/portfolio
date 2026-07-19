<template>
	<section ref="root" class="home-hero home-hero--intro-pending">
		<div class="container hero-copy-container hero-copy-container--final">
			<HomeHeroCopy class="hero-copy-layer hero-copy-layer--final" />
		</div>

		<div ref="heroPhoto" class="hero-photo" aria-hidden="true">
			<BaseImage
				class-name="home-hero__image"
				src="/images/justin-picard"
				alt=""
				loading="eager"
			/>
		</div>

		<LoadingScreen ref="loadingScreen" />

		<CircularScrollIndicator ref="scrollIndicator" />
	</section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap, prefersReducedMotion, registerGsapPlugins, SplitText } from '../../utils/animations/gsap'
import { animationDurations, animationEases, animationStaggers } from '../../utils/animations/presets'
import BaseImage from '../base/BaseImage.vue'
import LoadingScreen from '../LoadingScreen.vue'
import CircularScrollIndicator from '../ui/CircularScrollIndicator.vue'
import HomeHeroCopy from './HomeHeroCopy.vue'
import { lockPageScroll } from '../../utils/dom/scrollLock'

const root = ref<HTMLElement | null>(null)
const loadingScreen = ref<InstanceType<typeof LoadingScreen> | null>(null)
const heroPhoto = ref<HTMLElement | null>(null)
const scrollIndicator = ref<InstanceType<typeof CircularScrollIndicator> | null>(null)
const FINAL_PHOTO_ROTATION = 4
const HERO_PHOTO_START = 0.2
const HERO_PHOTO_DURATION = 1.05
const HERO_INTRO_LOADING_OVERLAP = 0.14
let ctx: gsap.Context | undefined
let heroTimeline: gsap.core.Timeline | undefined
let isHeroIntroLinked = false
let titleSplit: SplitText | undefined
let roleSplit: SplitText | undefined
let introSplit: SplitText | undefined
let unlockScroll: (() => void) | undefined

defineExpose({
	element: root,
	getHeroIntroTimeline,
	playHeroIntro
})

function wrapSplitElements(elements: Element[], className: string, tagName: 'div' | 'span' = 'div') {
	elements.forEach((element) => {
		const wrapper = document.createElement(tagName)
		wrapper.classList.add(className)
		element.parentNode?.insertBefore(wrapper, element)
		wrapper.appendChild(element)
	})
}

function restoreScroll() {
	unlockScroll?.()
	unlockScroll = undefined
}

function playHeroIntro() {
	heroTimeline?.play(0)
}

function getHeroIntroTimeline() {
	return heroTimeline
}

function markHeroIntroStarted() {
	root.value?.classList.remove('home-hero--intro-pending')
}

function linkHeroIntroTimeline() {
	if (isHeroIntroLinked || !heroTimeline) return

	const loadingTimeline = loadingScreen.value?.getSignatureDrawTimeline()
	heroTimeline.pause(0)

	if (!loadingTimeline) {
		playHeroIntro()
		isHeroIntroLinked = true
		return
	}

	loadingTimeline.add(heroTimeline, `-=${HERO_INTRO_LOADING_OVERLAP}`)
	heroTimeline.paused(false)
	isHeroIntroLinked = true
}

onMounted(() => {
	registerGsapPlugins()

	const loadingScreenElement = loadingScreen.value?.element
	const heroPhotoElement = heroPhoto.value
	const scrollIndicatorElement = scrollIndicator.value?.indicator
	if (!loadingScreenElement || !heroPhotoElement || !scrollIndicatorElement) return
	const finalTitle = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-name')
	const finalDivider = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-divider')
	const finalRole = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-figure__role')
	const finalText = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-figure__intro')

	unlockScroll = lockPageScroll()

	if (prefersReducedMotion()) {
		heroTimeline = gsap.timeline({
			paused: true,
			onComplete: restoreScroll
		})

		heroTimeline
			.call(markHeroIntroStarted, [], 0)
			.set([finalTitle, finalDivider, finalRole, finalText].filter(Boolean), {
				visibility: 'visible'
			}, 0)
			.set(finalDivider, {
				width: '100%'
			}, 0)
			.set(loadingScreenElement, {
				clipPath: 'inset(0 0 100% 0)'
			}, 0)
			.set(heroPhotoElement, {
				y: 0,
				rotation: FINAL_PHOTO_ROTATION,
				scale: 1
			}, 0)
			.set(scrollIndicatorElement, {
				yPercent: 0,
				autoAlpha: 1
			}, 0)

		linkHeroIntroTimeline()

		return
	}

	ctx = gsap.context(() => {
		if (!finalTitle || !finalDivider || !finalRole || !finalText) return

		titleSplit = new SplitText(finalTitle, { type: 'chars', charsClass: 'split-display-char' })
		roleSplit = new SplitText(finalRole, { type: 'lines', linesClass: 'split-line' })
		introSplit = new SplitText(finalText, { type: 'lines', linesClass: 'split-line' })

		wrapSplitElements(titleSplit.chars, 'split-display-char-wrapper', 'span')
		wrapSplitElements(roleSplit.lines, 'split-line-wrapper')
		wrapSplitElements(introSplit.lines, 'split-line-wrapper')

		const revealLines = [
			...roleSplit.lines,
			...introSplit.lines
		]

		gsap.set(titleSplit.chars, {
			yPercent: 115
		})
		gsap.set(revealLines, {
			y: 90,
			opacity: 1
		})
		gsap.set(finalDivider, {
			width: '0%'
		})
		gsap.set(heroPhotoElement, {
			y: '110vh',
			rotation: -8,
			scale: 0.98
		})
		gsap.set(scrollIndicatorElement, {
			yPercent: 120,
			autoAlpha: 0
		})

		heroTimeline = gsap.timeline({
			paused: true,
			onComplete: restoreScroll
		})

		heroTimeline
			.call(markHeroIntroStarted, [], 0)
			.set([finalTitle, finalDivider, finalRole, finalText], {
				visibility: 'visible'
			}, 0)
			.to(titleSplit.chars, {
				yPercent: 0,
				duration: 0.9,
				stagger: 0.06,
				ease: 'power4.out'
			}, 0)
				.to(finalDivider, {
					width: '100%',
					duration: 0.9,
					ease: 'power3.inOut'
				}, 0)
			.to(roleSplit.lines, {
				y: 0,
				opacity: 1,
				duration: animationDurations.reveal,
				stagger: animationStaggers.lines,
				ease: animationEases.strongOut
			}, 0.55)
			.to(introSplit.lines, {
				y: 0,
				opacity: 1,
				duration: animationDurations.reveal,
				stagger: animationStaggers.lines,
				ease: animationEases.strongOut
			}, 0.7)
			.to(loadingScreenElement, {
				clipPath: 'inset(0 0 100% 0)',
				duration: 1.1,
				ease: 'power4.inOut'
			}, 1.95)
			.addLabel('photoIn', HERO_PHOTO_START)
			.to(heroPhotoElement, {
				y: 0,
				rotation: FINAL_PHOTO_ROTATION,
				scale: 1,
				duration: HERO_PHOTO_DURATION,
				ease: 'power4.out'
			}, 'photoIn')
			.fromTo(scrollIndicatorElement, {
				yPercent: 120,
				autoAlpha: 0
			}, {
				yPercent: 0,
				autoAlpha: 1,
				duration: 0.65,
				ease: 'power3.out'
			}, 'photoIn+=0.75')

		linkHeroIntroTimeline()
	}, root.value ?? undefined)
})

onUnmounted(() => {
	heroTimeline?.kill()
	isHeroIntroLinked = false
	restoreScroll()
	ctx?.revert()
	titleSplit?.revert()
	roleSplit?.revert()
	introSplit?.revert()
})
</script>
