<template>
	<SectionHomeHeader/>
  <SectionHomeAbout/>
  <SectionHomeProjects/>
</template>

<script setup>
import { gsap } from 'gsap'
import SplitType from 'split-type'
import { onMounted } from "vue";
import SectionHomeProjects from "../components/SectionHomeProjects.vue";
import SectionHomeAbout from "../components/SectionHomeAbout.vue";
import SectionHomeHeader from "../components/SectionHomeHeader.vue";

// onMounted(() => {
//   const ourText = new SplitType( '.marquee', { types: 'chars' })
//   const chars = ourText.chars
//   let tl = gsap.timeline();
//
//   tl.fromTo( chars,
//       {
//         y: 100,
//         opacity: 0
//       },
//       {
//         y: 0,
//         opacity: 1,
//         stagger: 0.05,
//         duration: 0.7,
//         ease: 'power4.out',
//       }
//   )
//   tl.fromTo( '.personal-image',
//       {
//         y: 100,
//         opacity: 0,
//       },
//       {
//         y: 0,
//         opacity: 1,
//         duration: 1
//   });
// });
</script>