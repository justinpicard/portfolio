<template>
  <section class="page-title">
    <div class="marquee-container">
      <div class="marquee">
        <span>{{ $route.meta.title }}<span class="star">✦</span></span>
        <span>{{ $route.meta.title }}<span class="star">✦</span></span>
        <span>{{ $route.meta.title }}<span class="star">✦</span></span>
        <span>{{ $route.meta.title }}<span class="star">✦</span></span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { gsap } from 'gsap'
import SplitType from 'split-type'
import { onMounted } from 'vue';

onMounted(() => {
  const ourText = new SplitType('.marquee', { types: 'chars' })
  const chars = ourText.chars

  gsap.fromTo( chars,
      {
        y: 200,
        opacity: 0
      },
      {
        y: 0,
        opacity: 1,
        stagger: 0.05,
        duration: 1,
        ease: 'power4.out',
      }
  )
});
</script>