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
	<section class="bio">
    <div class="container">
      <h2>Hi 👋🏼 my name is Justin Picard and I'm a digital product designer. I love designing applications, platforms and websites that look great and are easy to use. For the last 10 years I have spent my time developing my design- and coding skills at <a href="#">a bunch of digital agencies</a>.</h2>
      <p class="text">no 🐂💩</p>
    </div>
		<div class="">
			<h3>A little bit more about me</h3>

		</div>
	</section>
</template>

<script setup>

function getImageUrl(name, ext) {
	return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}
</script>