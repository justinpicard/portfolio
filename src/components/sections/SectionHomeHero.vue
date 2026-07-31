<template>
	<section ref="root" class="home-hero home-hero--intro-pending">
		<div class="container hero-copy-container hero-copy-container--final">
			<HomeHeroCopy class="hero-copy-layer hero-copy-layer--final" />
		</div>

		<div ref="heroPhotoPositioner" class="hero-photo-positioner" aria-hidden="true">
			<div ref="heroPhoto" class="hero-photo">
				<BaseImage
					class-name="home-hero__image"
					src="/images/justin-6"
					alt=""
					loading="eager"
				/>
			</div>
		</div>

		<LoadingScreen ref="loadingScreen" />

		<CircularScrollIndicator
			ref="scrollIndicator"
			:text="t('accessibility.scrollDown')"
			:aria-label="t('accessibility.scrollToAbout')"
		/>
	</section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePortfolioContent } from '../../composables/usePortfolioContent'
import {
	gsap,
	prefersReducedMotion,
	registerGsapPlugins,
	ScrollTrigger,
	SplitText
} from '../../utils/animations/gsap'
import { animationDurations, animationEases, animationStaggers } from '../../utils/animations/presets'
import BaseImage from '../base/BaseImage.vue'
import LoadingScreen from '../LoadingScreen.vue'
import CircularScrollIndicator from '../ui/CircularScrollIndicator.vue'
import HomeHeroCopy from './HomeHeroCopy.vue'
import { lockPageScroll } from '../../utils/dom/scrollLock'
import { useCursorFollowIndicator } from '../../composables/useCursorFollowIndicator'

const { t } = useI18n()
const { hero } = usePortfolioContent()
const root = ref<HTMLElement | null>(null)
const loadingScreen = ref<InstanceType<typeof LoadingScreen> | null>(null)
const heroPhotoPositioner = ref<HTMLElement | null>(null)
const heroPhoto = ref<HTMLElement | null>(null)
const scrollIndicator = ref<InstanceType<typeof CircularScrollIndicator> | null>(null)
const scrollIndicatorWrapper = computed(() => scrollIndicator.value?.element ?? null)
const scrollIndicatorElement = computed(() => scrollIndicator.value?.indicator ?? null)
const FINAL_PHOTO_ROTATION = 4
const HERO_PHOTO_START = 0.2
const HERO_PHOTO_DURATION = 1.05
const HERO_INTRO_LOADING_OVERLAP = 0.14
const HERO_SCROLL_DRIFT = 48
const CURSOR_FOLLOW_POINTER_QUERY = '(hover: hover) and (pointer: fine)'
const INDICATOR_MAX_PLAYBACK_RATE = 30
const INDICATOR_VELOCITY_DIVISOR = 500
let ctx: gsap.Context | undefined
let heroTimeline: gsap.core.Timeline | undefined
let isHeroIntroLinked = false
let titleSplit: SplitText | undefined
let roleSplit: SplitText | undefined
let introSplit: SplitText | undefined
let copyRefreshId = 0
let unlockScroll: (() => void) | undefined
let scrollIndicatorFollow: ReturnType<typeof useCursorFollowIndicator> | undefined
let scrollIndicatorRotation: Animation | undefined
let scrollIndicatorVelocityTrigger: ReturnType<typeof ScrollTrigger.create> | undefined
let scrollIndicatorRateTween: gsap.core.Tween | undefined
let scrollIndicatorSettleCall: gsap.core.Tween | undefined
const scrollIndicatorPlayback = { rate: 1 }

const emit = defineEmits<{
	'intro-start': []
}>()

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

async function refreshHeroCopySplits() {
	const refreshId = ++copyRefreshId

	titleSplit?.revert()
	roleSplit?.revert()
	introSplit?.revert()
	titleSplit = undefined
	roleSplit = undefined
	introSplit = undefined

	if (prefersReducedMotion()) return

	await nextTick()

	if (refreshId !== copyRefreshId) return

	const finalTitle = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-name')
	const finalRole = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-figure__role')
	const finalText = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-figure__intro')
	if (!finalTitle || !finalRole || !finalText) return

	titleSplit = new SplitText(finalTitle, {
		type: 'chars',
		charsClass: 'split-display-char'
	})
	roleSplit = new SplitText(finalRole, {
		type: 'lines',
		linesClass: 'split-line'
	})
	introSplit = new SplitText(finalText, {
		type: 'lines',
		linesClass: 'split-line'
	})

	wrapSplitElements(titleSplit.chars, 'split-display-char-wrapper', 'span')
	wrapSplitElements(roleSplit.lines, 'split-line-wrapper')
	wrapSplitElements(introSplit.lines, 'split-line-wrapper')

	gsap.set([
		...titleSplit.chars,
		...roleSplit.lines,
		...introSplit.lines
	], {
		y: 0,
		yPercent: 0,
		opacity: 1,
		visibility: 'visible'
	})

	ScrollTrigger.refresh()
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
	emit('intro-start')
}

function supportsCursorFollow() {
	return window.matchMedia(CURSOR_FOLLOW_POINTER_QUERY).matches
}

function applyScrollIndicatorPlaybackRate() {
	scrollIndicatorRotation?.updatePlaybackRate(scrollIndicatorPlayback.rate)
}

