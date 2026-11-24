<template>
	<figcaption class="case-media-caption">
		<template v-if="typeof caption === 'string'">{{ caption }}</template>
		<template v-else>
			<template v-if="caption.text">{{ caption.text }} </template>
			<a
				ref="linkElement"
				class="case-media-caption__link"
				:href="caption.link.href"
				:target="caption.link.target"
				:rel="caption.link.rel ?? (caption.link.target === '_blank' ? 'noopener noreferrer' : undefined)"
				data-stagger-link
			>
				<span data-stagger-link-container>{{ caption.link.label }}</span>
				<span v-if="isExternal" aria-hidden="true" class="stagger-link-icon ml-1">↗</span>
			</a>
		</template>
	</figcaption>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { CaseMediaCaption } from '../../../content'
import { siteConfig } from '../../../config/site'
import { initStaggerLinks, type StaggerLinksController } from '../../../utils/animations/staggerLinks'

const props = defineProps<{
	caption: CaseMediaCaption
}>()

const isExternal = computed(() => {
	if (typeof props.caption === 'string') return false
	try {
		const url = new URL(props.caption.link.href, siteConfig.baseUrl)
		return ['http:', 'https:'].includes(url.protocol) && url.origin !== new URL(siteConfig.baseUrl).origin
	} catch {
		return false
	}
})

const linkElement = ref<HTMLAnchorElement | null>(null)
let staggerLinks: StaggerLinksController | undefined

function cleanupLinkAnimation() {
	staggerLinks?.destroy()
	staggerLinks = undefined
}

// Restore SplitText markup before Vue updates the caption label.
watch(() => props.caption, cleanupLinkAnimation, { flush: 'pre' })
watch([linkElement, () => props.caption], () => {
	cleanupLinkAnimation()
	if (linkElement.value) staggerLinks = initStaggerLinks(linkElement.value)
}, { flush: 'post' })

onBeforeUnmount(cleanupLinkAnimation)
</script>
