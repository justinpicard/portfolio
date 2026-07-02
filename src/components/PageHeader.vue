<template>
	<section class="page-header" ref="root">
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
  import { onMounted, onUnmounted, ref } from 'vue'
  import { gsap, ScrollTrigger, registerGsapPlugins } from '../utils/animations/gsap'
  import SplitType from 'split-type'
  
  const root = ref(null)
  let ctx
  const splitInstances = []
  const cleanupRolls = []

  onMounted(() => {
	registerGsapPlugins()

	document.fonts.ready.then(() => {
	  ctx = gsap.context(() => {
		let direction = 1
  
		const roll1 = roll('.rollingText', { duration: 200000 })
  
		requestAnimationFrame(() => {
		  const rollingTextSplit = new SplitType(root.value.querySelectorAll('.rollingText:not(.is-clone)'), { types: 'words, chars' })
		  splitInstances.push(rollingTextSplit)
  
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
  
		  const elements = gsap.utils.toArray(targets, root.value)
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
  
		  let resizeCall
		  const reposition = () => {
			const time = tl.totalTime()
			tl.totalTime(0)
			positionClones()
			tl.totalTime(time)
		  }
		  const onResize = () => {
			resizeCall?.kill()
			resizeCall = gsap.delayedCall(0.15, reposition)
		  }
  
		  window.addEventListener('resize', onResize)
		  cleanupRolls.push(() => {
			window.removeEventListener('resize', onResize)
			resizeCall?.kill()
			tl.kill()
			clones.forEach(clone => clone.remove())
		  })

		  return tl
		}
	  }, root.value)
	});
  })

  onUnmounted(() => {
	ctx?.revert()
	cleanupRolls.forEach(cleanup => cleanup())
	splitInstances.forEach(split => split.revert())
  })
  </script>
  
