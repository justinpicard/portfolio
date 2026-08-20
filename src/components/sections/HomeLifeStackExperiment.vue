<template>
	<section ref="root" class="section home-life-section" aria-labelledby="home-life-title">
		<div ref="layout" class="container home-life-section__layout">
			<div ref="introRef" class="home-life-section__intro">
				<h2 id="home-life-title" ref="titleRef" class="home-life-section__title">
					{{ t('home.lifeLabel') }}
				</h2>
				<p ref="textRef" class="home-life-section__text">
					{{ t('home.lifeIntro') }}
				</p>
			</div>

			<div ref="stack" class="home-life-section__stack">
				<figure
					v-for="photo in photos"
					:key="photo.src"
					ref="cardRefs"
					:class="[
						'home-life-section__card',
						`home-life-section__card--${photo.ratio}`
					]"
				>
					<BaseImage
						class-name="home-life-section__photo"
						:src="photo.src"
						:alt="t(photo.altKey)"
						:aspect-ratio="aspectRatios[photo.ratio]"
						:position="photo.position"
					/>
					<figcaption class="home-life-section__caption">
						{{ t(photo.captionKey) }}
					</figcaption>
				</figure>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap, ScrollTrigger, SplitText, registerGsapPlugins } from '../../utils/animations/gsap'
import { animationDurations, animationEases, animationStaggers } from '../../utils/animations/presets'
import BaseImage from '../base/BaseImage.vue'

type PhotoRatio = 'portrait' | 'landscape' | 'square'

type LifePhoto = {
	src: string
	altKey: string
	captionKey: string
	ratio: PhotoRatio
	position: string
	rotation: number
	x: number
	y: number
}

const aspectRatios: Record<PhotoRatio, string> = {
	portrait: '3 / 4',
	landscape: '4 / 3',
	square: '1 / 1'
}

const photos: LifePhoto[] = [
	{
		src: '/images/photos/justin-picard_nancy',
		altKey: 'accessibility.lifePhotoAlts.nancyPortrait',
		captionKey: 'home.lifePhotoCaptions.nancyPortrait',
		ratio: 'portrait',
		position: 'center center',
		rotation: 2.2,
		x: -10,
		y: 6
	},
	{
		src: '/images/photos/justin-picard_bassist',
		altKey: 'accessibility.lifePhotoAlts.bassist',
		captionKey: 'home.lifePhotoCaptions.bassist',
		ratio: 'landscape',
		position: 'center center',
		rotation: -0.8,
		x: -5,
		y: 8
	},
	{
		src: '/images/photos/justin-picard_oktoberfest',
		altKey: 'accessibility.lifePhotoAlts.pretzel',
		captionKey: 'home.lifePhotoCaptions.pretzel',
		ratio: 'portrait',
		position: 'center center',
		rotation: -2,
		x: -20,
		y: 36
	},
	{
		src: '/images/photos/justin-picard_new-york-empire-state-building',
		altKey: 'accessibility.lifePhotoAlts.empireStateBuilding',
		captionKey: 'home.lifePhotoCaptions.empireStateBuilding',
		ratio: 'portrait',
		position: 'center 38%',
		rotation: 1.6,
		x: 10,
		y: 2
	},
	{
		src: '/images/photos/justin-picard_spanish',
		altKey: 'accessibility.lifePhotoAlts.learningSpanish',
		captionKey: 'home.lifePhotoCaptions.learningSpanish',
		ratio: 'square',
		position: 'center center',
		rotation: -1,
		x: 8,
		y: -5
	},
	{
		src: '/images/photos/justin-picard_pintxos-bilbao',
		altKey: 'accessibility.lifePhotoAlts.pintxos',
		captionKey: 'home.lifePhotoCaptions.pintxos',
		ratio: 'portrait',
		position: 'center center',
		rotation: 2,
		x: 8,
		y: -5
	},
	{
		src: '/images/photos/justin-picard_madison-square-garden',
		altKey: 'accessibility.lifePhotoAlts.randomPhoto',
		captionKey: 'home.lifePhotoCaptions.randomPhoto',
		ratio: 'landscape',
		position: 'center center',
		rotation: 1.5,
		x: -5,
		y: 30
	},
	{
		src: '/images/photos/justin-picard_berlin-fernsehturm',
		altKey: 'accessibility.lifePhotoAlts.berlinArchitecture',
		captionKey: 'home.lifePhotoCaptions.berlinArchitecture',
		ratio: 'portrait',
		position: 'center 38%',
		rotation: -2.2,
		x: 10,
		y: 2
	},
	{
		src: '/images/photos/justin-picard_new-york-selfie',
		altKey: 'accessibility.lifePhotoAlts.mirrorSelfie',
		captionKey: 'home.lifePhotoCaptions.mirrorSelfie',
		ratio: 'portrait',
		position: 'center center',
		rotation: -1.4,
		x: -7,
		y: 3
	},
	{
		src: '/images/photos/justin-picard_middelburg',
		altKey: 'accessibility.lifePhotoAlts.middelburg',
		captionKey: 'home.lifePhotoCaptions.middelburg',
		ratio: 'square',
		position: 'center 38%',
		rotation: 2.5,
		x: 25,
		y: 15
	},
	{
		src: '/images/photos/justin-picard_cats',
		altKey: 'accessibility.lifePhotoAlts.cats',
		captionKey: 'home.lifePhotoCaptions.cats',
		ratio: 'portrait',
		position: 'center 38%',
		rotation: 1.6,
		x: 3,
		y: 50
	},
	
]

