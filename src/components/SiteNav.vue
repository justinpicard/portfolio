<template>
	<div class="main-nav position-relative">
		<div class="position-fixed top-0 left-0 ml-8 mt-8">
			<router-link :to="{ name: 'home' }" class="site-logo">
				<figure class="avatar">
					<BaseImage
						src="/images/justin-picard-avatar"
						alt="Justin Picard"
					/>
				</figure>
				<span class="site-title">
					<span class="name">Justin Picard</span>
				</span>
			</router-link>
		</div>
		<div class="position-fixed top-0 horizontal-center mt-8">
			<span class="role">Digital Product Designer</span>
		</div>
		<div class="position-fixed top-0 right-0 mr-8 mt-8">
			<div class="lang-switcher">
				<a href="#" class="nav-link">
					<SlotMachineText
						:top="currentLang"
						:bottom="switchToLang"
						bottom-class="bottom-text"
					/>
				</a>
			</div><!-- end .nav-links -->
		</div><!-- end nav container-->
		
		<!--<div class="position-fixed bottom-0 left-0 ml-8 mb-8">
			<a class="nav-link">
				<SlotMachineText top="About" />
			</a>
		</div>
		<div class="position-fixed bottom-0 right-0 mr-8 mb-8">
			<a class="nav-link">
				<SlotMachineText top="My work" />
			</a>
		</div>-->
		
	</div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import BaseImage from './base/BaseImage.vue'
import SlotMachineText from './SlotMachineText.vue'

const currentLang = 'EN'
const switchToLang = 'NL'
let copyResetTimeout: ReturnType<typeof window.setTimeout> | undefined

onUnmounted(() => {
	if (copyResetTimeout) {
		window.clearTimeout(copyResetTimeout)
	}
})
</script>
