<template>
	<section class="section home-photo-stack-section" ref="root">
		<div class="home-photo-stack-section__content">
			<div class="container">
				<div class="row">
					<div class="col-12">
						<h2 class="home-photo-stack-section__title huge-title" ref="titleRef">Life.</h2>
						<!--<p class="home-photo-stack-section__text">Enim quibusdam omnis aut occaecati quia possimus accusantium vel perferendis. Est architecto voluptatem eaque quae iure iste ex repellendus tempora et praesentium. Molestias ratione fugiat quae culpa dolores omnis in magni cupiditate facere reprehenderit.
						</p>-->
					</div>
				</div>
			</div>
		</div>
		<div class="home-photo-stack-section__stage" ref="stack">
			<div
				v-for="photo in photos"
				:key="photo.src"
				ref="photoCardRefs"
				:class="[
					'home-photo-stack-section__card',
					`home-photo-stack-section__card--${photo.orientation}`
				]"
			>
				<img
					ref="photoImageRefs"
					class="home-photo-stack-section__photo"
					:src="photo.src"
					:alt="photo.alt"
					loading="lazy"
					decoding="async"
				>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap, ScrollTrigger, prefersReducedMotion, registerGsapPlugins } from '../../utils/animations/gsap'

type Photo = {
	src: string
	alt: string
	orientation: 'portrait' | 'landscape'
}

const photos: Photo[] = [
	{ src: '/images/photos/justin-picard.jpg', alt: 'Justin Picard portrait', orientation: 'landscape' },
	{ src: '/images/photos/justin-picard_architecture-berlin.jpg', alt: 'Architectuur Berlijn', orientation: 'portrait' },
	{ src: '/images/photos/justin-picard_new-york-selfie.jpg', alt: 'Selfie in New York', orientation: 'portrait' },
	{ src: '/images/photos/justin-picard_bassist.jpg', alt: 'Bassist', orientation: 'landscape' },
	{ src: '/images/photos/justin-picard_architecture-valencia.jpg', alt: 'Architectuur Valencia', orientation: 'portrait' },
	{ src: '/images/photos/justin-picard_madison-square-garden.jpg', alt: 'Madison Square Garden', orientation: 'landscape' },
	{ src: '/images/photos/justin-picard_new-york-art.jpg', alt: 'Kunst in New York', orientation: 'landscape' },
	{ src: '/images/photos/justin-picard_new-york-empire-state-building.jpg', alt: 'Empire State Building in New York', orientation: 'portrait' },
	{ src: '/images/photos/justin-picard_pintxos-bilbao.jpg', alt: 'Pintxos in Bilbao', orientation: 'portrait' },
	{ src: '/images/photos/justin-picard_cats.jpg', alt: 'Katten', orientation: 'portrait' },
	{ src: '/images/photos/justin-picard_graffiti.jpg', alt: 'Graffiti', orientation: 'portrait' },
	{ src: '/images/photos/justin-picard_oktoberfest.jpg', alt: 'Oktoberfest', orientation: 'portrait' },
	{ src: '/images/photos/justin-picard_paris.jpg', alt: 'Parijs', orientation: 'portrait' }
]

const stackOffsets = [
	{ x: -8, y: 4, rotate: -6 },
	{ x: 6, y: -2, rotate: 4 },
	{ x: -4, y: 8, rotate: -3 },
	{ x: 9, y: 3, rotate: 5 },
	{ x: -6, y: -5, rotate: -4 },
	{ x: 3, y: 6, rotate: 2 },
	{ x: -10, y: -1, rotate: -5 },
	{ x: 8, y: 8, rotate: 6 },
	{ x: 0, y: -8, rotate: -2 },
	{ x: -12, y: 6, rotate: 5 },
	{ x: 11, y: -6, rotate: -7 },
	{ x: -3, y: -10, rotate: 3 },
	{ x: 5, y: 10, rotate: -4 }
]

const spreadOffsets = [
	{ x: '-34vw', y: '-14vh', rotate: -14, scale: 1 },
	{ x: '-25vw', y: '18vh', rotate: -9, scale: 0.96 }, // Berlin
	{ x: '-2vw', y: '-22vh', rotate: -5, scale: 1.04 },
	{ x: '18vw', y: '16vh', rotate: 13, scale: 0.98 },
	{ x: '27vw', y: '-16vh', rotate: -9, scale: 1.02 }, // Valencia
	{ x: '1vw', y: '29vh', rotate: -2, scale: 0.97 }, 	// Madison square
	{ x: '-41vw', y: '25vh', rotate: 10, scale: 0.95 }, // NY art
	{ x: '40vw', y: '30vh', rotate: -10, scale: 0.94 }, // Kiss
	{ x: '38vw', y: '-26vh', rotate: 8, scale: 0.96 },
	{ x: '-42vw', y: '-30vh', rotate: -8, scale: 0.94 },
	{ x: '-15vw', y: '34vh', rotate: 12, scale: 0.93 },
	{ x: '15vw', y: '-34vh', rotate: -12, scale: 0.93 },
	{ x: '42vw', y: '4vh', rotate: 11, scale: 0.94 }
]

