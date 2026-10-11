// TEMPORARY mobile scroll isolation; see src/config/mobileScrollDiagnostics.ts.
import { isScrollDiagnosticGroupEnabled } from '../../config/mobileScrollDiagnostics'
import {
	prefersReducedMotion,
	observeReducedMotion,
	registerGsapPlugins,
	ScrollSmoother,
	ScrollTrigger
} from './gsap'

export const PORTFOLIO_SCROLL_SMOOTHING = 0.5
const PORTFOLIO_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

let smoother: ScrollSmoother | undefined
let smoothingLockCount = 0
let refreshSmoothing: (() => void) | undefined

type PortfolioScrollSmootherOptions = {
	wrapper: HTMLElement
	content: HTMLElement
}

export function initPortfolioScrollSmoother(
	options: PortfolioScrollSmootherOptions
) {
	if (typeof window === 'undefined') return () => {}

	registerGsapPlugins()
	const pointerQuery = window.matchMedia(PORTFOLIO_POINTER_QUERY)
	function updateSmoothing() {
		if (smoothingLockCount > 0) return
		const shouldSmooth = isScrollDiagnosticGroupEnabled('sectionNavigation')
			&& pointerQuery.matches && !prefersReducedMotion()
		if (Boolean(smoother) === shouldSmooth) return
		const scrollY = getPortfolioScrollY()
		smoother?.kill()
		smoother = undefined
		// Native scrolling is cheaper and more stable on coarse pointers and under reduced motion.
		if (shouldSmooth) {
			smoother = ScrollSmoother.create({
				wrapper: options.wrapper,
				content: options.content,
				smooth: PORTFOLIO_SCROLL_SMOOTHING,
				smoothTouch: 0,
				effects: false,
				onFocusIn: (_self, event) => {
					const target = event.target
					// These focus destinations already have an explicit scroll owner.
					if (smoothingLockCount > 0 || (target instanceof HTMLElement
						&& (target.id === 'work' || target.id === 'main-content'))) return false
				}
			})
		}
		setPortfolioScrollY(scrollY)
		ScrollTrigger.refresh()
	}
	refreshSmoothing = updateSmoothing
	updateSmoothing()
	const stopObservingMotion = observeReducedMotion(updateSmoothing)
	pointerQuery.addEventListener('change', updateSmoothing)
	return () => {
		stopObservingMotion()
		pointerQuery.removeEventListener('change', updateSmoothing)
		refreshSmoothing = undefined
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
		const wasPaused = smoother.paused()
		// A paused smoother updates its scroll value without rendering the content
		// transform. Resume briefly so overlay close targets and pins stay aligned.
		if (wasPaused) smoother.paused(false)
		try {
			smoother.scrollTop(scrollY)
		} finally {
			if (wasPaused) smoother.paused(true)
		}
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
		if (smoothingLockCount === 0) {
			smoother?.paused(false)
			refreshSmoothing?.()
		}
	}
}
