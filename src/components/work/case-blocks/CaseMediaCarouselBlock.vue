<template>
	<div
		ref="root"
		class="case-media-carousel"
		:class="`case-media-carousel--width-${block.width ?? 'content'}`"
		role="region"
		:aria-label="block.label"
		:aria-roledescription="t('mediaCarousel.carousel')"
	>
		<div
			class="case-media-carousel__viewport"
			:class="{ 'is-draggable': block.slides.length > 1, 'is-dragging': isDragging }"
			@pointerdown="startSwipe"
			@pointermove="moveSwipe"
			@pointerup="endSwipe"
			@pointercancel="cancelSwipe"
			@lostpointercapture="cancelSwipe"
			@dragstart="preventImageDrag"
		>
			<div class="case-media-carousel__window">
				<div
					ref="track"
					class="case-media-carousel__track"
					:style="{ '--case-carousel-offset': block.slides.length > 1 ? '-200%' : '0%' }"
				>
					<div
						v-for="(entry, position) in renderedSlides"
						:key="position"
						class="case-media-carousel__slide"
						:class="{ 'is-active': position === canonicalPosition }"
						role="group"
						:aria-roledescription="t('mediaCarousel.slide')"
						:aria-label="t('mediaCarousel.position', { current: entry.index + 1, total: block.slides.length })"
						:aria-hidden="position !== canonicalPosition ? true : undefined"
						:inert="position !== canonicalPosition"
					>
						<CaseMediaBlock
							v-if="entry.slide.type === 'media'"
							:block="{ ...entry.slide, width: block.width }"
							:sizes="caseImageSizes(block.width)"
						/>
						<CaseMediaGroupBlock v-else :block="{ ...entry.slide, width: block.width }" />
					</div>
				</div>
			</div>
		</div>
		<div class="case-media-carousel__navigation">
			<button
				type="button"
				class="btn btn-primary case-media-carousel__button"
				:aria-label="t('mediaCarousel.previous')"
				:disabled="block.slides.length < 2"
				@click="changeSlide(-1)"
			>
				<span class="case-media-carousel__button-icon" aria-hidden="true">←</span>
				<span class="btn-bg rounded-pill" aria-hidden="true"></span>
			</button>
			<span class="case-media-carousel__counter" role="status" aria-atomic="true">
				<span aria-hidden="true">
					<span class="case-media-carousel__counter-window" data-stagger-link-container>
						<Transition
							:css="false"
							@enter="enterCounter"
							@leave="leaveCounter"
							@enter-cancelled="cancelCounter"
							@leave-cancelled="cancelCounter"
						>
							<span :key="currentNumber" class="case-media-carousel__counter-number">
								<span v-for="(character, index) in currentNumber" :key="index" class="case-media-carousel__counter-character">{{ character }}</span>
							</span>
						</Transition>
					</span> / {{ totalNumber }}
				</span>
				<span class="sr-only">{{ t('mediaCarousel.position', { current: counterIndex + 1, total: block.slides.length }) }}</span>
			</span>
			<button
				type="button"
				class="btn btn-primary case-media-carousel__button"
				:aria-label="t('mediaCarousel.next')"
				:disabled="block.slides.length < 2"
				@click="changeSlide(1)"
			>
				<span class="case-media-carousel__button-icon" aria-hidden="true">→</span>
				<span class="btn-bg rounded-pill" aria-hidden="true"></span>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CaseMediaCarouselBlock } from '../../../content'
import { caseImageSizes } from '../../../utils/images/caseImageSizes'
import { carouselSwipeDirection, wrapCarouselIndex } from '../../../utils/media/carouselSwipe'
import { animationDurations, animationEases, staggerLinkPreset } from '../../../utils/animations/presets'
import { gsap, observeReducedMotion, prefersReducedMotion } from '../../../utils/animations/gsap'
import CaseMediaBlock from './CaseMediaBlock.vue'
import CaseMediaGroupBlock from './CaseMediaGroupBlock.vue'

const props = defineProps<{ block: CaseMediaCarouselBlock }>()
const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const counterIndex = ref(0)
const counterDuration = ref<number>(animationDurations.base)
const canonicalPosition = computed(() => props.block.slides.length > 1 ? activeIndex.value + 2 : 0)
const renderedSlides = computed(() => {
	const slides = props.block.slides
	if (slides.length === 1) return [{ slide: slides[0], index: 0 }]
	// Two guards on each side keep the neighbouring slide visible during wraparound.
	return Array.from({ length: slides.length + 4 }, (_, position) => {
		const index = wrapCarouselIndex(position - 2, slides.length)
		return { slide: slides[index]!, index }
	})
})
const currentNumber = computed(() => String(counterIndex.value + 1).padStart(2, '0'))
const totalNumber = computed(() => String(props.block.slides.length).padStart(2, '0'))
const isDragging = ref(false)
let swipe: {
	x: number
	y: number
	pointerId: number
	element: HTMLElement
	width: number
	offset: number
	mouse: boolean
	update: (offset: number) => void
} | undefined
let context: gsap.Context | undefined
let transitionTimeline: gsap.core.Timeline | undefined
let stopObservingMotion: (() => void) | undefined
let mounted = false

function animateCounter(element: Element, done: () => void, entering: boolean) {
	if (prefersReducedMotion() || !context) {
		done()
		return
	}
	const characters = element.querySelectorAll('.case-media-carousel__counter-character')
	context.add(() => {
		if (entering) gsap.set(characters, { yPercent: 100 })
		gsap.to(characters, {
			yPercent: entering ? 0 : -100,
			...staggerLinkPreset,
			duration: counterDuration.value,
			onComplete: done
		})
	})
}

