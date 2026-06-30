import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import SplitText from 'gsap/SplitText'

let pluginsRegistered = false

export function registerGsapPlugins() {
	if (!pluginsRegistered) {
		gsap.registerPlugin(ScrollTrigger, SplitText)
		pluginsRegistered = true
	}

	return { gsap, ScrollTrigger, SplitText }
}

export { gsap, ScrollTrigger, SplitText }

export function prefersReducedMotion() {
	return typeof window !== 'undefined'
		&& window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
