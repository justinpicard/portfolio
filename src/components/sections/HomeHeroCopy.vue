<template>
	<div class="hero-composition" :aria-hidden="decorative ? 'true' : undefined">
		<component
			:is="decorative ? 'div' : 'h1'"
			class="hero-name hero-name--first huge-title"
		>
			{{ hero.name }}
		</component>
		<div class="hero-divider" aria-hidden="true"></div>
		<div class="hero-figure__role-group">
			<p class="hero-figure__role type-heading-small font-body font-regular mb-0">
				{{ hero.role }}
			</p>
			<component
				:is="decorative ? 'span' : 'a'"
				ref="availabilityLink"
				class="hero-figure__availability eyebrow font-body text-secondary"
				:href="decorative ? undefined : 'mailto:hallo@justinpicard.nl'"
				:aria-label="decorative ? undefined : `${hero.availability} — Email me!`"
				:data-stagger-link="decorative ? undefined : ''"
			>
				<span class="hero-figure__availability-dot" aria-hidden="true"></span>
				<span class="hero-figure__availability-label" aria-hidden="true">
					<span data-stagger-link-container>{{ hero.availability }}</span>
					<span v-if="!decorative" data-stagger-link-alternate>Email me!</span>
				</span>
			</component>
		</div>
		<div class="hero-figure">
			<slot name="media">
				<div class="hero-figure__media"></div>
			</slot>
		</div>
		<p class="hero-figure__intro font-regular mb-0">
			{{ hero.introduction }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { usePortfolioContent } from '../../composables/usePortfolioContent'
import { initStaggerLinks, type StaggerLinksController } from '../../utils/animations/staggerLinks'

withDefaults(defineProps<{
	decorative?: boolean
}>(), {
	decorative: false
})

const { hero } = usePortfolioContent()
const availabilityLink = ref<HTMLElement | null>(null)
let staggerLinks: StaggerLinksController | undefined

watch(() => hero.value.availability, () => {
	staggerLinks?.destroy()
	staggerLinks = undefined
}, { flush: 'pre' })

watch([availabilityLink, () => hero.value.availability], () => {
	staggerLinks?.destroy()
	staggerLinks = availabilityLink.value ? initStaggerLinks(availabilityLink.value) : undefined
}, { flush: 'post' })

onBeforeUnmount(() => staggerLinks?.destroy())
</script>
