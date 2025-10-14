<template>
	<section class="page-header">
	  <div class="limits"></div>
	  <div class="half"></div>
	  <div class="marquee-container">
		<div class="wrapperRollingText">
		  <div class="rollingText text">
			<span><span class="star">✦</span> {{ $route.meta.title }}</span>
			<span><span class="star">✦</span> {{ $route.meta.title }}</span>
			<span><span class="star">✦</span> {{ $route.meta.title }}</span>
		  </div>
		</div>
	  </div>
	</section>
  </template>
  
  <script setup>
  import { onMounted, ref } from 'vue'
  import { gsap } from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'
  import SplitType from 'split-type'
  
  gsap.registerPlugin(ScrollTrigger)
  
  onMounted(() => {
	document.fonts.ready.then(() => {
	  let direction = 1
  
	  const roll1 = roll('.rollingText', { duration: 200000 })
  
	  requestAnimationFrame(() => {
		const rollingTextSplit = new SplitType('.rollingText:not(.is-clone)', { types: 'words, chars' })
  
		gsap.from('.rollingText:not(.is-clone) .char', {
		  opacity: 0,
		  yPercent: 100,
		  stagger: 0.015,
		  duration: 0.7,
		  ease: 'power2.out',
		})
	  })
  
	  ScrollTrigger.create({
		onUpdate(self) {
		  if (self.direction !== direction) {
			direction *= -1
			gsap.to([roll1], { timeScale: direction, overwrite: true })
		  }
		}
	  })
  
	  function roll(targets, vars = {}, reverse = false) {
		vars.ease ||= 'none'
  
		const tl = gsap.timeline({
		  repeat: -1,
		  onReverseComplete() {
			this.totalTime(this.rawTime() + this.duration() * 10)
		  }
		})
  
		const elements = gsap.utils.toArray(targets)
		const clones = elements.map(el => {
		  const clone = el.cloneNode(true)
		  clone.classList.add('is-clone')
		  el.parentNode.appendChild(clone)
		  return clone
		})
  
		const positionClones = () => {
		  elements.forEach((el, i) => {
			gsap.set(clones[i], {
			  position: 'absolute',
			  overwrite: false,
			  top: el.offsetTop,
			  left: el.offsetLeft + (reverse ? -el.offsetWidth : el.offsetWidth)
			})
		  })
		}
  
		positionClones()
  
		elements.forEach((el, i) => {
		  tl.to([el, clones[i]], {
			xPercent: reverse ? 100 : -100,
			...vars
		  }, 0)
		})
  
		window.addEventListener('resize', () => {
		  const time = tl.totalTime()
		  tl.totalTime(0)
		  positionClones()
		  tl.totalTime(time)
		}) 
  
		return tl
	  }
	});
  })
  </script>
  
  <style scoped>
  .text {
	
	/*mask-image: linear-gradient(to top, black 60%, transparent 100%);
	-webkit-mask-image: linear-gradient(to top, black 60%, transparent 100%);*/
  }
  </style>