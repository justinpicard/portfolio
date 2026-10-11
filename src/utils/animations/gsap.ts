import gsap from 'gsap'
import Flip from 'gsap/Flip'
import ScrollSmoother from 'gsap/ScrollSmoother'
import ScrollTrigger from 'gsap/ScrollTrigger'
import SplitText from 'gsap/SplitText'

let pluginsRegistered = false

export function registerGsapPlugins() {
	if (!pluginsRegistered) {
		gsap.registerPlugin(Flip, ScrollSmoother, ScrollTrigger, SplitText)
		pluginsRegistered = true
	}

	return { gsap, Flip, ScrollSmoother, ScrollTrigger, SplitText }
}

export { gsap, Flip, ScrollSmoother, ScrollTrigger, SplitText }

export function prefersReducedMotion() {
	return typeof window !== 'undefined'
		&& window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function observeReducedMotion(onChange: (reduced: boolean) => void) {
	if (typeof window === 'undefined') return () => {}
	const query = window.matchMedia('(prefers-reduced-motion: reduce)')
	const handleChange = () => onChange(query.matches)
	query.addEventListener('change', handleChange)
	return () => query.removeEventListener('change', handleChange)
}
