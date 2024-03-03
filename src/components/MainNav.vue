<template>
	<div class="main-nav position-relative">
		<div class="position-fixed top-0 left-0 ml-2 mt-2">
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
		<div class="position-fixed top-0 right-0 mr-2 mt-2">
      <a class="btn btn-outlined btn-light btn-md work-status" href="#">
				<span class="btn-text-container">
					<span class="btn-text-wrapper">Open for work</span>
					<span class="btn-text-wrapper">Contact me</span>
				</span>
        <div class="btn-bg rounded-pill"></div>
      </a>
		</div>
		<div class="position-fixed bottom-0 left-0 ml-2 mb-1">
      <a href="#" class="nav-link">About</a>
		</div>
    <div class="position-fixed bottom-0 horizontal-center mb-1">
      <a href="#" class="nav-link">My work</a>
    </div>
		<div class="position-fixed bottom-0 right-0 mr-2 mb-1">
      <a href="#"class="nav-link">Contact</a>
		</div>
	</div>
</template>

<script setup>
function getImageUrl(name, ext) {
  return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}
</script>