function settleScrollIndicatorRotation() {
	scrollIndicatorRateTween?.kill()
	scrollIndicatorRateTween = gsap.to(scrollIndicatorPlayback, {
		rate: 1,
		duration: 0.75,
		ease: 'power3.out',
		onUpdate: applyScrollIndicatorPlaybackRate
	})
}

function updateScrollIndicatorRotation(scrollVelocity: number) {
	const targetRate = gsap.utils.clamp(
		1,
		INDICATOR_MAX_PLAYBACK_RATE,
		1 + Math.abs(scrollVelocity) / INDICATOR_VELOCITY_DIVISOR
	)

	scrollIndicatorRateTween?.kill()
	scrollIndicatorSettleCall?.kill()
	scrollIndicatorRateTween = gsap.to(scrollIndicatorPlayback, {
		rate: targetRate,
		duration: 0.14,
		ease: 'power2.out',
		onUpdate: applyScrollIndicatorPlaybackRate
	})
	scrollIndicatorSettleCall = gsap.delayedCall(
		0.1,
		settleScrollIndicatorRotation
	)
}

function setupScrollIndicatorVelocity(
	scrollIndicatorVisualElement: HTMLElement
) {
	if (prefersReducedMotion() || !root.value) return

	const graphic = scrollIndicatorVisualElement.querySelector<SVGElement>(
		'.circular-scroll-indicator__graphic'
	)
	scrollIndicatorRotation = graphic?.getAnimations()[0]
	if (!scrollIndicatorRotation) return

	scrollIndicatorVelocityTrigger = ScrollTrigger.create({
		trigger: root.value,
		start: 'top top',
		end: 'bottom top',
		onUpdate: (trigger) => {
			updateScrollIndicatorRotation(trigger.getVelocity())
		},
		onLeave: settleScrollIndicatorRotation,
		onLeaveBack: settleScrollIndicatorRotation
	})
}

function cleanupScrollIndicatorVelocity() {
	scrollIndicatorVelocityTrigger?.kill()
	scrollIndicatorVelocityTrigger = undefined
	scrollIndicatorRateTween?.kill()
	scrollIndicatorRateTween = undefined
	scrollIndicatorSettleCall?.kill()
	scrollIndicatorSettleCall = undefined
	scrollIndicatorPlayback.rate = 1
	applyScrollIndicatorPlaybackRate()
	scrollIndicatorRotation = undefined
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
	const heroPhotoPositionerElement = heroPhotoPositioner.value
	const heroPhotoElement = heroPhoto.value
	const scrollIndicatorVisualElement = scrollIndicatorElement.value
	if (!loadingScreenElement || !heroPhotoPositionerElement || !heroPhotoElement || !scrollIndicatorWrapper.value || !scrollIndicatorVisualElement) return
	const useCursorScrollIndicator = supportsCursorFollow()
	const finalTitle = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-name')
	const finalDivider = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-divider')
	const finalRole = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-figure__role')
	const finalText = root.value?.querySelector<HTMLElement>('.hero-copy-layer--final .hero-figure__intro')
	if (!finalTitle || !finalDivider || !finalRole || !finalText) return

	scrollIndicatorFollow = useCursorFollowIndicator({
		triggerElement: root,
		wrapperElement: scrollIndicatorWrapper,
		visualElement: scrollIndicatorElement,
		suppressSelector: '.site-header a, .site-header button, .site-header [role="button"], .site-header .role'
	})
	setupScrollIndicatorVelocity(scrollIndicatorVisualElement)

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
			.set(scrollIndicatorVisualElement, {
				yPercent: 0,
				autoAlpha: useCursorScrollIndicator ? 0 : 1,
				scale: 1
			}, 0)
			.call(() => {
				scrollIndicatorFollow?.enable()
			}, [], 0)

		linkHeroIntroTimeline()

		return
	}

	ctx = gsap.context(() => {
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
		gsap.set(scrollIndicatorVisualElement, {
			yPercent: useCursorScrollIndicator ? 0 : 120,
			autoAlpha: 0
		})

		gsap.to([heroPhotoPositionerElement, finalText], {
			y: HERO_SCROLL_DRIFT,
			ease: 'none',
			scrollTrigger: {
				trigger: root.value,
				start: 'top top',
				end: 'bottom top',
				scrub: true,
				invalidateOnRefresh: true
			}
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
			.call(restoreScroll, [], '>')

		if (!useCursorScrollIndicator) {
			heroTimeline.fromTo(scrollIndicatorVisualElement, {
				yPercent: 120,
				autoAlpha: 0
			}, {
				yPercent: 0,
				autoAlpha: 1,
				duration: 0.65,
				ease: 'power3.out'
			}, '>')
		}

		heroTimeline.add(() => {
			scrollIndicatorFollow?.enable()
		}, '>')

		linkHeroIntroTimeline()
	}, root.value ?? undefined)
})

watch(
	() => [hero.value.name, hero.value.role, hero.value.introduction],
	refreshHeroCopySplits,
	{ flush: 'pre' }
)

onUnmounted(() => {
	copyRefreshId += 1
	heroTimeline?.kill()
	isHeroIntroLinked = false
	scrollIndicatorFollow?.cleanup()
	cleanupScrollIndicatorVelocity()
	restoreScroll()
	ctx?.revert()
	titleSplit?.revert()
	roleSplit?.revert()
	introSplit?.revert()
})
</script>
