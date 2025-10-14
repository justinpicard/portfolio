<template>
	<header class="site-header fixed-nav">
		<SiteNav />
	</header>
	<div ref="logoTrigger" class="logo-trigger"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import SiteNav from './SiteNav.vue'
//import gsap from 'gsap'
//import ScrollTrigger from 'gsap/ScrollTrigger'

//gsap.registerPlugin(ScrollTrigger)

//const logoTrigger = ref(null)

//onMounted(() => {
//  	// Set initial state
//	gsap.set(
//		'.site-logo',
//		{ 
//			y: -100,
//			opacity: 0 
//		}
//	)
//  ScrollTrigger.create({
//    trigger: logoTrigger.value,
//    start: 'top 20%',
//    onEnter: () => {
//      gsap.to('.site-logo', {
//        y: 0,
//        opacity: 1,
//        duration: 0.2,
//        ease: 'power2.out'
//      })
//    },
//    onLeaveBack: () => {
//      gsap.to('.site-logo', {
//        y: -100,
//        opacity: 0,
//        duration: 0.2,
//        ease: 'power2.in'
//      })
//    }
//  })
//})
</script>