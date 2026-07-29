<template>
	<footer class="site-footer section pb-16">
		<div class="container site-footer__container">
			<div class="site-footer__grid d-grid grid-cols-1 md:grid-cols-3">
				<p class="site-footer__eyebrow eyebrow mb-8">Thanks for visiting</p>
				<h2 class="site-footer__title huge-title col-span-1 md:col-span-3">Say hi.</h2>

				<div class="site-footer__intro col-span-1 md:col-span-2">
					<p class="site-footer__copy">
						Every great conversation starts with a simple hello. Whether it’s about design, side projects, or something completely different, my inbox is always open.
					</p>
					<Button label="Send me an email" href="mailto:hallo@justinpicard.nl" />
				</div>

				<div class="site-footer__links col-span-1 md:col-span-1">
					<nav aria-label="Contact and social links">
						<ul ref="linkList" class="site-footer__link-list d-flex flex-column">
							<!--<li><a href="mailto:hallo@justinpicard.nl">hallo@justinpicard.nl</a></li>-->
							<li>
								<a
									href="https://www.linkedin.com/in/picardjustin/"
									target="_blank"
									rel="noopener"
									data-stagger-link
								>
									<span data-stagger-link-container>LinkedIn</span>
								</a>
							</li>
							<!--<li><a href="https://dribbble.com/justinpicard" target="_blank" rel="noopener">Dribbble</a></li>-->
							<li>
								<router-link :to="{ name: 'resume' }" data-stagger-link>
									<span data-stagger-link-container>Resume</span>
								</router-link>
							</li>
							<li>
								<a
									href="https://unsplash.com/@justinpicard"
									target="_blank"
									rel="noopener"
									data-stagger-link
								>
									<span data-stagger-link-container>Unsplash</span>
								</a>
							</li>
						</ul>
					</nav>
					<p class="site-footer__copyright">&copy; {{ new Date().getFullYear() }} Justin Picard</p>
				</div>
			</div>
		</div>
	</footer>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { initStaggerLinks, type StaggerLinksController } from '../utils/animations/staggerLinks'
import Button from './Button.vue'

const linkList = ref<HTMLUListElement | null>(null)
let staggerLinks: StaggerLinksController | undefined

onMounted(() => {
	if (!linkList.value) return

	staggerLinks = initStaggerLinks(linkList.value)
})

onUnmounted(() => {
	staggerLinks?.destroy()
})
</script>
