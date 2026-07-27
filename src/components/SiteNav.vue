<template>
	<div ref="root" class="main-nav position-relative">
		<div class="position-fixed top-0 left-0 ml-6 sm:ml-8 mt-6 sm:mt-8">
			<router-link :to="{ name: 'home' }" class="site-logo">
				<figure class="avatar">
					<BaseImage
						src="/images/justin-picard-avatar-3"
						alt="Justin Picard"
					/>
				</figure>
				<span class="site-title d-flex flex-column">
					<span class="name text-lg">Justin Picard</span>
					<span class="role d-block sm:d-none text-xs">Digital Product Designer</span>
				</span>
			</router-link>
		</div>
		<div class="position-fixed top-0 horizontal-center mt-8">
			<span class="role text-lg d-none sm:d-block">Digital Product Designer</span>
		</div>
		<div class="position-fixed top-0 right-0 mr-8 mt-8">
			<div class="lang-switcher">
				<a href="#" class="nav-link text-lg" data-stagger-link>
					<span data-stagger-link-container>{{ currentLang }}</span>
				</a>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import BaseImage from './base/BaseImage.vue'
import { initStaggerLinks, type StaggerLinksController } from '../utils/animations/staggerLinks'

const currentLang = 'EN'
const root = ref<HTMLElement | null>(null)
let staggerLinks: StaggerLinksController | undefined
let copyResetTimeout: ReturnType<typeof window.setTimeout> | undefined

onMounted(() => {
	if (!root.value) return

	staggerLinks = initStaggerLinks(root.value)
})

onUnmounted(() => {
	staggerLinks?.destroy()

	if (copyResetTimeout) {
		window.clearTimeout(copyResetTimeout)
	}
})
</script>
