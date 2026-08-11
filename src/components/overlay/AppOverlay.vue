<template>
	<Teleport to="body">
		<div
			v-if="isRendered"
			v-bind="$attrs"
			ref="overlay"
			class="app-overlay"
			role="dialog"
			aria-modal="true"
			:aria-labelledby="labelledBy"
		>
			<div
				ref="backdrop"
				class="app-overlay__backdrop"
				aria-hidden="true"
				@click="emit('close')"
			/>
			<button
				ref="closeButton"
				class="app-overlay__close"
				type="button"
				:aria-label="t('accessibility.closeOverlay')"
				@click="emit('close')"
			>
				{{ t('project.close') }}
			</button>
			<div
				ref="scrollContainer"
				class="app-overlay__panel"
			>
				<div
					ref="content"
					class="app-overlay__content"
				>
					<slot />
				</div>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap, prefersReducedMotion } from '../../utils/animations/gsap'
import { lockPageScroll } from '../../utils/dom/scrollLock'
import { overlayScrollContainerKey } from './overlayContext'

defineOptions({
	inheritAttrs: false
})

const props = defineProps<{
	open: boolean
	labelledBy?: string
	animateContent?: boolean
}>()

const emit = defineEmits<{
	close: []
	'after-close': []
}>()

const { t } = useI18n()
const isRendered = ref(false)
const overlay = ref<HTMLElement | null>(null)
const backdrop = ref<HTMLElement | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const content = ref<HTMLElement | null>(null)

let restoreScroll: (() => void) | undefined
let previouslyFocusedElement: HTMLElement | null = null
let pageRootHadInert = false
let overlayTimeline: gsap.core.Timeline | undefined
const PROJECT_SURFACE_CLOSE_DURATION = 0.9

provide(overlayScrollContainerKey, scrollContainer)

function getFocusableElements() {
	if (!overlay.value) return []

	return Array.from(overlay.value.querySelectorAll<HTMLElement>([
		'a[href]',
		'button:not([disabled])',
		'textarea:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'[tabindex]:not([tabindex="-1"])'
	].join(','))).filter((element) => (
		!element.hasAttribute('disabled')
		&& !element.getAttribute('aria-hidden')
		&& element.getClientRects().length > 0
	))
}

