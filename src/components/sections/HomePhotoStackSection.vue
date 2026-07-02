<template>
	<section class="section home-photo-stack-section" ref="root">
		<div class="home-photo-stack-section__content">
			<div class="container">
				<div class="row">
					<div class="col-12">
						<p class="home-photo-stack-section__eyebrow mb-2">Get to know me</p>
						<h2 class="home-photo-stack-section__title mb-0">What my world looks like</h2>
					</div>
				</div>
			</div>
		</div>
		<div class="home-photo-stack-section__stage" ref="stack">
			<img
				v-for="photo in photos"
				:key="photo.src"
				ref="photoRefs"
				class="home-photo-stack-section__photo"
				:src="photo.src"
				:alt="photo.alt"
				loading="lazy"
				decoding="async"
			>
		</div>
	</section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap, ScrollTrigger, registerGsapPlugins } from '../../utils/animations/gsap'

type Photo = {
	src: string
	alt: string
}

const photos: Photo[] = [
	{ src: '/images/photos/justin-picard.jpg', alt: 'Justin Picard portrait' },
	{ src: '/images/photos/dehoop.jpg', alt: 'De Hoop project visual' },
	{ src: '/images/photos/recranet.jpg', alt: 'Recranet project visual' },
	{ src: '/images/photos/hz-university.jpg', alt: 'HZ University project visual' },
	{ src: '/images/photos/sfvonline.jpg', alt: 'SFV Online project visual' },
	{ src: '/images/photos/vodatent.jpg', alt: 'Vodatent project visual' }
]

const stackOffsets = [
	{ x: -8, y: 4, rotate: -6 },
	{ x: 6, y: -2, rotate: 4 },
	{ x: -4, y: 8, rotate: -3 },
	{ x: 9, y: 3, rotate: 5 },
	{ x: -6, y: -5, rotate: -4 },
	{ x: 3, y: 6, rotate: 2 }
]

const spreadOffsets = [
	{ x: '-34vw', y: '-14vh', rotate: -14, scale: 1 },
	{ x: '-20vw', y: '18vh', rotate: 9, scale: 0.96 },
	{ x: '-2vw', y: '-22vh', rotate: -5, scale: 1.04 },
	{ x: '18vw', y: '16vh', rotate: 13, scale: 0.98 },
	{ x: '34vw', y: '-10vh', rotate: -9, scale: 1.02 },
	{ x: '4vw', y: '25vh', rotate: 6, scale: 0.97 }
]

const spreadOrder = [0, 2, 4, 1, 3, 5]
const root = ref<HTMLElement | null>(null)
const stack = ref<HTMLElement | null>(null)
const photoRefs = ref<HTMLImageElement[]>([])
let ctx: gsap.Context | undefined

onMounted(() => {
	registerGsapPlugins()

	if (!root.value || !stack.value) return

	ctx = gsap.context(() => {
		const photoElements = photoRefs.value

		gsap.set(stack.value, {
			y: '70vh',
			scale: 0.92
		})

		gsap.set(photoElements, {
			x: (index: number) => stackOffsets[index].x,
			y: (index: number) => stackOffsets[index].y,
			rotate: (index: number) => stackOffsets[index].rotate,
			autoAlpha: 1,
			zIndex: (index: number) => photoElements.length - index
		})

		const timeline = gsap.timeline({
			scrollTrigger: {
				trigger: root.value,
				start: 'top top',
				end: '+=260%',
				scrub: 1,
				pin: true,
				anticipatePin: 1
			}
		})

		// Phase 1: bring the stacked photos up into the center of the pinned viewport.
		timeline.to(stack.value, {
			y: 0,
			scale: 1,
			ease: 'power3.out',
			duration: 3
		})

		// Phase 2: let the centered stack breathe before individual photos move.
		timeline.to(stack.value, {
			y: 0,
			duration: 0.35
		})

		timeline.to({}, { duration: 1 })

		// Phase 3: spread photos one by one, keeping the movement editorial and smooth.
		spreadOrder.forEach((photoIndex, orderIndex) => {
			timeline.to(
				photoElements[photoIndex],
				{
					x: spreadOffsets[photoIndex].x,
					y: spreadOffsets[photoIndex].y,
					rotate: spreadOffsets[photoIndex].rotate,
					scale: spreadOffsets[photoIndex].scale,
					duration: 1.35,
					ease: 'power2.out'
				},
				orderIndex === 0 ? undefined : `<+${orderIndex * 0.09}`
			)
		})

		// Phase 4: hold the full composition so the viewer can read the spread.
		timeline.to({}, { duration: 1 })

		// Phase 5: send the photos out with a soft stagger to clear the next section.
		spreadOrder.forEach((photoIndex, orderIndex) => {
			timeline.to(
				photoElements[photoIndex],
				{
					x: `+=${photoIndex < 3 ? -8 : 8}vw`,
					y: '-120vh',
					rotate: `+=${photoIndex % 2 === 0 ? -8 : 8}`,
					scale: 1.04,
					duration: 1.15,
					ease: 'power2.in'
				},
				orderIndex === 0 ? '+=0.25' : `<+${orderIndex * 0.1}`
			)
		})

		ScrollTrigger.refresh()
	}, root.value)
})

onUnmounted(() => {
	ctx?.revert()
})
</script>