function cancelCounter(element: Element) {
	gsap.killTweensOf(element.querySelectorAll('.case-media-carousel__counter-character'))
}

const enterCounter = (element: Element, done: () => void) => animateCounter(element, done, true)
const leaveCounter = (element: Element, done: () => void) => animateCounter(element, done, false)

function positionTrack() {
	context?.add(() => {
		gsap.set(track.value, { x: 0, xPercent: -100 * canonicalPosition.value })
		// Restore CSS opacity when a wraparound guard is replaced by its original.
		if (track.value) gsap.set(track.value.children, { clearProps: 'opacity' })
	})
}

async function settleSlide(index: number) {
	activeIndex.value = index
	await nextTick()
	if (!mounted) return
	positionTrack()
	transitionTimeline = undefined
}

function changeSlide(direction: number, fromDrag = false) {
	if ((!direction && !fromDrag) || props.block.slides.length < 2 || transitionTimeline || !mounted) return
	const index = wrapCarouselIndex(activeIndex.value + direction, props.block.slides.length)
	counterDuration.value = fromDrag ? animationDurations.fast : animationDurations.base
	counterIndex.value = index
	if (prefersReducedMotion()) {
		void settleSlide(index)
		return
	}
	const slides = track.value?.children
	if (!slides) return
	const motion = {
		duration: fromDrag ? animationDurations.fast : animationDurations.base,
		ease: animationEases.inOut
	}
	context?.add(() => {
		transitionTimeline = gsap.timeline({ onComplete: () => { void settleSlide(index) } })
			.to(track.value, { x: 0, xPercent: -100 * (canonicalPosition.value + direction), ...motion }, 0)
		for (let position = canonicalPosition.value - 1; position <= canonicalPosition.value + 1; position++) {
			transitionTimeline.to(slides[position]!, {
				opacity: position === canonicalPosition.value + direction ? 1 : 0.5,
				...motion
			}, 0)
		}
	})
}

function releaseSwipe() {
	const previous = swipe
	swipe = undefined
	isDragging.value = false
	if (previous?.element.hasPointerCapture(previous.pointerId)) {
		previous.element.releasePointerCapture(previous.pointerId)
	}
	return previous
}

function cancelSwipe() {
	const previous = releaseSwipe()
	if (previous?.offset) changeSlide(0, true)
}

function preventImageDrag(event: DragEvent) {
	if ((event.target as Element).closest('img')) event.preventDefault()
}

function startSwipe(event: PointerEvent) {
	cancelSwipe()
	if (!event.isPrimary || event.button !== 0 || props.block.slides.length < 2 || transitionTimeline
		|| (event.target as Element).closest('a, button')) return

	const element = event.currentTarget as HTMLElement
	const width = track.value?.getBoundingClientRect().width ?? 0
	if (!width || !track.value) return
	const setX = gsap.quickSetter(track.value, 'x', 'px')
	const setters = [-1, 0, 1].map(offset => (
		gsap.quickSetter(track.value!.children[canonicalPosition.value + offset]!, 'opacity')
	))
	swipe = {
		x: event.clientX, y: event.clientY, pointerId: event.pointerId, element,
		width, offset: 0, mouse: event.pointerType === 'mouse',
		update(offset) {
			setX(offset)
			const progress = Math.abs(offset) / width
			setters[0]!(offset > 0 ? 0.5 + progress * 0.5 : 0.5)
			setters[1]!(1 - progress * 0.5)
			setters[2]!(offset < 0 ? 0.5 + progress * 0.5 : 0.5)
		}
	}
	isDragging.value = event.pointerType === 'mouse'
	// Keep mouse release events on the viewport, even when the pointer leaves it.
	element.setPointerCapture(event.pointerId)
	if (event.pointerType === 'mouse') event.preventDefault()
}

function moveSwipe(event: PointerEvent) {
	if (!swipe || swipe.pointerId !== event.pointerId) return
	const x = Math.abs(event.clientX - swipe.x)
	const y = Math.abs(event.clientY - swipe.y)
	if (y > 10 && y > x) {
		cancelSwipe()
		return
	}
	swipe.offset = Math.max(-swipe.width, Math.min(swipe.width, event.clientX - swipe.x))
	swipe.update(swipe.offset)
}

function endSwipe(event: PointerEvent) {
	if (!swipe || swipe.pointerId !== event.pointerId) return
	const direction = carouselSwipeDirection(swipe, { x: event.clientX, y: event.clientY }, swipe.mouse ? 24 : 48)
	const moved = swipe.offset !== 0
	releaseSwipe()
	if (direction || moved) changeSlide(direction, true)
}

watch(() => props.block.slides, () => {
	transitionTimeline?.kill()
	transitionTimeline = undefined
	activeIndex.value = 0
	counterIndex.value = 0
	releaseSwipe()
	positionTrack()
}, { flush: 'post' })

onMounted(() => {
	mounted = true
	context = gsap.context(() => undefined, root.value!)
	positionTrack()
	stopObservingMotion = observeReducedMotion(reduced => {
		if (reduced) {
			transitionTimeline?.progress(1)
			root.value?.querySelectorAll('.case-media-carousel__counter-character').forEach(character => {
				gsap.getTweensOf(character).forEach(tween => tween.progress(1))
			})
		}
	})
})

onBeforeUnmount(() => {
	releaseSwipe()
	mounted = false
	stopObservingMotion?.()
	context?.revert()
})
</script>
