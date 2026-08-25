import { gsap, prefersReducedMotion } from './gsap'

export function playUnavailableCardShake(
	target: HTMLElement,
	activeTimeline?: gsap.core.Timeline,
	onComplete?: () => void
) {
	activeTimeline?.kill()
	gsap.set(target, { x: 0 })

	if (prefersReducedMotion()) return undefined

	return gsap.timeline({ onComplete })
		.to(target, { x: -8, duration: 0.07, ease: 'power1.out' })
		.to(target, { x: 7, duration: 0.07, ease: 'power1.inOut' })
		.to(target, { x: -5, duration: 0.065, ease: 'power1.inOut' })
		.to(target, { x: 3, duration: 0.06, ease: 'power1.inOut' })
		.to(target, { x: 0, duration: 0.075, ease: 'power1.out' })
}

export function resetUnavailableCardShake(
	target: HTMLElement | null,
	activeTimeline?: gsap.core.Timeline
) {
	activeTimeline?.kill()
	if (target) gsap.set(target, { x: 0 })
}
