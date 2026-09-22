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
			<p class="hero-figure__availability eyebrow font-body text-secondary">
				<span class="hero-figure__availability-dot" aria-hidden="true"></span>
				{{ hero.availability }}
			</p>
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
import { usePortfolioContent } from '../../composables/usePortfolioContent'

withDefaults(defineProps<{
	decorative?: boolean
}>(), {
	decorative: false
})

const { hero } = usePortfolioContent()
</script>
