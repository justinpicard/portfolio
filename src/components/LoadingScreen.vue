<template>
  <div class="intro-screen" ref="intro">
    <div class="intro-content">
      <span class="welcome-text" ref="message">Hey you! Welcome <span class="wave ml-0_5">👋🏼</span></span>
      
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import { gsap, SplitText, prefersReducedMotion, registerGsapPlugins } from '../utils/animations/gsap'
import { animationDurations, animationEases, animationStaggers } from '../utils/animations/presets'

const intro = ref(null)
const message = ref(null)
let tl
let split
let ctx

onMounted(async () => {
	await nextTick()
	registerGsapPlugins()

	document.fonts.ready.then(() => {
		ctx = gsap.context(() => {
			split = new SplitText(message.value, { type: 'chars' })
			const chars = split.chars

			// Wrap each char in a mask span
			chars.forEach(char => {
				const wrapper = document.createElement('span')
				wrapper.classList.add('char-mask')
				char.classList.add('masked-char')
				char.parentNode.insertBefore(wrapper, char)
				wrapper.appendChild(char)
			})

			if (prefersReducedMotion()) {
				gsap.set(intro.value, { yPercent: -100 })
				return
			}

			tl = gsap.timeline()

			// Animate letters coming in from below, one by one
			tl.fromTo(
				chars,
				{ y: '100%' },
				{
					y: '0%',
					duration: 0.5,
					stagger: animationStaggers.chars,
					ease: animationEases.out
				}
			)

			// Animate letters and wave emoji exiting by moving upward simultaneously
			tl.to(
				chars,
				{
					y: '-100%',
					duration: 0.4,
					ease: animationEases.inOut
				},
				'+=1.4'
			)

			tl.to(
				intro.value, 
				{ 
					yPercent: -100,
					duration: animationDurations.intro,
					ease: 'power4.inOut'
				}, 
				"-=0.4"
			)
		}, intro.value)
	})
})

onUnmounted(() => {
	ctx?.revert()
	tl?.kill()
	split?.revert()
})
</script>

<style scoped>
.char-mask {
	overflow: hidden;
	display: inline-block;
	position: relative;
}
.masked-char {
	display: inline-block;
	transform: translateY(100%);
	will-change: transform;
}
</style>
