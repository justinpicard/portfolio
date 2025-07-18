<template>
  <div class="intro-screen" ref="intro">
    <div class="intro-content">
      <span class="welcome-text" ref="message">Hey you! Welcome <span class="wave ml-0_5">👋🏼</span></span>
      
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue'
import { gsap } from 'gsap'
import SplitText from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

const intro = ref(null)
const message = ref(null)

onMounted(async () => {
	await nextTick()

	document.fonts.ready.then(() => {
		const split = new SplitText(message.value, { type: 'chars' })
		const chars = split.chars

		// Wrap each char in a mask span
		chars.forEach(char => {
			const wrapper = document.createElement('span')
			wrapper.classList.add('char-mask')
			char.classList.add('masked-char')
			char.parentNode.insertBefore(wrapper, char)
			wrapper.appendChild(char)
		})

		const tl = gsap.timeline()

		// Animate letters coming in from below, one by one
		tl.fromTo(
			chars,
			{ y: '100%' },
			{
				y: '0%',
				duration: 0.5,
				stagger: 0.015,
				ease: 'power2.out'
			}
		)

		// Animate letters and wave emoji exiting by moving upward simultaneously
		tl.to(
			chars,
			{
				y: '-100%',
				duration: 0.4,
				ease: 'power2.inOut'
			},
			'+=1.4' // start after a brief pause
		)

		tl.to(
			intro.value, 
			{ 
				yPercent: -100,
				duration: 1,
				ease: 'power4.inOut'
			}, 
			"-=0.4"
		)
	})
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