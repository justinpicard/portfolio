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
					<span class="name heading-font bold">Justin Picard</span>
					<span class="role body-font">Digital Product Designer</span>
				</span>
			</router-link>
		</div>
		<div class="position-fixed top-0 right-0 mr-8 mt-12">
			<div class="nav-links">
				<a href="mailto:hallo@justinpicard.nl" class="nav-link" @click.prevent="copy">
					<SlotMachineText
						:top="email"
						:bottom="emailActionLabel"
						bottom-class="bottom-text"
					/>
				</a>
			</div><!-- end .nav-links -->
		</div><!-- end nav container-->
		<!--
		<div class="position-fixed bottom-0 left-0 ml-8 mb-8">
			<a class="nav-link">
				<SlotMachineText top="About" />
			</a>
		</div>
		<div class="position-fixed bottom-0 right-0 mr-8 mb-8">
			<a class="nav-link">
				<SlotMachineText top="My work" />
			</a>
		</div>
		-->
	</div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import BaseImage from './base/BaseImage.vue'
import SlotMachineText from './SlotMachineText.vue'

const email = 'hallo@justinpicard.nl'
const defaultEmailActionLabel = 'Copy email address'
const emailActionLabel = ref(defaultEmailActionLabel)
let copyResetTimeout: ReturnType<typeof window.setTimeout> | undefined

function copy() {
	try {
		navigator.clipboard.writeText(email)
		emailActionLabel.value = 'Copied ✨'

		if (copyResetTimeout) {
			window.clearTimeout(copyResetTimeout)
		}

		copyResetTimeout = window.setTimeout(() => {
			emailActionLabel.value = defaultEmailActionLabel
		}, 5000)
	} catch (error) {
		console.log(`Failed to copy ${email}`)
		throw error
	}
}

onUnmounted(() => {
	if (copyResetTimeout) {
		window.clearTimeout(copyResetTimeout)
	}
})
</script>
