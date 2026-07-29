<template>
	<section id="about" class="section about" ref="root">
		<div class="container">
			<div class="row">
				<div class="about-text d-flex flex-column col-12 lg:col-8 lg:offset-2 mb-3" ref="aboutText">
					<p class="about-section__eyebrow eyebrow mb-8 text-secondary" ref="aboutEyebrow">About</p>
					<h2 class="about-section__title heading-font mb-8 md:mb-16" ref="aboutTitle">
						Good digital products have always fascinated me. Not just for how they look, but for how everything behind the interface comes together.
					</h2>
					<p>Hi <span class="wave">👋🏼</span> I’m Justin, a Digital Product Designer from the Netherlands. I’ve spent more than 10 years designing websites and digital products, and over time my curiosity naturally shifted from visual design towards product thinking, design systems and how products evolve as they grow.</p>
					<p>In my free time, I enjoy turning ideas into side projects that push me beyond my comfort zone. Some become products, others don’t. Every project teaches me something new,  which is what keeps me curious.
					</p>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { nextTick, ref, onMounted, onUnmounted } from 'vue'
import { gsap, SplitText, registerGsapPlugins } from '../../utils/animations/gsap'
import { animationDurations, animationEases, animationStaggers } from '../../utils/animations/presets'

const root = ref<HTMLElement | null>(null)
const aboutText = ref<HTMLElement | null>(null)
const aboutEyebrow = ref<HTMLParagraphElement | null>(null)
const aboutTitle = ref<HTMLHeadingElement | null>(null)
let eyebrowSplit: SplitText | undefined
let titleSplit: SplitText | undefined
let bodySplit: SplitText | undefined
let ctx: gsap.Context | undefined
let isMounted = false

function wrapSplitLines(lines: Element[]) {
	lines.forEach((line: Element) => {
		const wrapper = document.createElement('div')
		wrapper.classList.add('split-line-wrapper')
		line.parentNode?.insertBefore(wrapper, line)
		wrapper.appendChild(line)
	})
}

function waitForFonts() {
	return 'fonts' in document
		? document.fonts.ready
		: Promise.resolve()
}

function waitForFrame() {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve())
	})
}

async function initAboutReveal() {
	registerGsapPlugins()

	await waitForFonts()
	await nextTick()
	await waitForFrame()

	if (!isMounted) return

	ctx = gsap.context(() => {
		if (!aboutText.value || !aboutEyebrow.value || !aboutTitle.value) return

		const aboutBody = gsap.utils.toArray<HTMLParagraphElement>(
			aboutText.value.querySelectorAll('p:not(.about-section__eyebrow)')
		)

		eyebrowSplit = new SplitText(aboutEyebrow.value, { type: 'lines', linesClass: 'split-line' })
		titleSplit = new SplitText(aboutTitle.value, { type: 'lines', linesClass: 'split-line' })
		bodySplit = new SplitText(aboutBody, { type: 'lines', linesClass: 'split-line' })

		wrapSplitLines(eyebrowSplit.lines)
		wrapSplitLines(titleSplit.lines)
		wrapSplitLines(bodySplit.lines)

		const revealLines = [
			...eyebrowSplit.lines,
			...titleSplit.lines,
			...bodySplit.lines
		]

		const timeline = gsap.timeline({
			scrollTrigger: {
				trigger: root.value,
				start: 'top 50%',
				toggleActions: 'play none none none'
			}
		})

		timeline.fromTo(revealLines, {
			y: 90,
			opacity: 1
		}, {
			y: 0,
			opacity: 1,
			duration: animationDurations.reveal,
			stagger: animationStaggers.lines,
			ease: animationEases.strongOut
		})
	}, root.value ?? undefined)
}

onMounted(() => {
	isMounted = true
	initAboutReveal()
})

onUnmounted(() => {
	isMounted = false
	ctx?.revert()
	eyebrowSplit?.revert()
	titleSplit?.revert()
	bodySplit?.revert()
})
</script>
