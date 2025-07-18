import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Loading screen animation with splitText-like intro
 */
export function playIntroAnimation({ introRef, textRef, waveRef }) {
	const timeline = gsap.timeline()

	// Animate letters in
	timeline.fromTo(
		textRef.querySelectorAll('.char'),
		{ y: '100%', opacity: 0 },
		{ y: '0%', opacity: 1, stagger: 0.04, duration: 0.8, ease: 'power2.out' }
	)

	// Animate wave in
	timeline.to(waveRef, { opacity: 1, duration: 0.3 }, '<0.4')

	// Animate whole screen up & fade out text + wave
	timeline.to(introRef, { yPercent: -100, ease: 'power2.inOut', duration: 1 }, '+=0.8')
	timeline.to([textRef, waveRef], { opacity: 0, duration: 0.3 }, '<')

	return timeline
}

/**
 * Seamless marquee animation
 */
export function setupMarquees() {
	let direction = 1

	const roll = (selector, vars = {}, reverse = false) => {
		vars.ease = vars.ease || 'none'
		const tl = gsap.timeline({
			repeat: -1,
			onReverseComplete() {
				this.totalTime(this.rawTime() + this.duration() * 10)
			}
		})

		const elements = gsap.utils.toArray(selector)
		const clones = elements.map(el => {
			const clone = el.cloneNode(true)
			el.parentNode.appendChild(clone)
			return clone
		})

		const positionClones = () => {
			elements.forEach((el, i) => {
				gsap.set(clones[i], {
					position: 'absolute',
					top: el.offsetTop,
					left: el.offsetLeft + (reverse ? -el.offsetWidth : el.offsetWidth)
				})
			})
		}

		positionClones()
		elements.forEach((el, i) => {
			tl.to([el, clones[i]], { xPercent: reverse ? 100 : -100, ...vars }, 0)
		})

		window.addEventListener('resize', () => {
			const time = tl.totalTime()
			tl.totalTime(0)
			positionClones()
			tl.totalTime(time)
		})

		return tl
	}

	const roll1 = roll('.rollingText', { duration: 10 })
	const roll2 = roll('.rollingText02', { duration: 10 }, true)

	ScrollTrigger.create({
		onUpdate(self) {
			if (self.direction !== direction) {
				direction *= -1
				gsap.to([roll1, roll2], { timeScale: direction, overwrite: true })
			}
		}
	})
}

/**
 * Helper to split text into spans with class 'char'
 */
export function splitText(el) {
	const text = el.textContent
	el.innerHTML = ''
	text.split('').forEach(char => {
		const span = document.createElement('span')
		span.className = 'char'
		span.textContent = char === ' ' ? '\u00A0' : char
		el.appendChild(span)
	})
}