<template>
	<div ref="root" class="main-nav position-relative">
		<div class="position-fixed top-0 left-0 ml-6 sm:ml-8 mt-6 sm:mt-8">
			<router-link
				:to="{ name: 'home', params: getLocaleParams(currentLocale) }"
				class="site-logo"
				:aria-label="t('navigation.homeLabel')"
				@click="handleLogoClick"
			>
				<figure ref="avatar" class="avatar">
					<BaseImage
						src="/images/justin-picard-avatar-3"
						:alt="t('accessibility.avatarAlt')"
					/>
				</figure>
				<span class="site-title d-flex flex-column">
					<span ref="name" class="name site-nav__reveal-copy text-lg">
						Justin Picard
					</span>
					<span class="role site-nav__reveal-copy d-block sm:d-none text-xs">
						{{ t('navigation.role') }}
					</span>
				</span>
			</router-link>
		</div>
		<div class="site-role position-fixed top-0 horizontal-center mt-8">
			<span class="role site-nav__reveal-copy text-lg d-none sm:d-block">
				{{ t('navigation.role') }}
			</span>
		</div>
		<div
			class="site-lang-switcher position-fixed top-0 right-0 mr-8 mt-8"
			:class="{ 'site-lang-switcher--section-nav': !MULTILINGUAL_ENABLED }"
		>
			<nav
				v-if="MULTILINGUAL_ENABLED"
				class="lang-switcher"
				:aria-label="t('languageSwitcher.label')"
			>
				<router-link
					:to="getLocalizedRoute('en')"
					class="lang-switcher__option nav-link text-lg"
					:class="{ 'is-active': currentLocale === 'en' }"
					:aria-label="t('languageSwitcher.english')"
					:aria-current="currentLocale === 'en' ? 'page' : undefined"
					:aria-disabled="currentLocale === 'en' ? 'true' : undefined"
					:tabindex="currentLocale === 'en' ? -1 : undefined"
					:data-stagger-link="currentLocale !== 'en' ? '' : undefined"
					@click="preventActiveLocaleNavigation($event, 'en')"
				>
					<span lang="en" data-stagger-link-container>EN</span>
				</router-link>
				<span class="lang-switcher__separator mx-1 text-secondary" aria-hidden="true">✦</span>
				<router-link
					:to="getLocalizedRoute('nl')"
					class="lang-switcher__option nav-link text-lg"
					:class="{ 'is-active': currentLocale === 'nl' }"
					:aria-label="t('languageSwitcher.dutch')"
					:aria-current="currentLocale === 'nl' ? 'page' : undefined"
					:aria-disabled="currentLocale === 'nl' ? 'true' : undefined"
					:tabindex="currentLocale === 'nl' ? -1 : undefined"
					:data-stagger-link="currentLocale !== 'nl' ? '' : undefined"
					@click="preventActiveLocaleNavigation($event, 'nl')"
				>
					<span lang="nl" data-stagger-link-container>NL</span>
				</router-link>
			</nav>
			<SectionNavigation v-else />
		</div>
	</div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import BaseImage from './base/BaseImage.vue'
import SectionNavigation from './navigation/SectionNavigation.vue'
import { useLocalizedRoute } from '../composables/useLocalizedRoute'
import { getLocaleParams } from '../i18n'
import { MULTILINGUAL_ENABLED } from '../config/features'
import { initStaggerLinks, type StaggerLinksController } from '../utils/animations/staggerLinks'
import {
	gsap,
	prefersReducedMotion,
	registerGsapPlugins,
	ScrollTrigger,
	SplitText
} from '../utils/animations/gsap'

const { t } = useI18n()
const route = useRoute()
const { currentLocale, getLocalizedRoute } = useLocalizedRoute()
const props = withDefaults(defineProps<{
	overlayActive?: boolean
}>(), {
	overlayActive: false
})
const emit = defineEmits<{
	'overlay-scroll-top': []
}>()
const HEADER_COPY_REVEAL_SCROLL_RATIO = 0.7
const root = ref<HTMLElement | null>(null)
const avatar = ref<HTMLElement | null>(null)
const name = ref<HTMLElement | null>(null)
let staggerLinks: StaggerLinksController | undefined
let revealContext: gsap.Context | undefined
let nameSplit: SplitText | undefined
let roleSplits: SplitText[] = []
let headerRefreshId = 0
let logoScrollTween: gsap.core.Tween | undefined

async function refreshStaggerLinks() {
	await nextTick()
	staggerLinks?.destroy()
	staggerLinks = undefined

	// SectionNavigation owns its dynamic label splits; this controller is only
	// needed for the language switcher when multilingual navigation is enabled.
	if (!root.value || !MULTILINGUAL_ENABLED) return

	staggerLinks = initStaggerLinks(root.value)
}

function preventActiveLocaleNavigation(event: MouseEvent, locale: 'en' | 'nl') {
	if (currentLocale.value === locale) {
		event.preventDefault()
	}
}

function handleLogoClick(event: MouseEvent) {
	const isModifiedClick = event.button !== 0
		|| event.metaKey
		|| event.ctrlKey
		|| event.shiftKey
		|| event.altKey

	if (isModifiedClick || route.name !== 'home') return

	event.preventDefault()

	if (props.overlayActive) {
		emit('overlay-scroll-top')
		return
	}

	logoScrollTween?.kill()

	if (prefersReducedMotion()) {
		window.scrollTo(0, 0)
		return
	}

	const scrollPosition = { y: window.scrollY }

	logoScrollTween = gsap.to(scrollPosition, {
		y: 0,
		duration: 0.9,
		ease: 'power2.inOut',
		onUpdate() {
			window.scrollTo(0, scrollPosition.y)
		},
		onComplete() {
			logoScrollTween = undefined
		}
	})
}

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
			yPercent: reduceMotion ? 0 : 115
		})
		gsap.set(roles, { visibility: 'visible' })
		gsap.set(roleChars, {
			autoAlpha: 0,
			yPercent: reduceMotion ? 0 : 115
		})

		revealTimeline
			.to(nameChars, {
				autoAlpha: 1,
				yPercent: 0,
				duration: reduceMotion ? 0 : 0.7,
				ease: 'back.out(1.7)',
				stagger: reduceMotion ? 0 : 0.015
			}, 0)
			.to(roleChars, {
				autoAlpha: 1,
				yPercent: 0,
				duration: reduceMotion ? 0 : 0.7,
				ease: 'back.out(1.7)',
				stagger: reduceMotion ? 0 : 0.015
			}, 0)
	}, root.value)
}

function cleanupHeaderCopyReveal() {
	revealContext?.revert()
	revealContext = undefined
	nameSplit?.revert()
	nameSplit = undefined
	roleSplits.forEach(split => split.revert())
	roleSplits = []
}

async function refreshHeaderCopyReveal() {
	const refreshId = ++headerRefreshId

	cleanupHeaderCopyReveal()
	await nextTick()

	if (refreshId !== headerRefreshId) return

	setupHeaderCopyReveal()
	ScrollTrigger.refresh()
}

onMounted(async () => {
	if (!root.value) return

	await refreshStaggerLinks()
	await refreshHeaderCopyReveal()
})

watch(
	() => t('navigation.role'),
	refreshHeaderCopyReveal,
	{ flush: 'pre' }
)

watch(currentLocale, refreshStaggerLinks, { flush: 'post' })

onUnmounted(() => {
	headerRefreshId += 1
	logoScrollTween?.kill()
	staggerLinks?.destroy()
	cleanupHeaderCopyReveal()
})
</script>
