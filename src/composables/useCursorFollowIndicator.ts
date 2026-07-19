import type { Ref } from 'vue'
import { gsap } from '../utils/animations/gsap'

type CursorFollowIndicatorOptions = {
	triggerElement: Ref<HTMLElement | null>
	wrapperElement: Ref<HTMLElement | null>
	visualElement: Ref<HTMLElement | null>
}

const POINTER_QUERY = '(hover: hover) and (pointer: fine)'
const MAX_OFFSET = 64
const VELOCITY_MULTIPLIER = 0.26
const OFFSET_SMOOTHING = 0.18
const OFFSET_DECAY = 0.82
const ENTER_DURATION = 0.35
const ENTER_EASE = 'power2.out'
const ENTER_SCALE = 1
const LEAVE_DURATION = 0.25
const LEAVE_EASE = 'power2.out'
const LEAVE_SCALE = 0.2

export function useCursorFollowIndicator(options: CursorFollowIndicatorOptions) {
	let isInitialized = false
	let isEnabled = false
	let isTickerActive = false
	let pointerX = 0
	let pointerY = 0
	let previousPointerX = 0
	let previousPointerY = 0
	let targetOffsetX = 0
	let targetOffsetY = 0
	let offsetX = 0
	let offsetY = 0
	let centerOffsetX = 0
	let centerOffsetY = 0
	let latestPointerX: number | undefined
	let latestPointerY: number | undefined
	let isRevealPending = false
	let isVisible = false
	let setX: gsap.QuickSetter | undefined
	let setY: gsap.QuickSetter | undefined

	function hasFinePointer() {
		return typeof window !== 'undefined'
			&& window.matchMedia(POINTER_QUERY).matches
	}

	function getElements() {
		const triggerElement = options.triggerElement.value
		const wrapperElement = options.wrapperElement.value
		const visualElement = options.visualElement.value

		if (!triggerElement || !wrapperElement || !visualElement) return

		return {
			triggerElement,
			wrapperElement,
			visualElement
		}
	}

	function setIndicatorPosition() {
		setX?.(pointerX + offsetX - centerOffsetX)
		setY?.(pointerY + offsetY - centerOffsetY)
	}

	function getCoordinateOrigin() {
		const elements = getElements()
		if (!elements) {
			return {
				x: 0,
				y: 0
			}
		}

		if (window.getComputedStyle(elements.wrapperElement).position === 'fixed') {
			return {
				x: 0,
				y: 0
			}
		}

		const triggerBounds = elements.triggerElement.getBoundingClientRect()
		return {
			x: triggerBounds.left,
			y: triggerBounds.top
		}
	}

	function getPointerPosition(clientX: number, clientY: number) {
		const origin = getCoordinateOrigin()
		return {
			x: clientX - origin.x,
			y: clientY - origin.y
		}
	}

	function calibrateCenterOffset() {
		const elements = getElements()
		if (!elements) return

		const origin = getCoordinateOrigin()
		const visualBounds = elements.visualElement.getBoundingClientRect()
		centerOffsetX -= pointerX - (visualBounds.left - origin.x + visualBounds.width / 2)
		centerOffsetY -= pointerY - (visualBounds.top - origin.y + visualBounds.height / 2)
	}

	function resetPosition(clientX: number, clientY: number) {
		const elements = getElements()
		if (!elements) return

		const pointerPosition = getPointerPosition(clientX, clientY)
		centerOffsetX = elements.visualElement.offsetWidth / 2
		centerOffsetY = elements.visualElement.offsetHeight / 2
		pointerX = pointerPosition.x
		pointerY = pointerPosition.y
		previousPointerX = pointerX
		previousPointerY = pointerY
		targetOffsetX = 0
		targetOffsetY = 0
		offsetX = 0
		offsetY = 0
		setIndicatorPosition()
		calibrateCenterOffset()
		setIndicatorPosition()
	}

	function updatePosition() {
		offsetX += (targetOffsetX - offsetX) * OFFSET_SMOOTHING
		offsetY += (targetOffsetY - offsetY) * OFFSET_SMOOTHING
		targetOffsetX *= OFFSET_DECAY
		targetOffsetY *= OFFSET_DECAY
		setIndicatorPosition()
	}

	function startTicker() {
		if (isTickerActive) return

		gsap.ticker.add(updatePosition)
		isTickerActive = true
	}

	function stopTicker() {
		if (!isTickerActive) return

		gsap.ticker.remove(updatePosition)
		isTickerActive = false
	}

	function isPointerInsideTrigger(clientX: number, clientY: number) {
		const elements = getElements()
		if (!elements) return false

		const bounds = elements.triggerElement.getBoundingClientRect()
		return clientX >= bounds.left
			&& clientX <= bounds.right
			&& clientY >= bounds.top
			&& clientY <= bounds.bottom
	}

	function showIndicator(clientX: number, clientY: number) {
		const elements = getElements()
		if (!elements) return

		isRevealPending = false
		isVisible = true
		resetPosition(clientX, clientY)
		startTicker()

		gsap.to(elements.visualElement, {
			autoAlpha: 1,
			scale: ENTER_SCALE,
			duration: ENTER_DURATION,
			ease: ENTER_EASE
		})
	}

	function handleTrackingPointerMove(event: PointerEvent) {
		latestPointerX = event.clientX
		latestPointerY = event.clientY
	}

	function handlePointerEnter(event: PointerEvent) {
		latestPointerX = event.clientX
		latestPointerY = event.clientY
		showIndicator(event.clientX, event.clientY)
	}

	function handlePointerMove(event: PointerEvent) {
		latestPointerX = event.clientX
		latestPointerY = event.clientY

		if (isRevealPending && isPointerInsideTrigger(event.clientX, event.clientY)) {
			showIndicator(event.clientX, event.clientY)
			return
		}

		if (!isVisible) return

		const pointerPosition = getPointerPosition(event.clientX, event.clientY)
		const deltaX = pointerPosition.x - pointerX
		const deltaY = pointerPosition.y - pointerY
		previousPointerX = pointerX
		previousPointerY = pointerY
		pointerX = pointerPosition.x
		pointerY = pointerPosition.y
		targetOffsetX = gsap.utils.clamp(-MAX_OFFSET, MAX_OFFSET, -deltaX * VELOCITY_MULTIPLIER)
		targetOffsetY = gsap.utils.clamp(-MAX_OFFSET, MAX_OFFSET, -deltaY * VELOCITY_MULTIPLIER)
	}

	function handlePointerLeave() {
		const elements = getElements()
		if (!elements) return

		isVisible = false
		stopTicker()
		targetOffsetX = 0
		targetOffsetY = 0
		offsetX = 0
		offsetY = 0

		gsap.to(elements.visualElement, {
			autoAlpha: 0,
			scale: LEAVE_SCALE,
			duration: LEAVE_DURATION,
			ease: LEAVE_EASE
		})
	}

	function init() {
		if (isInitialized || !hasFinePointer()) return

		const elements = getElements()
		if (!elements) return

		setX = gsap.quickSetter(elements.wrapperElement, 'x', 'px')
		setY = gsap.quickSetter(elements.wrapperElement, 'y', 'px')
		gsap.set(elements.visualElement, {
			autoAlpha: 0,
			scale: LEAVE_SCALE
		})
		window.addEventListener('pointermove', handleTrackingPointerMove)
		elements.triggerElement.addEventListener('pointerenter', handleTrackingPointerMove)
		elements.triggerElement.addEventListener('pointermove', handleTrackingPointerMove)
		isInitialized = true
	}

	function enable() {
		init()
		if (isEnabled || !isInitialized) return

		const elements = getElements()
		if (!elements) return

		isEnabled = true
		elements.triggerElement.addEventListener('pointerenter', handlePointerEnter)
		elements.triggerElement.addEventListener('pointermove', handlePointerMove)
		elements.triggerElement.addEventListener('pointerleave', handlePointerLeave)

		if (
			latestPointerX !== undefined
			&& latestPointerY !== undefined
			&& isPointerInsideTrigger(latestPointerX, latestPointerY)
		) {
			showIndicator(latestPointerX, latestPointerY)
			return
		}

		isRevealPending = true
	}

	function disable() {
		if (!isEnabled) return

		const elements = getElements()
		if (elements) {
			elements.triggerElement.removeEventListener('pointerenter', handlePointerEnter)
			elements.triggerElement.removeEventListener('pointermove', handlePointerMove)
			elements.triggerElement.removeEventListener('pointerleave', handlePointerLeave)
		}

		isEnabled = false
		isRevealPending = false
		handlePointerLeave()
	}

	function cleanup() {
		const elements = getElements()

		if (elements) {
			elements.triggerElement.removeEventListener('pointerenter', handleTrackingPointerMove)
			elements.triggerElement.removeEventListener('pointermove', handleTrackingPointerMove)
			elements.triggerElement.removeEventListener('pointerenter', handlePointerEnter)
			elements.triggerElement.removeEventListener('pointermove', handlePointerMove)
			elements.triggerElement.removeEventListener('pointerleave', handlePointerLeave)
			gsap.killTweensOf([elements.wrapperElement, elements.visualElement])
		}

		window.removeEventListener('pointermove', handleTrackingPointerMove)
		stopTicker()
		isInitialized = false
		isEnabled = false
		isRevealPending = false
		isVisible = false
	}

	init()

	return {
		enable,
		disable,
		cleanup
	}
}
