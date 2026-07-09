<template>
  <section class="home-hero d-flex justify-center pt-24 pb-12" ref="root" :style="heroIntroStyles">
    <div class="limits"></div>
    <div class="half"></div>
	<div class="container z-10">
		<div class="row">
			<div class="col-12 lg:col-8 lg:offset-2 d-flex flex-column items-center justify-center">
				<div class="hero-composition">
					<span class="hero-name hero-name--first" ref="firstName" aria-hidden="true">Justin</span>
					<div class="hero-figure gap-y-4" ref="heroFigure">
						<div class="hero-figure__media" ref="heroFigureMedia"></div>
						<div class="hero-figure__content">
							<p class="hero-figure__role text-md sm:text-lg font-body font-regular mb-0" ref="roleText">Digital product designer</p>
						</div>
					</div>
					<span class="hero-name hero-name--last" ref="lastName" aria-hidden="true">Picard</span>
					<h1 class="sr-only">Justin Picard</h1>
				</div>
			</div>
		</div>
	</div>

	<div class="home-hero__scroll-indicator z-10">
		<span>Scroll for more</span>
	</div>
	
	<div class="personal-image" ref="personalImage">
		<div class="personal-image__mask" ref="imageMask">
			<div class="personal-image__frame">
				<div class="personal-image__parallax">
					<BaseImage
						class-name="home-hero__image"
						src="/images/justin-picard"
						alt="Justin Picard"
						loading="eager"
					/>
				</div>
			</div>
			<div class="personal-image__wipe" ref="imageWipe"></div>
		</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { gsap, prefersReducedMotion, registerGsapPlugins, SplitText } from '../../utils/animations/gsap'
import BaseImage from '../base/BaseImage.vue'

const FINAL_MASK_WIDTH = 500
const FINAL_MASK_HEIGHT = 600
const WIPE_IN_DURATION = 0.35
const WIPE_OUT_DURATION = 0.45
const PAUSE_DURATION = 0.2
const CROP_REVEAL_DURATION = 1.1
const TEXT_REVEAL_DURATION = 0.75
const TEXT_REVEAL_DELAY = 0.14
const TEXT_REVEAL_OFFSET = CROP_REVEAL_DURATION - TEXT_REVEAL_DURATION - TEXT_REVEAL_DELAY * 2
const INITIAL_IMAGE_SCALE = 1.1
const SETTLED_IMAGE_SCALE = 1
const CROPPED_IMAGE_SCALE = 0.72
const PARALLAX_Y_OFFSET = -80
const PARALLAX_SAFE_AREA = Math.abs(PARALLAX_Y_OFFSET) * 2
const FINAL_FRAME_WIDTH = Math.ceil(FINAL_MASK_WIDTH / CROPPED_IMAGE_SCALE)
const FINAL_FRAME_HEIGHT = Math.ceil((FINAL_MASK_HEIGHT + PARALLAX_SAFE_AREA) / CROPPED_IMAGE_SCALE)
const IMAGE_SETTLE_DURATION = 0.8
const FINAL_Y_OFFSET = '0%'
const WIPE_EASE = 'power2.out'
const IMAGE_SETTLE_EASE = 'power2.out'
const CROP_REVEAL_EASE = 'power4.out'
const TEXT_REVEAL_EASE = 'power4.out'
const WIPE_COLOR = '#1AFFD5'

const personalImage = ref<HTMLElement | null>(null)
const imageMask = ref<HTMLElement | null>(null)
const imageWipe = ref<HTMLElement | null>(null)
const heroFigure = ref<HTMLElement | null>(null)
const heroFigureMedia = ref<HTMLElement | null>(null)
const firstName = ref<HTMLElement | null>(null)
const lastName = ref<HTMLElement | null>(null)
const roleText = ref<HTMLElement | null>(null)
const root = ref<HTMLElement | null>(null)
let ctx: gsap.Context | undefined
let introTimeline: gsap.core.Timeline | undefined
let firstNameSplit: SplitText | undefined
let lastNameSplit: SplitText | undefined
let removeImageReadyListener: (() => void) | undefined
let removeResizeListener: (() => void) | undefined
let resizeObserver: ResizeObserver | undefined
let cropUpdateFrame: number | undefined
let parallaxTween: gsap.core.Tween | undefined
let hasCompletedIntro = false