const spreadOrder = [0, 2, 4, 6, 9, 1, 3, 5, 10, 8, 11, 7, 12]
const root = ref<HTMLElement | null>(null)
const stack = ref<HTMLElement | null>(null)
const photoCardRefs = ref<HTMLElement[]>([])
const photoImageRefs = ref<HTMLImageElement[]>([])
let ctx: gsap.Context | undefined
let hoverCleanups: Array<() => void> = []

type PhotoMotion = {
	x: number
	y: number
	targetX: number
	targetY: number
	velocity: {
		x: number
		y: number
	}
}

const ACTIVE_FOLLOW_X = 68
const ACTIVE_FOLLOW_Y = 52
const ACTIVE_SPRING_STRENGTH = 0.11
const ACTIVE_RELEASE_STRENGTH = 0.014
const NEIGHBOUR_PUSH_STRENGTH = 2.4
const NEIGHBOUR_PUSH_RADIUS = 0.62
const NEIGHBOUR_FALLOFF_POWER = 2.2
const VELOCITY_DAMPING = 0.78
const NEIGHBOUR_DAMPING = 0.92
const MOTION_MULTIPLIER = 1
const ROTATION_MULTIPLIER = 0.045
const POINTER_SMOOTHING = 0.18
const POINTER_DECAY = 0.86

