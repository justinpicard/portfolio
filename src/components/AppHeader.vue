<template>
	<header class="site-header fixed-nav">
		<div class="header-left">
			<a href="/" class="site-logo">
				<figure class="avatar">
					<img :src="getImageUrl('justin-picard-avatar','jpg')" alt="">
				</figure>
				<span class="site-title">
					<h1>Justin Picard</h1>
					<h2>Digital Product Designer</h2>
				</span>
			</a>
		</div>
		<div class="header-right">
			<a class="btn btn-outlined btn-light btn-md work-status" href="#">
				<span class="btn-text-container">
					<span class="btn-text-wrapper">Open for work</span>
					<span class="btn-text-wrapper">Contact me</span>
				</span>
				<div class="btn-bg rounded-pill"></div>
			</a>
		</div>
	</header>
</template>

<script setup>
// where 'name' is the actual name of the file, and 'ext' is the extension
// i.e. myjpg.jpg

function getImageUrl(name, ext) {
	return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}
</script>