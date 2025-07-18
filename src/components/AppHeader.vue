<template>
	<header class="site-header fixed-nav" :class="{ 'scrolled': hasScrolled }">
    <!--<router-link :to="{ name: 'home' }" class="site-logo">
      <figure class="avatar">
        <img :src="getImageUrl('justin-picard-avatar','jpg')" alt="">
      </figure>
      <span class="site-title">
        <h1>Justin Picard</h1>
        <h2>Digital Product Designer</h2>
      </span>
    </router-link>-->
	<SiteNav />
	</header>
	<div ref="logoTrigger" class="logo-trigger"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import SiteNav from './SiteNav.vue'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

function getImageUrl(name, ext) {
	return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}

const logoTrigger = ref(null)
const hasScrolled = ref(false)

function handleScroll() {
	hasScrolled.value = window.scrollY > 10
}

onMounted(() => {
	window.addEventListener('scroll', handleScroll)

  // Set initial state
	gsap.set(
		'.site-logo',
		{ 
			y: -100,
			opacity: 0 
		}
	)
  ScrollTrigger.create({
    trigger: logoTrigger.value,
    start: 'top 20%',
    onEnter: () => {
      gsap.to('.site-logo', {
        y: 0,
        opacity: 1,
        duration: 0.2,
        ease: 'power2.out'
      })
    },
    onLeaveBack: () => {
      gsap.to('.site-logo', {
        y: -100,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in'
      })
    }
  })
})

onUnmounted(() => {
	window.removeEventListener('scroll', handleScroll)
})
</script>