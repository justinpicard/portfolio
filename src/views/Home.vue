<template>
	<section class="home-header" data-scroll-speed="2" data-scroll-section>
    <div class="marquee-container">
      <div class="marquee name">
        <h2>Justin Picard<span class="star">✦</span></h2>
        <h2>Justin Picard<span class="star">✦</span></h2>
        <h2>Justin Picard<span class="star">✦</span></h2>
        <h2>Justin Picard<span class="star">✦</span></h2>
      </div>
      <div class="marquee job-title">
        <h2>Digital Product Designer<span class="star">✦</span></h2>
        <h2>Digital Product Designer<span class="star">✦</span></h2>
        <h2>Digital Product Designer<span class="star">✦</span></h2>
        <h2>Digital Product Designer<span class="star">✦</span></h2>
      </div>
    </div>
    <div class="personal-image">
      <figure>
        <img :src="getImageUrl('justin-picard','jpg')" alt="">
      </figure>
    </div>
	</section>
  <SectionHomeAbout/>
  <SectionHomeProjects/>
</template>

<script setup>
import { gsap } from 'gsap'
import SplitType from 'split-type'
import { onMounted } from "vue";
import SectionHomeProjects from "../components/SectionHomeProjects.vue";
import SectionHomeAbout from "../components/SectionHomeAbout.vue";

function getImageUrl(name, ext) {
	return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}

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