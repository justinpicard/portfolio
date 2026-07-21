<template>
	<div class="hero-composition" :aria-hidden="decorative ? 'true' : undefined">
		<component
			:is="decorative ? 'div' : 'h1'"
			class="hero-name hero-name--first huge-title"
		>
			Justin.
		</component>
		<div class="hero-divider d-none sm:d-block" aria-hidden="true"></div>
		<p class="hero-figure__role text-md sm:text-lg font-body font-regular mb-0">
			Digital Product Designer
		</p>
		<div class="hero-figure">
			<div class="hero-figure__media"></div>
		</div>
		<p class="hero-figure__intro text-md font-body font-regular mb-0">
			Creating digital products with a focus on product design, design systems and code.
		</p>
	</div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
	decorative?: boolean
}>(), {
	decorative: false
})
</script>