function setPageInert(isInert: boolean) {
	const pageRoot = document.getElementById('app')
	if (!pageRoot) return

	if (isInert) {
		pageRootHadInert = pageRoot.hasAttribute('inert')
		pageRoot.setAttribute('inert', '')
		return
	}

	if (!pageRootHadInert) {
		pageRoot.removeAttribute('inert')
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (!isRendered.value) return

	if (event.key === 'Escape') {
		event.preventDefault()
		emit('close')
		return
	}

	if (event.key !== 'Tab') return

	const focusableElements = getFocusableElements()
	if (focusableElements.length === 0) {
		event.preventDefault()
		closeButton.value?.focus({ preventScroll: true })
		return
	}

	const firstElement = focusableElements[0]
	const lastElement = focusableElements[focusableElements.length - 1]

	if (event.shiftKey && document.activeElement === firstElement) {
		event.preventDefault()
		lastElement.focus({ preventScroll: true })
		return
	}

	if (!event.shiftKey && document.activeElement === lastElement) {
		event.preventDefault()
		firstElement.focus({ preventScroll: true })
	}
}

function scrollToTop() {
	scrollContainer.value?.scrollTo({
		top: 0,
		behavior: prefersReducedMotion() ? 'auto' : 'smooth'
	})
}

function getAnimationTargets() {
	return [
		overlay.value,
		backdrop.value,
		scrollContainer.value,
		content.value
	].filter(Boolean) as HTMLElement[]
}

function usesProjectSurfaceAnimation() {
	return props.animateContent === false
}

async function openOverlay() {
	previouslyFocusedElement = document.activeElement instanceof HTMLElement
		? document.activeElement
		: null
	isRendered.value = true

	await nextTick()

	restoreScroll = lockPageScroll()
	setPageInert(true)
	document.addEventListener('keydown', handleKeydown)
	closeButton.value?.focus({ preventScroll: true })

	const targets = getAnimationTargets()
	if (prefersReducedMotion()) {
		gsap.set(overlay.value, {
			autoAlpha: 1
		})
		gsap.set(backdrop.value, {
			autoAlpha: 1,
			yPercent: 0
		})
		gsap.set([scrollContainer.value, content.value], {
			autoAlpha: 1,
			y: 0
		})
		return
	}

	overlayTimeline?.kill()
	gsap.killTweensOf(targets)
	gsap.set(overlay.value, {
		autoAlpha: 1
	})
	gsap.set(backdrop.value, {
		autoAlpha: usesProjectSurfaceAnimation() ? 0 : 1,
		yPercent: usesProjectSurfaceAnimation() ? 0 : 100
	})
	gsap.set(scrollContainer.value, {
		autoAlpha: 1,
		y: usesProjectSurfaceAnimation() ? 0 : 40
	})
	gsap.set(content.value, {
		autoAlpha: usesProjectSurfaceAnimation() ? 1 : 0,
		opacity: usesProjectSurfaceAnimation() ? 1 : 0
	})

	overlayTimeline = gsap.timeline()

	if (usesProjectSurfaceAnimation()) {
		overlayTimeline.to(backdrop.value, {
			autoAlpha: 1,
			duration: 0.01,
			ease: 'none'
		}, 0.95)
		return
	}

	overlayTimeline
		.fromTo(backdrop.value, {
			yPercent: 100
		}, {
			yPercent: 0,
			duration: 0.6,
			ease: 'power4.inOut'
		}, 0.12)
		.to(scrollContainer.value, {
			y: 0,
			duration: 0.45,
			ease: 'power3.out'
		}, 0.4)
		.to(content.value, {
			opacity: 1,
			autoAlpha: 1,
			duration: 0.45,
			ease: 'power3.out'
		}, 0.4)
}

function restoreFocus() {
	if (!previouslyFocusedElement?.isConnected) return

	previouslyFocusedElement.focus({ preventScroll: true })
	previouslyFocusedElement = null
}

function finishClose() {
	document.removeEventListener('keydown', handleKeydown)
	restoreScroll?.()
	restoreScroll = undefined
	setPageInert(false)
	isRendered.value = false
	restoreFocus()
	emit('after-close')
}

function closeOverlay() {
	const targets = getAnimationTargets()

	if (prefersReducedMotion()) {
		gsap.set(targets, {
			autoAlpha: 0,
			y: 0
		})
		gsap.set(backdrop.value, {
			yPercent: 0
		})
		finishClose()
		return
	}

	overlayTimeline?.kill()
	gsap.killTweensOf(targets)
	if (usesProjectSurfaceAnimation()) {
		gsap.set(backdrop.value, {
			autoAlpha: 0,
			yPercent: 0
		})
	}
	overlayTimeline = gsap.timeline({
		onComplete: finishClose
	})

	if (!usesProjectSurfaceAnimation()) {
		overlayTimeline
		.to(content.value, {
			opacity: 0,
			autoAlpha: 0,
			duration: 0.28,
			ease: 'power2.in'
		}, 0)
		.to(scrollContainer.value, {
			y: 24,
			duration: 0.28,
			ease: 'power2.in'
		}, 0)
		.to(backdrop.value, {
			yPercent: 100,
			duration: 0.8,
			ease: 'power3.inOut'
		}, 0.08)
		return
	}

	overlayTimeline.to({}, {
		duration: PROJECT_SURFACE_CLOSE_DURATION
	}, 0)
}

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen) {
			openOverlay()
			return
		}

		if (isRendered.value) {
			closeOverlay()
		}
	},
	{ immediate: true }
)

onUnmounted(() => {
	document.removeEventListener('keydown', handleKeydown)
	overlayTimeline?.kill()
	gsap.killTweensOf(getAnimationTargets())
	restoreScroll?.()
	setPageInert(false)
})

defineExpose({
	backdrop,
	scrollContainer,
	scrollToTop
})
</script>
