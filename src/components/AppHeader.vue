<template>
	<header class="site-header fixed-nav">
    <router-link :to="{ name: 'home' }" class="site-logo">
      <figure class="avatar">
        <img :src="getImageUrl('justin-picard-avatar','jpg')" alt="">
      </figure>
      <span class="site-title">
        <h1>Justin Picard</h1>
        <h2>Digital Product Designer</h2>
      </span>
    </router-link>
	</header>
</template>

<script setup>
function getImageUrl(name, ext) {
	return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}
</script>