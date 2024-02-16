<template>
	<section class="home-header">
		<div class="overlay personal-image">
			<img :src="getImageUrl('justin-picard','jpg')" alt="">
		</div>
		<div class="big-name">
			<h2>Justin Picard</h2>
		</div>
	</section>
	<section>
		Vestibulum id ligula porta felis euismod semper. Nullam id dolor id nibh ultricies vehicula ut id elit. Nullam id dolor id nibh ultricies vehicula ut id elit. Nulla vitae elit libero, a pharetra augue. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Donec ullamcorper nulla non metus auctor fringilla.

		Nullam quis risus eget urna mollis ornare vel eu leo. Donec id elit non mi porta gravida at eget metus. Maecenas sed diam eget risus varius blandit sit amet non magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
	</section>
</template>

<script setup>
// where 'name' is the actual name of the file, and 'ext' is the extension
// i.e. myjpg.jpg

function getImageUrl(name, ext) {
	return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}
</script>