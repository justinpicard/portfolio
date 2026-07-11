import gsap from 'gsap'
import Flip from 'gsap/Flip'
import ScrollTrigger from 'gsap/ScrollTrigger'
import SplitText from 'gsap/SplitText'

let pluginsRegistered = false

export function registerGsapPlugins() {
	if (!pluginsRegistered) {
		gsap.registerPlugin(Flip, ScrollTrigger, SplitText)
		pluginsRegistered = true
	}

	return { gsap, Flip, ScrollTrigger, SplitText }
}

export { gsap, Flip, ScrollTrigger, SplitText }

export function prefersReducedMotion() {
	return typeof window !== 'undefined'
		&& window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
