<template>
	<section class="home-header">
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
	<section class="section bio">
    <div class="container">
      <h2>Hi 👋🏼 my name is Justin Picard and I'm a digital product designer. I love designing applications, platforms and websites that look great and are easy to use.</h2>
      <p class="text">no 🐂💩 blabla</p>
    </div>
  </section>
  <section class="section projects" id="section-projects">
    <div class="container">
      <h3>Featured work</h3>
    </div>
    <div class="project-grid">
      <div class="project-grid-col">
        <div class="project-thumb">Project</div>
      </div>
      <div class="project-grid-col">
        Project
      </div>
      <div class="project-grid-col">
        Project
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="">
        <h3>A little bit more about me</h3>
        <p>For the last 10 years I have spent my time developing my design- and coding skills at <a href="#">a bunch of digital agencies</a> foobar <router-link :to="{ name: 'cv' }">view my CV</router-link></p>
      </div>
    </div>
  </section>

</template>

<script setup>
function getImageUrl(name, ext) {
	return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}

import { gsap } from 'gsap'
import SplitType from 'split-type'
import { onMounted } from "vue";

onMounted(() => {
  const ourText = new SplitType('.marquee', { types: 'chars' })
  const chars = ourText.chars
  let tl = gsap.timeline();

  tl.fromTo( chars,
      {
        y: 100,
        opacity: 0
      },
      {
        y: 0,
        opacity: 1,
        stagger: 0.05,
        duration: 0.7,
        ease: 'power4.out',
      }
  ),
      ('.personal-image',
          {
            y: 100,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power4.out',
          })
  // gsap.fromTo( '.personal-image',
  //     {
  //       y: 100,
  //       opacity: 0,
  //     },
  //     {
  //       y: 0,
  //       opacity: 1,
  //       duration: 1
  // });
});
</script>