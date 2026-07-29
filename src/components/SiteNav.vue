<template>
	<div ref="root" class="main-nav position-relative">
		<div class="position-fixed top-0 left-0 ml-6 sm:ml-8 mt-6 sm:mt-8">
			<router-link :to="{ name: 'home' }" class="site-logo">
				<figure ref="avatar" class="avatar">
					<BaseImage
						src="/images/justin-picard-avatar-3"
						alt="Justin Picard"
					/>
				</figure>
				<span class="site-title d-flex flex-column">
					<span ref="name" class="name site-nav__reveal-copy text-lg">
						Justin Picard
					</span>
					<span class="role site-nav__reveal-copy d-block sm:d-none text-xs">
						Digital Product Designer
					</span>
				</span>
			</router-link>
		</div>
		<div class="site-role position-fixed top-0 horizontal-center mt-8">
			<span class="role site-nav__reveal-copy text-lg d-none sm:d-block">
				Digital Product Designer
			</span>
		</div>
		<div class="site-lang-switcher position-fixed top-0 right-0 mr-8 mt-8">
			<div class="lang-switcher">
				<a href="#" class="nav-link text-lg" data-stagger-link>
					<span data-stagger-link-container>{{ currentLang }}</span>
				</a>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import BaseImage from './base/BaseImage.vue'
import { initStaggerLinks, type StaggerLinksController } from '../utils/animations/staggerLinks'
import {
	gsap,
	prefersReducedMotion,
	registerGsapPlugins,
	ScrollTrigger,
	SplitText
} from '../utils/animations/gsap'

const currentLang = 'EN'
const HEADER_COPY_REVEAL_SCROLL_RATIO = 0.7
const root = ref<HTMLElement | null>(null)
const avatar = ref<HTMLElement | null>(null)
const name = ref<HTMLElement | null>(null)
let staggerLinks: StaggerLinksController | undefined
let revealContext: gsap.Context | undefined
let nameSplit: SplitText | undefined
let roleSplits: SplitText[] = []

function wrapSplitChar(char: Element, className: string) {
	const wrapper = document.createElement('span')
	wrapper.classList.add(className)
	char.parentNode?.insertBefore(wrapper, char)
	wrapper.appendChild(char)
}

function setupHeaderCopyReveal() {
	if (!root.value || !avatar.value || !name.value) return

	registerGsapPlugins()

	revealContext = gsap.context(() => {
		const roles = gsap.utils.toArray<HTMLElement>('.role', root.value)

		nameSplit = new SplitText(name.value, {
			type: 'chars',
			charsClass: 'site-nav__name-char'
		})
		nameSplit.chars.forEach((char) => {
			wrapSplitChar(char, 'site-nav__name-char-mask')
		})

		roleSplits = roles.map((role) => new SplitText(role, {
			type: 'chars',
			charsClass: 'site-nav__role-char'
		}))
		roleSplits.forEach((split) => {
			split.chars.forEach((char) => {
				wrapSplitChar(char, 'site-nav__role-char-mask')
			})
		})

		const nameChars = nameSplit.chars
		const roleChars = roleSplits.flatMap((split) => split.chars)
		const reduceMotion = prefersReducedMotion()
		const revealTimeline = gsap.timeline({
			paused: true,
			scrollTrigger: {
				start: () => window.innerHeight * HEADER_COPY_REVEAL_SCROLL_RATIO,
				toggleActions: 'play none none reverse',
				invalidateOnRefresh: true
			}
		})

		gsap.set(name.value, { visibility: 'visible' })
		gsap.set(nameChars, {
			autoAlpha: 0,
			xPercent: reduceMotion ? 0 : -105
		})
		gsap.set(roles, { visibility: 'visible' })
		gsap.set(roleChars, {
			autoAlpha: 0,
			yPercent: reduceMotion ? 0 : 115
		})

		revealTimeline
			.to(nameChars, {
				autoAlpha: 1,
				xPercent: 0,
				duration: reduceMotion ? 0 : 0.65,
				ease: 'power3.out',
				stagger: reduceMotion ? 0 : 0.02
			}, 0)
			.to(roleChars, {
				autoAlpha: 1,
				yPercent: 0,
				duration: reduceMotion ? 0 : 0.7,
				ease: 'back.out(1.7)',
				stagger: reduceMotion ? 0 : 0.015
			}, reduceMotion ? 0 : 0.12)
	}, root.value)
}

onMounted(async () => {
	if (!root.value) return

	staggerLinks = initStaggerLinks(root.value)
	await nextTick()
	setupHeaderCopyReveal()
	ScrollTrigger.refresh()
})

onUnmounted(() => {
	staggerLinks?.destroy()
	revealContext?.revert()
	nameSplit?.revert()
	nameSplit = undefined
	roleSplits.forEach((split) => split.revert())
	roleSplits = []
})
</script>
