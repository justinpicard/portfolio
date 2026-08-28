import {
	prefersReducedMotion,
	registerGsapPlugins,
	ScrollSmoother,
	ScrollTrigger
} from './gsap'

export const PORTFOLIO_SCROLL_SMOOTHING = 0.5
const PORTFOLIO_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

let smoother: ScrollSmoother | undefined
let smoothingLockCount = 0

type PortfolioScrollSmootherOptions = {
	wrapper: HTMLElement
	content: HTMLElement
}

export function initPortfolioScrollSmoother(
	options: PortfolioScrollSmootherOptions
) {
	if (typeof window === 'undefined') return () => {}

	registerGsapPlugins()
	const shouldSmooth = window.matchMedia(PORTFOLIO_POINTER_QUERY).matches
		&& !prefersReducedMotion()

	// Native scrolling is both cheaper and more stable on touch devices. Creating
	// a zero-duration smoother still installs its scroll proxy and can force
	// ScrollTrigger pins onto a transformed scrolling layer.
	if (!shouldSmooth) {
		smoother = undefined
		ScrollTrigger.refresh()
		return () => {}
	}

	smoother = ScrollSmoother.create({
		wrapper: options.wrapper,
		content: options.content,
		smooth: PORTFOLIO_SCROLL_SMOOTHING,
		smoothTouch: 0,
		effects: false
	})
	if (smoothingLockCount > 0) smoother.paused(true)
	ScrollTrigger.refresh()

	return () => {
		smoother?.kill()
		smoother = undefined
		ScrollTrigger.refresh()
	}
}

export function getPortfolioScrollY() {
	return smoother?.scrollTop() ?? (typeof window !== 'undefined' ? window.scrollY : 0)
}

export function setPortfolioScrollY(scrollY: number) {
	if (smoother) {
		smoother.scrollTop(scrollY)
		return
	}

	if (typeof window !== 'undefined') window.scrollTo(0, scrollY)
}

export function lockPortfolioScrollSmoothing() {
	let isLocked = true
	smoothingLockCount += 1
	if (smoothingLockCount === 1) smoother?.paused(true)

	return () => {
		if (!isLocked) return

		isLocked = false
		smoothingLockCount = Math.max(0, smoothingLockCount - 1)
		if (smoothingLockCount === 0) smoother?.paused(false)
	}
}
