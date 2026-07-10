<template>
	<section ref="root" class="home-hero">
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

		<LoadingScreen ref="loadingScreen">
			<div class="container hero-copy-container hero-copy-container--intro">
				<HomeHeroCopy
					decorative
					class="hero-copy-layer hero-copy-layer--intro"
				/>
			</div>
		</LoadingScreen>

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

const root = ref<HTMLElement | null>(null)
const loadingScreen = ref<InstanceType<typeof LoadingScreen> | null>(null)
const heroPhoto = ref<HTMLElement | null>(null)
const scrollIndicator = ref<InstanceType<typeof CircularScrollIndicator> | null>(null)
const FINAL_PHOTO_ROTATION = 4
const HERO_PHOTO_START = 2.4
const HERO_PHOTO_DURATION = 1.05
let ctx: gsap.Context | undefined
let heroTimeline: gsap.core.Timeline | undefined
let finalTitleSplit: SplitText | undefined
let titleSplit: SplitText | undefined
let roleSplit: SplitText | undefined
let introSplit: SplitText | undefined
let scrollLockState: {
	htmlOverflow: string
	bodyOverflow: string
} | undefined

defineExpose({
	element: root
})

function wrapSplitElements(elements: Element[], className: string, tagName: 'div' | 'span' = 'div') {
	elements.forEach((element) => {
		const wrapper = document.createElement(tagName)
		wrapper.classList.add(className)
		element.parentNode?.insertBefore(wrapper, element)
		wrapper.appendChild(element)
	})
}

function lockScroll() {
	if (scrollLockState) return

	const html = document.documentElement
	const body = document.body

	scrollLockState = {
		htmlOverflow: html.style.overflow,
		bodyOverflow: body.style.overflow
	}

	html.style.overflow = 'hidden'
	body.style.overflow = 'hidden'
}

function restoreScroll() {
	if (!scrollLockState) return

	document.documentElement.style.overflow = scrollLockState.htmlOverflow
	document.body.style.overflow = scrollLockState.bodyOverflow
	scrollLockState = undefined
}

onMounted(() => {
	registerGsapPlugins()

	const loadingScreenElement = loadingScreen.value?.element
	const heroPhotoElement = heroPhoto.value
	const scrollIndicatorElement = scrollIndicator.value?.indicator
	if (!loadingScreenElement || !heroPhotoElement || !scrollIndicatorElement) return
	const finalTitle = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-name')
	const introTitle = loadingScreenElement.querySelector<HTMLElement>('.hero-copy-layer--intro .hero-name')
	const introRole = loadingScreenElement.querySelector<HTMLElement>('.hero-copy-layer--intro .hero-figure__role')
	const introText = loadingScreenElement.querySelector<HTMLElement>('.hero-copy-layer--intro .hero-figure__intro')

	if (prefersReducedMotion()) {
		gsap.set([introTitle, introRole, introText].filter(Boolean), {
			visibility: 'visible'
		})
		gsap.set(loadingScreenElement, {
			clipPath: 'inset(0 0 100% 0)'
		})
		gsap.set(heroPhotoElement, {
			y: 0,
			rotation: FINAL_PHOTO_ROTATION,
			scale: 1
		})
		gsap.set(scrollIndicatorElement, {
			yPercent: 0,
			autoAlpha: 1
		})
		restoreScroll()
		return
	}

	ctx = gsap.context(() => {
		if (!finalTitle || !introTitle || !introRole || !introText) return

		finalTitleSplit = new SplitText(finalTitle, { type: 'chars', charsClass: 'split-display-char' })
		titleSplit = new SplitText(introTitle, { type: 'chars', charsClass: 'split-display-char' })
		roleSplit = new SplitText(introRole, { type: 'lines', linesClass: 'split-line' })
		introSplit = new SplitText(introText, { type: 'lines', linesClass: 'split-line' })

		wrapSplitElements(finalTitleSplit.chars, 'split-display-char-wrapper', 'span')
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
		gsap.set([introTitle, introRole, introText], {
			visibility: 'visible'
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

		lockScroll()

		heroTimeline = gsap.timeline({
			onComplete: restoreScroll
		})

		heroTimeline
			.to(titleSplit.chars, {
				yPercent: 0,
				duration: 0.9,
				stagger: 0.06,
				ease: 'power4.out'
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
	}, root.value ?? undefined)
})

onUnmounted(() => {
	heroTimeline?.kill()
	restoreScroll()
	ctx?.revert()
	finalTitleSplit?.revert()
	titleSplit?.revert()
	roleSplit?.revert()
	introSplit?.revert()
})
</script>
