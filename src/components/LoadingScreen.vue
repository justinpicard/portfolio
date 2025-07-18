<template>
  <div class="intro-screen" ref="intro">
    <div class="intro-content">
      <span class="welcome-message" ref="message">Hey you! Welcome</span>
      <span class="wave ml-1">👋🏼</span>
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
			duration: 0.3,
			stagger: 0.03,
			ease: 'power2.in'
		}
	)

	// Fade in the wave emoji after text appears
	const wave = intro.value.querySelector('.wave')

	tl.to(
		wave, 
		{
			opacity: 1,
			duration: 0.3,
			ease: 'power1.inOut'
		}, 
	'>'
	)

  	// Animate letters exiting with fade out, one by one
	tl.to(
		chars,
		{
			opacity: 0,
			duration: 0.3,
			ease: 'power2.in'
		},
		'+=1.4' // start after a brief pause
	)

	// Fade out the wave emoji after text exits
	tl.to(
		wave,
		{
			opacity: 0,
			duration: 0.2,
			ease: 'power1.inOut'
		},
		'>'
	)

	tl.to(
		intro.value, 
		{ 
			yPercent: -100,
			duration: 1,
			ease: 'power4.inOut'
		}, 
		"-=0.7"
	)
})
</script>

<style scoped>
.intro-screen {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100vh;
	background: black;
	color: white;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}

.intro-content {
	overflow: hidden;
	position: relative;
	display: inline-block;
	line-height: 1.33;
	padding: 0 1rem;
}
.intro-content span {
	font-size: 3rem;
	letter-spacing: 2px;
}
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
.wave {
	opacity: 0;
	display: inline-block;
}
</style>