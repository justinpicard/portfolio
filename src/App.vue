<template>
	<main class="main">
    <SiteNav/>
		<div class="main-wrap" ref="loco" data-scroll-container>
        <router-view></router-view>
		</div>
		<AppFooter/>
	</main>
</template>

<!--<script>-->
<!--import LocomotiveScroll from "locomotive-scroll";-->

<!--export default {-->
<!--  methods: {-->
<!--    setLocomotiveScroll() {-->
<!--      new LocomotiveScroll({-->
<!--        el: this.$refs.loco,-->
<!--        smooth: true,-->
<!--      });-->
<!--    },-->
<!--  },-->
<!--  mounted() {-->
<!--    this.setLocomotiveScroll();-->
<!--  },-->
<!--};-->
<!--</script>-->

<script setup>
import AppFooter from "./components/AppFooter.vue";
import SiteNav from "./components/SiteNav.vue";
import LoadingScreen from "./components/LoadingScreen.vue";

import { gsap } from 'gsap'
import SplitType from 'split-type'
import { onMounted } from "vue";

// onMounted(() => {
//   const ourText = new SplitType('.marquee', {types: 'chars'})
//   const chars = ourText.chars
//   let tl = gsap.timeline();
//
//   gsap.defaults({
//     duration: 1,
//     ease: 'power3.inOut',
//   });
//
//   const enterTextAnimation = chars => {
//     const tl = gsap.timeline();
//
//     tl.fromTo(
//         chars,
//         {
//           yPercent: '100',
//           opacity: 0,
//         },
//         {
//           yPercent: '0',
//           opacity: 1,
//           stagger: 0.014,
//         }
//     );
//
//     return tl;
//   };
//
// });
</script>