onMounted(() => {
	registerGsapPlugins()

	if (!root.value || !stack.value) return

	ctx = gsap.context(() => {
		const photoCards = photoCardRefs.value
		const photoImages = photoImageRefs.value
		const shouldReduceMotion = prefersReducedMotion()

		gsap.set(stack.value, {
			y: '70vh',
			scale: 0.92
		})

		gsap.set(photoCards, {
			x: (index: number) => stackOffsets[index].x,
			y: (index: number) => stackOffsets[index].y,
			rotate: (index: number) => stackOffsets[index].rotate,
			autoAlpha: 1,
			zIndex: (index: number) => photoCards.length - index
		})

		gsap.set(photoImages, {
			transformPerspective: 600,
			transformOrigin: 'center center'
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

		// Phase 0: keep the intro text in focus before the photo stack enters.
		timeline.to({}, { duration: 2 })

		// Phase 1: bring the stacked photos up into the center of the pinned viewport.
		timeline.to(stack.value, {
			y: 0,
			scale: 1,
			ease: 'power3.out',
			duration: 3.6
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
				photoCards[photoIndex],
				{
					x: spreadOffsets[photoIndex].x,
					y: spreadOffsets[photoIndex].y,
					rotate: spreadOffsets[photoIndex].rotate,
					scale: spreadOffsets[photoIndex].scale,
					duration: 3.0,
					ease: 'power4.out'
				},
				orderIndex === 0 ? undefined : `<+${orderIndex * 0.09}`
			)
		})

		// Phase 4: hold the full composition so the viewer can read the spread.
		timeline.to({}, { duration: 1 })

		// Phase 5: send the photos out with a soft stagger to clear the next section.
		spreadOrder.forEach((photoIndex, orderIndex) => {
			timeline.to(
				photoCards[photoIndex],
				{
					x: `+=${photoIndex < 3 ? -8 : 8}vw`,
					y: '-120vh',
					rotate: `+=${photoIndex % 2 === 0 ? -8 : 8}`,
					scale: 1.04,
					duration: 2,
					ease: 'power2.in'
				},
				orderIndex === 0 ? '+=0.25' : `<+${orderIndex * 0.1}`
			)
		})

		if (!shouldReduceMotion) {
			const pointer = {
				activeIndex: -1,
				x: 0,
				y: 0,
				lastX: 0,
				lastY: 0,
				targetMovementX: 0,
				targetMovementY: 0,
				movementX: 0,
				movementY: 0,
				isInside: false
			}

			const motions: PhotoMotion[] = photoImages.map(() => ({
				x: 0,
				y: 0,
				targetX: 0,
				targetY: 0,
				velocity: {
					x: 0,
					y: 0
				}
			}))

			const createPointerEnterHandler = (index: number) => (event: PointerEvent) => {
				pointer.activeIndex = index
				pointer.x = event.clientX
				pointer.y = event.clientY
				pointer.lastX = event.clientX
				pointer.lastY = event.clientY
				pointer.targetMovementX = 0
				pointer.targetMovementY = 0
				pointer.movementX = 0
				pointer.movementY = 0
				pointer.isInside = true
			}

			const onPointerMove = (event: PointerEvent) => {
				if (!pointer.isInside) return

				pointer.x = event.clientX
				pointer.y = event.clientY
				pointer.targetMovementX = event.clientX - pointer.lastX
				pointer.targetMovementY = event.clientY - pointer.lastY
				pointer.lastX = event.clientX
				pointer.lastY = event.clientY
			}

			const onPointerLeave = () => {
				pointer.activeIndex = -1
				pointer.targetMovementX = 0
				pointer.targetMovementY = 0
				pointer.isInside = false
			}

			const updatePhotoMotion = () => {
				pointer.movementX += (pointer.targetMovementX - pointer.movementX) * POINTER_SMOOTHING
				pointer.movementY += (pointer.targetMovementY - pointer.movementY) * POINTER_SMOOTHING
				pointer.targetMovementX *= POINTER_DECAY
				pointer.targetMovementY *= POINTER_DECAY

				photoImages.forEach((image, index) => {
					const motion = motions[index]
					const card = photoCards[index]

					const rect = card.getBoundingClientRect()
					const centerX = rect.left + rect.width / 2
					const centerY = rect.top + rect.height / 2
					const distanceX = (centerX - pointer.x) / window.innerWidth * 2
					const distanceY = (centerY - pointer.y) / window.innerHeight * 2
					const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
					const normalX = distance === 0 ? 0 : distanceX / distance
					const normalY = distance === 0 ? 0 : distanceY / distance
					const pushFalloff = Math.pow(Math.max(0, 1 - distance / NEIGHBOUR_PUSH_RADIUS), NEIGHBOUR_FALLOFF_POWER)

					if (pointer.isInside && index === pointer.activeIndex) {
						const localX = (pointer.x - centerX) / rect.width
						const localY = (pointer.y - centerY) / rect.height

						motion.targetX = gsap.utils.clamp(-ACTIVE_FOLLOW_X, ACTIVE_FOLLOW_X, localX * ACTIVE_FOLLOW_X * 2)
						motion.targetY = gsap.utils.clamp(-ACTIVE_FOLLOW_Y, ACTIVE_FOLLOW_Y, localY * ACTIVE_FOLLOW_Y * 2)
						motion.velocity.x *= VELOCITY_DAMPING
						motion.velocity.y *= VELOCITY_DAMPING
						motion.velocity.x += (motion.targetX - motion.x) * ACTIVE_SPRING_STRENGTH
						motion.velocity.y += (motion.targetY - motion.y) * ACTIVE_SPRING_STRENGTH
					} else {
						motion.targetX = 0
						motion.targetY = 0
						motion.velocity.x *= NEIGHBOUR_DAMPING
						motion.velocity.y *= NEIGHBOUR_DAMPING
						motion.velocity.x += (0 - motion.x) * ACTIVE_RELEASE_STRENGTH
						motion.velocity.y += (0 - motion.y) * ACTIVE_RELEASE_STRENGTH

						if (pointer.isInside && pushFalloff > 0) {
							motion.velocity.x += normalX * NEIGHBOUR_PUSH_STRENGTH * pushFalloff
							motion.velocity.y += normalY * NEIGHBOUR_PUSH_STRENGTH * pushFalloff
						}
					}

					motion.x += motion.velocity.x
					motion.y += motion.velocity.y

					gsap.set(image, {
						x: motion.x * MOTION_MULTIPLIER,
						y: motion.y * MOTION_MULTIPLIER,
						rotate: (motion.velocity.x - motion.velocity.y) * ROTATION_MULTIPLIER
					})
				})
			}

			const cardCleanups = photoCards.map((card, index) => {
				const onPointerEnter = createPointerEnterHandler(index)

				card.addEventListener('pointerenter', onPointerEnter)
				card.addEventListener('pointerleave', onPointerLeave)

				return () => {
					card.removeEventListener('pointerenter', onPointerEnter)
					card.removeEventListener('pointerleave', onPointerLeave)
				}
			})

			root.value?.addEventListener('pointermove', onPointerMove)
			root.value?.addEventListener('pointerleave', onPointerLeave)
			gsap.ticker.add(updatePhotoMotion)

			hoverCleanups = [() => {
				cardCleanups.forEach(cleanup => cleanup())
				root.value?.removeEventListener('pointermove', onPointerMove)
				root.value?.removeEventListener('pointerleave', onPointerLeave)
				gsap.ticker.remove(updatePhotoMotion)
			}]
		}

		ScrollTrigger.refresh()
	}, root.value)
})

onUnmounted(() => {
	hoverCleanups.forEach(cleanup => cleanup())
	hoverCleanups = []
	ctx?.revert()
})
</script>