const heroIntroStyles = {
	'--hero-final-mask-width': `${FINAL_MASK_WIDTH}px`,
	'--hero-final-mask-height': `${FINAL_MASK_HEIGHT}px`,
	'--hero-final-frame-width': `${FINAL_FRAME_WIDTH}px`,
	'--hero-final-frame-height': `${FINAL_FRAME_HEIGHT}px`,
	'--hero-wipe-color': WIPE_COLOR
} as CSSProperties

onMounted(() => {
	registerGsapPlugins()

	if (!root.value || !personalImage.value || !imageMask.value || !imageWipe.value || !heroFigure.value || !heroFigureMedia.value || !firstName.value || !lastName.value || !roleText.value) return

	ctx = gsap.context(() => {
		const rootElement = root.value
		const imageMaskElement = imageMask.value
		const imageWipeElement = imageWipe.value
		const heroFigureMediaElement = heroFigureMedia.value
		const firstNameElement = firstName.value
		const lastNameElement = lastName.value
		const roleTextElement = roleText.value

		if (!rootElement || !imageMaskElement || !imageWipeElement || !heroFigureMediaElement || !firstNameElement || !lastNameElement || !roleTextElement) return

		const imageFrameElement = imageMaskElement.querySelector<HTMLElement>('.personal-image__frame')
		const imageParallaxElement = imageMaskElement.querySelector<HTMLElement>('.personal-image__parallax')
		const heroImageElement = imageMaskElement.querySelector<HTMLImageElement>('img')
		if (!imageFrameElement || !imageParallaxElement || !heroImageElement) return

		firstNameSplit = new SplitText(firstNameElement, { type: 'words', wordsClass: 'split-word' })
		lastNameSplit = new SplitText(lastNameElement, { type: 'words', wordsClass: 'split-word' })
		const firstNameWords = firstNameSplit.words
		const lastNameWords = lastNameSplit.words

		const textRevealTargets = [
			...firstNameWords,
			...lastNameWords,
			roleTextElement
		]

		const getCropTarget = () => {
			const targetRect = heroFigureMediaElement.getBoundingClientRect()

			return {
				left: targetRect.left,
				top: targetRect.top,
				width: targetRect.width,
				height: targetRect.height
			}
		}

		const updateCropToCurrentLayout = () => {
			if (!hasCompletedIntro) return

			const cropTarget = getCropTarget()

			gsap.set(imageMaskElement, {
				left: cropTarget.left,
				top: cropTarget.top,
				width: cropTarget.width,
				height: cropTarget.height,
				xPercent: 0,
				yPercent: 0
			})
		}

		const queueCropUpdate = () => {
			if (cropUpdateFrame) {
				window.cancelAnimationFrame(cropUpdateFrame)
			}

			cropUpdateFrame = window.requestAnimationFrame(() => {
				cropUpdateFrame = undefined
				updateCropToCurrentLayout()
			})
		}

		window.addEventListener('resize', queueCropUpdate)
		removeResizeListener = () => {
			window.removeEventListener('resize', queueCropUpdate)
		}

		resizeObserver = new ResizeObserver(queueCropUpdate)
		resizeObserver.observe(heroFigureMediaElement)

		gsap.set(heroImageElement, {
			scale: INITIAL_IMAGE_SCALE,
			y: FINAL_Y_OFFSET,
			transformOrigin: 'center center',
			visibility: 'hidden'
		})

		gsap.set(imageFrameElement, {
			left: '50%',
			top: '50%',
			width: '100vw',
			height: '100vh',
			xPercent: -50,
			yPercent: -50,
			scale: 1,
			y: 0
		})

		gsap.set(imageParallaxElement, {
			y: 0
		})

		if (!prefersReducedMotion()) {
			parallaxTween = gsap.to(imageParallaxElement, {
				y: PARALLAX_Y_OFFSET,
				ease: 'none',
				scrollTrigger: {
					trigger: rootElement,
					start: 'top top',
					end: 'bottom top',
					scrub: true
				}
			})
		}

		gsap.set(imageWipeElement, {
			scaleX: 0,
			transformOrigin: 'left center'
		})

		gsap.set(textRevealTargets, {
			yPercent: 115,
			visibility: 'hidden'
		})

		if (prefersReducedMotion()) {
			const cropTarget = getCropTarget()

			gsap.set(imageMaskElement, {
				left: cropTarget.left,
				top: cropTarget.top,
				width: cropTarget.width,
				height: cropTarget.height,
				xPercent: 0,
				yPercent: 0
			})
			gsap.set(heroImageElement, {
				scale: CROPPED_IMAGE_SCALE,
				y: FINAL_Y_OFFSET,
				visibility: 'visible'
			})
			gsap.set(imageFrameElement, {
				left: '50%',
				top: '50%',
				width: FINAL_FRAME_WIDTH,
				height: FINAL_FRAME_HEIGHT,
				xPercent: -50,
				yPercent: -50,
				y: 0
			})
			gsap.set(imageParallaxElement, {
				y: 0
			})
			gsap.set(imageWipeElement, {
				scaleX: 0
			})
			gsap.set(textRevealTargets, {
				yPercent: 0,
				visibility: 'visible'
			})
			hasCompletedIntro = true
			return
		}

		const startMaskSwipe = () => {
			if (introTimeline) return

			const cropTarget = getCropTarget()

			introTimeline = gsap.timeline({
				defaults: {
					ease: WIPE_EASE
				}
			})

			introTimeline
				.set(imageMaskElement, {
					left: 0,
					top: 0,
					width: '100vw',
					height: '100vh',
					xPercent: 0,
					yPercent: 0
				})
				.set(heroImageElement, {
					scale: INITIAL_IMAGE_SCALE,
					y: FINAL_Y_OFFSET,
					visibility: 'hidden'
				})
				.set(imageFrameElement, {
					left: '50%',
					top: '50%',
					width: '100vw',
					height: '100vh',
					xPercent: -50,
					yPercent: -50,
					scale: 1
				})
				.set(imageParallaxElement, {
					y: 0
				})
				.set(imageWipeElement, {
					scaleX: 0,
					transformOrigin: 'left center'
				})
				.to(imageWipeElement, {
					scaleX: 1,
					duration: WIPE_IN_DURATION,
					transformOrigin: 'left center'
				})
				.set(heroImageElement, {
					visibility: 'visible'
				})
				.to(imageWipeElement, {
					scaleX: 0,
					duration: WIPE_OUT_DURATION,
					transformOrigin: 'right center'
				}, 'wipeOut')
				.to(heroImageElement, {
					scale: SETTLED_IMAGE_SCALE,
					duration: IMAGE_SETTLE_DURATION,
					ease: IMAGE_SETTLE_EASE
				}, 'wipeOut')
				.to({}, {
					duration: PAUSE_DURATION
				})
				.to(imageMaskElement, {
					left: cropTarget.left,
					top: cropTarget.top,
					width: cropTarget.width,
					height: cropTarget.height,
					xPercent: 0,
					yPercent: 0,
					duration: CROP_REVEAL_DURATION,
					ease: CROP_REVEAL_EASE
				}, 'cropReveal')
				.to(heroImageElement, {
					scale: CROPPED_IMAGE_SCALE,
					duration: CROP_REVEAL_DURATION,
					ease: CROP_REVEAL_EASE
				}, 'cropReveal')
				.to(firstNameWords, {
					yPercent: 0,
					visibility: 'visible',
					duration: TEXT_REVEAL_DURATION,
					ease: TEXT_REVEAL_EASE
				}, `cropReveal+=${TEXT_REVEAL_OFFSET}`)
				.to(lastNameWords, {
					yPercent: 0,
					visibility: 'visible',
					duration: TEXT_REVEAL_DURATION,
					ease: TEXT_REVEAL_EASE
				}, `cropReveal+=${TEXT_REVEAL_OFFSET + TEXT_REVEAL_DELAY}`)
				.to(roleTextElement, {
					yPercent: 0,
					visibility: 'visible',
					duration: TEXT_REVEAL_DURATION,
					ease: TEXT_REVEAL_EASE
				}, `cropReveal+=${TEXT_REVEAL_OFFSET + TEXT_REVEAL_DELAY * 2}`)
				.call(() => {
					hasCompletedIntro = true
					updateCropToCurrentLayout()
				})
		}

		const startWhenImagesReady = () => {
			if (heroImageElement.complete && heroImageElement.naturalWidth > 0) {
				startMaskSwipe()
			}
		}

		startWhenImagesReady()

		heroImageElement.addEventListener('load', startWhenImagesReady, { once: true })
		removeImageReadyListener = () => {
			heroImageElement.removeEventListener('load', startWhenImagesReady)
		}
	}, root.value)
})

onUnmounted(() => {
	removeImageReadyListener?.()
	removeResizeListener?.()
	resizeObserver?.disconnect()

	if (cropUpdateFrame) {
		window.cancelAnimationFrame(cropUpdateFrame)
	}

	introTimeline?.kill()
	parallaxTween?.kill()
	ctx?.revert()
	firstNameSplit?.revert()
	lastNameSplit?.revert()
})
</script>
