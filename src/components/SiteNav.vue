<template>
	<div class="main-nav position-relative">
		<div class="position-fixed top-0 left-0 ml-2 mt-2">
      <router-link :to="{ name: 'home' }" class="site-logo">
        <figure class="avatar">
          <img :src="getImageUrl('justin-picard-avatar','jpg')" alt="">
        </figure>
        <span class="site-title">
					<h1>Justin Picard</h1>
					<h2>Digital Product Designer</h2>
				</span>
      </router-link>
		</div>
		<div class="position-fixed top-0 right-0 mr-2 mt-2">
      <a href="#" class="btn btn-outlined btn-light btn-md btn-round language-selector mr-1">
        <span class="btn-text-container">
          <IconGlobe/>
        </span>
        <div class="btn-bg rounded-pill"></div>
      </a>
      <a @click="copy" class="btn btn-outlined btn-light btn-md work-status">
        <span class="d-none">{{ text }}</span>
				<span class="btn-text-container">
					<span class="btn-text-wrapper"><div class="work-indicator"><span class="pulse"></span></div> Open for work</span>
					<span class="btn-text-wrapper">Contact me</span>
				</span>
        <div class="btn-bg rounded-pill"></div>
      </a>
		</div>
		<div class="position-fixed bottom-0 left-0 ml-2 mb-1">
      <router-link :to="{ name: 'about' }" class="nav-link">
        <div class="slot-machine-text">
          <div class="slot-machine-text-container">
            <span class="slot-machine-text-wrapper">About</span>
            <span class="slot-machine-text-wrapper">About</span>
          </div>
        </div>
      </router-link>
		</div>
    <div class="position-fixed bottom-0 horizontal-center mb-1">
      <a href="#section-projects" class="nav-link">
        <div class="slot-machine-text">
          <div class="slot-machine-text-container">
            <span class="slot-machine-text-wrapper">My work</span>
            <span class="slot-machine-text-wrapper">My work</span>
          </div>
        </div>
      </a>
    </div>
		<div class="position-fixed bottom-0 right-0 mr-2 mb-1">
      <a href="mailto:hallo@justinpicard.com" class="nav-link">
        <div class="slot-machine-text">
          <div class="slot-machine-text-container">
            <span class="slot-machine-text-wrapper">Contact</span>
            <span class="slot-machine-text-wrapper">Contact</span>
          </div>
        </div>
      </a>
		</div>
	</div>
</template>

<script setup>
import IconGlobe from "./icons/IconGlobe.vue";

function getImageUrl(name, ext) {
  return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}
</script>
<script>

export default {
  //el: '#container',
  data() {
    return {
      text: 'hallo@justinpicard.nl',
    }
  },
  methods: {
    copy() {
      try {
        navigator.clipboard.writeText(this.text)
        console.log('Copied ' + this.text)
      } catch (e) {
        throw e
        console.log('Failed to copy ' + this.text)
      }
    }
  },
}
</script>