const { locale, t } = useI18n()
const root = ref<HTMLElement | null>(null)
const layout = ref<HTMLElement | null>(null)
const stack = ref<HTMLElement | null>(null)
const introRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLHeadingElement | null>(null)
const textRef = ref<HTMLParagraphElement | null>(null)
const cardRefs = ref<HTMLElement[]>([])
let context: gsap.Context | undefined
let mediaContext: gsap.MatchMedia | undefined
let titleSplit: SplitText | undefined
let textSplit: SplitText | undefined
let isMounted = false
let animationRequestId = 0

function wrapSplitLines(lines: Element[]) {
	lines.forEach((line) => {
		const wrapper = document.createElement('div')
		wrapper.classList.add('split-line-wrapper')
		line.parentNode?.insertBefore(wrapper, line)
		wrapper.appendChild(line)
	})
}

function cleanupAnimations() {
	animationRequestId += 1
	mediaContext?.revert()
	context?.revert()
	titleSplit?.revert()
	textSplit?.revert()
	mediaContext = undefined
	context = undefined
	titleSplit = undefined
	textSplit = undefined
}

async function initAnimations() {
	const requestId = ++animationRequestId

	registerGsapPlugins()

	if (
		introRef.value
		&& window.matchMedia('(prefers-reduced-motion: no-preference)').matches
	) {
		// Prevent the copy from appearing before its masked start state is ready.
		gsap.set(introRef.value, { visibility: 'hidden' })
	}

	await ('fonts' in document ? document.fonts.ready : Promise.resolve())
	await nextTick()

	if (
		!isMounted
		|| requestId !== animationRequestId
		|| !root.value
		|| !layout.value
		|| !stack.value
	) return

	context = gsap.context(() => {
		mediaContext = gsap.matchMedia()

		mediaContext.add(
			'(prefers-reduced-motion: no-preference)',
			() => {
				if (!introRef.value || !titleRef.value || !textRef.value) return

				titleSplit = new SplitText(titleRef.value, {
					type: 'lines',
					linesClass: 'split-line'
				})
				textSplit = new SplitText(textRef.value, {
					type: 'lines',
					linesClass: 'split-line'
				})

				wrapSplitLines(titleSplit.lines)
				wrapSplitLines(textSplit.lines)

				const revealLines = [...titleSplit.lines, ...textSplit.lines]

				gsap.set(revealLines, {
					yPercent: 110,
					opacity: 1
				})
				gsap.set(introRef.value, { visibility: 'visible' })

				gsap.to(revealLines, {
					yPercent: 0,
					opacity: 1,
					duration: animationDurations.reveal,
					stagger: animationStaggers.lines,
					ease: animationEases.strongOut,
					scrollTrigger: {
						trigger: root.value,
						// Desktop copy reveals once the overlapping section reaches its pin position.
						start: () => window.matchMedia('(min-width: 64rem)').matches
							? 'top top'
							: 'top 75%',
						toggleActions: 'play none none none',
						invalidateOnRefresh: true
					}
				})
			}
		)

		// Keep pinning exclusive to roomy layouts; compact and reduced-motion
		// experiences use the naturally flowing card layout from the stylesheet.
		mediaContext.add(
			'(min-width: 64rem) and (prefers-reduced-motion: no-preference)',
			() => {
				const cards = cardRefs.value

				gsap.set(cards, {
					// Keep percentage-based centering inside GSAP so it remains correct
					// when lazy-loaded images change a card's final height.
					xPercent: -50,
					yPercent: -50,
					x: (index: number) => photos[index].x,
					// A full viewport offset keeps every waiting card below the fold,
					// even before its lazy-loaded image has established the card height.
					y: () => window.innerHeight,
					rotate: (index: number) => photos[index].rotation
						+ (index % 2 === 0 ? 0.35 : -0.35),
					autoAlpha: 1,
					zIndex: (index: number) => index + 1
				})

				const timeline = gsap.timeline({
					scrollTrigger: {
						trigger: root.value,
						start: 'top top',
						end: () => `+=${window.innerHeight * (cards.length - 1) * 0.75}`,
						scrub: 0.8,
						pin: layout.value,
						anticipatePin: 1,
						invalidateOnRefresh: true
					}
				})

				cards.forEach((card, index) => {
					const photo = photos[index]

					// Animate the complete figure so its image and caption always travel together.
					timeline.to(card, {
						x: photo.x,
						y: photo.y,
						rotate: photo.rotation,
						duration: 1,
						ease: 'power3.out'
					})
					timeline.to({}, { duration: 0.35 })
				})

				ScrollTrigger.refresh()
			}
		)
	}, root.value)
}

onMounted(() => {
	isMounted = true
	initAnimations()
})

watch(locale, async () => {
	cleanupAnimations()
	await nextTick()

	if (isMounted) {
		initAnimations()
	}
}, { flush: 'pre' })

onUnmounted(() => {
	isMounted = false
	cleanupAnimations()
})
</script>
