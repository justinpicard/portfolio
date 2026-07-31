<template>
	<div class="hero-composition" :aria-hidden="decorative ? 'true' : undefined">
		<component
			:is="decorative ? 'div' : 'h1'"
			class="hero-name hero-name--first huge-title"
		>
			{{ hero.name }}
		</component>
		<div class="hero-divider d-none sm:d-block" aria-hidden="true"></div>
		<p class="hero-figure__role text-2xl font-body font-regular mb-0">
			{{ hero.role }}
		</p>
		<div class="hero-figure">
			<div class="hero-figure__media"></div>
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
