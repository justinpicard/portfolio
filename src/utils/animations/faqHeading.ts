import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from './gsap'

const referenceTransforms = Object.freeze([
	{ xPercent: -368, yPercent: 89, z: 663.3, rotationX: -73, rotationY: 21, rotationZ: -4 },
	{ xPercent: -340, yPercent: 80, z: 643.5, rotationX: -70, rotationY: 18, rotationZ: 0 },
	{ xPercent: -312, yPercent: 89, z: 663.3, rotationX: -67, rotationY: 15, rotationZ: 4 },
	{ xPercent: -56, yPercent: -162, z: 782.1, rotationX: 72, rotationY: -4, rotationZ: -8 },
	{ xPercent: -28, yPercent: -171, z: 762.3, rotationX: 75, rotationY: -7, rotationZ: -4 },
	{ xPercent: 0, yPercent: -180, z: 742.5, rotationX: 78, rotationY: -10, rotationZ: 0 },
	{ xPercent: 28, yPercent: -171, z: 762.3, rotationX: 81, rotationY: -13, rotationZ: 4 },
	{ xPercent: 56, yPercent: -162, z: 782.1, rotationX: 84, rotationY: -16, rotationZ: 8 },
	{ xPercent: 298, yPercent: 93.5, z: 623.7, rotationX: -66.5, rotationY: -13.5, rotationZ: -6 },
	{ xPercent: 326, yPercent: 84.5, z: 603.9, rotationX: -63.5, rotationY: -16.5, rotationZ: -2 },
	{ xPercent: 354, yPercent: 84.5, z: 603.9, rotationX: -60.5, rotationY: -19.5, rotationZ: 2 },
	{ xPercent: 382, yPercent: 93.5, z: 623.7, rotationX: -57.5, rotationY: -22.5, rotationZ: 6 }
].map(Object.freeze))

const referenceWordRanges = [[0, 2], [3, 7], [8, 11]] as const
const neutral = { xPercent: 0, yPercent: 0, x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, opacity: 1 }

export function initFaqHeading(heading: HTMLElement) {
	if (prefersReducedMotion()) return () => {}

	const context = gsap.context(() => {}, heading)
	let split: SplitText | undefined
	let active = true
	const cleanup = () => {
		active = false
		context.revert()
		split?.revert()
	}

	try {
		context.add(() => {
			split = new SplitText(heading, {
				type: 'words,chars',
				aria: 'none',
				wordsClass: 'faq-section__heading-word',
				charsClass: 'faq-section__heading-char'
			})
			const chars = split.chars
			split.words.forEach((word, wordIndex) => {
				const wordChars = Array.from(word.children)
				const [first, last] = referenceWordRanges[Math.min(wordIndex, referenceWordRanges.length - 1)]!
				wordChars.forEach((char, index) => {
					// Fit each word to the prototype's character poses without changing their intensity.
					const referenceIndex = first + Math.round(index * (last - first) / Math.max(1, wordChars.length - 1))
					gsap.set(char, { ...neutral, ...referenceTransforms[referenceIndex], opacity: 0 })
				})
			})
			gsap.to(chars, {
				...neutral,
				duration: 1,
				ease: 'power2.out',
				stagger: 0.045,
				scrollTrigger: {
					trigger: heading,
					start: 'top 92%',
					scrub: false,
					once: true
				},
				onStart: () => { gsap.set(chars, { willChange: 'transform, opacity' }) },
				// Keep the split layout so native kerning cannot shift letters after playback.
				onComplete(this: gsap.core.Tween) {
					this.scrollTrigger?.kill(false, true)
					gsap.set(chars, { clearProps: 'willChange' })
				}
			})
		})
		void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh() })
	} catch (error) {
		cleanup()
		console.warn('FAQ heading animation could not initialize.', error)
	}

	return cleanup
}
