<template>
	<Teleport to="body">
		<div class="project-layer-prototype" role="dialog" aria-modal="true">
			<article
				ref="surface"
				class="project-layer-prototype__surface"
				:class="`project-card--${projectIndex + 1}`"
			>
				<div class="project-layer-prototype__card-face" aria-hidden="true">
					<span class="project-card__number">{{ formattedNumber }}</span>
				</div>

				<div ref="content" class="project-layer-prototype__content">
					<div class="project-layer-prototype__copy">
						<p class="eyebrow">Prototype project {{ formattedNumber }}</p>
						<h2>Project title</h2>
						<p class="project-layer-prototype__intro">
							A temporary introduction for evaluating the transition from exhibition card to project layer.
						</p>
						<p>
							This placeholder keeps the focus on object continuity, scale and the moment at which detail content becomes available.
						</p>
						<p>
							The final image treatment and case-study structure will be decided after the transition feels convincing.
						</p>
						<p>Autem eum itaque quos placeat quo et quam doloremque fugit quasi. Et ipsum quia perferendis explicabo omnis. Quia quo commodi nobis ut dicta exercitationem illo qui.</p>

						<p>Laudantium neque doloremque natus. Repellat eius assumenda expedita quis. Voluptas sunt repellat voluptatem dolorum.</p>
					</div>
				</div>

				<button
					ref="closeButton"
					class="project-layer-prototype__close"
					type="button"
					aria-label="Close project"
					@click="emit('close')"
				>
					Close
				</button>

				<div ref="scrims" class="project-layer-prototype__scrims" aria-hidden="true">
					<span class="project-layer-prototype__scrim project-layer-prototype__scrim--top" />
					<span class="project-layer-prototype__scrim project-layer-prototype__scrim--bottom" />
				</div>
			</article>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../../utils/animations/gsap'

type LayerOrigin = {
	top: number
	left: number
	width: number
	height: number
	borderRadius: string
}

const props = defineProps<{
	projectIndex: number
	origin: LayerOrigin
}>()

const emit = defineEmits<{
	close: []
	'header-contrast-change': [isActive: boolean]
}>()

const surface = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const scrims = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const formattedNumber = computed(() => String(props.projectIndex + 1).padStart(2, '0'))
const OPEN_DURATION = 1
const CLOSE_DURATION = 0.9
const OPEN_HEADER_CONTRAST_POSITION = 0.58
const CLOSE_HEADER_CONTRAST_POSITION = CLOSE_DURATION * (
	1 - OPEN_HEADER_CONTRAST_POSITION / OPEN_DURATION
)
let timeline: gsap.core.Timeline | undefined
let previousDocumentOverflow = ''

function handleKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		emit('close')
	}
}

function setInitialGeometry() {
	if (!surface.value) return

	gsap.set(surface.value, {
		top: props.origin.top,
		left: props.origin.left,
		width: props.origin.width,
		height: props.origin.height,
		borderRadius: props.origin.borderRadius
	})
}

async function animateOpen() {
	if (!surface.value || !content.value || !scrims.value) return

	setInitialGeometry()
	gsap.set(content.value, {
		autoAlpha: 0,
		y: 32
	})
	gsap.set(scrims.value, {
		autoAlpha: 0
	})

	if (prefersReducedMotion()) {
		gsap.set(surface.value, {
			inset: 0,
			width: '100vw',
			height: '100dvh',
			borderRadius: 0
		})
		gsap.set(content.value, {
			autoAlpha: 1,
			y: 0
		})
		gsap.set(scrims.value, {
			autoAlpha: 1
		})
		emit('header-contrast-change', true)
		closeButton.value?.focus()
		return
	}

	timeline = gsap.timeline({
		onComplete: () => {
			closeButton.value?.focus()
		}
	})

	timeline
		.to(surface.value, {
			top: 0,
			left: 0,
			width: '100vw',
			height: '100dvh',
			borderRadius: 0,
			duration: OPEN_DURATION,
			ease: 'power3.inOut'
		})
		.to(content.value, {
			autoAlpha: 1,
			y: 0,
			duration: 0.45,
			ease: 'power2.out'
		}, 0.58)
			.to(scrims.value, {
				autoAlpha: 1,
				duration: 0.3,
				ease: 'power2.out'
			}, 0.72)
			.call(() => {
				emit('header-contrast-change', true)
			}, [], OPEN_HEADER_CONTRAST_POSITION)
}

function animateClose(target: LayerOrigin) {
	return new Promise<void>((resolve) => {
		if (!surface.value || !content.value || !scrims.value || prefersReducedMotion()) {
			emit('header-contrast-change', false)
			resolve()
			return
		}

		timeline?.kill()
		timeline = gsap.timeline({
			onComplete: resolve
		})

		timeline
			.to(scrims.value, {
				autoAlpha: 0,
				duration: 0.18,
				ease: 'power2.in'
			})
			.to(content.value, {
				autoAlpha: 0,
				y: 20,
				duration: 0.22,
				ease: 'power2.in'
			}, 0)
			.to(surface.value, {
				top: target.top,
				left: target.left,
				width: target.width,
				height: target.height,
				borderRadius: target.borderRadius,
				duration: CLOSE_DURATION,
				ease: 'power3.inOut'
			}, 0)
			.call(() => {
				emit('header-contrast-change', false)
			}, [], CLOSE_HEADER_CONTRAST_POSITION)
	})
}

onMounted(async () => {
	previousDocumentOverflow = document.documentElement.style.overflow
	document.documentElement.style.overflow = 'hidden'
	window.addEventListener('keydown', handleKeydown)
	await nextTick()
	await animateOpen()
})

onBeforeUnmount(() => {
	timeline?.kill()
	emit('header-contrast-change', false)
	document.documentElement.style.overflow = previousDocumentOverflow
	window.removeEventListener('keydown', handleKeydown)
})

defineExpose({
	animateClose
})
</script>
