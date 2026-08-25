import {
	prefersReducedMotion,
	registerGsapPlugins,
	ScrollSmoother,
	ScrollTrigger
} from './gsap'

export const PORTFOLIO_SCROLL_SMOOTHING = 0.3
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
	smoother = ScrollSmoother.create({
		wrapper: options.wrapper,
		content: options.content,
		smooth: shouldSmooth ? PORTFOLIO_SCROLL_SMOOTHING : 0,
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
