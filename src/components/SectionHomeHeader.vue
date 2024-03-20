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
</template>

<script setup>
function getImageUrl(name, ext) {
  return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}
</script>