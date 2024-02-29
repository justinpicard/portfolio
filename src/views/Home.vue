<template>
	<section class="home-header">
		<div class="container">
			<h2>Hi 👋🏼 my name is Justin Picard and I'm a digital product designer. I love designing applications, platforms and websites that look great and are easy to use. For the last 10 years I have spent my time developing my design- and coding skills at <a href="#">a bunch of digital agencies</a>.</h2>
			<p class="text">no 🐂💩</p>
		</div>
		<div class="personal-image">
			<img :src="getImageUrl('justin-picard','jpg')" alt="">
		</div>
	</section>
	<section class="bio">
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