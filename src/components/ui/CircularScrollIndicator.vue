<template>
	<div ref="root" class="circular-scroll-indicator-wrapper">
		<a
			ref="indicator"
			class="circular-scroll-indicator"
			href="#about"
			aria-label="Scroll to the About section"
		>
			<svg
				class="circular-scroll-indicator__graphic"
				viewBox="0 0 160 160"
				aria-hidden="true"
			>
				<defs>
					<path
						:id="pathId"
						d="M 80,80 m -58,0 a 58,58 0 1,1 116,0 a 58,58 0 1,1 -116,0"
					/>
				</defs>
				<text class="circular-scroll-indicator__text">
					<textPath
						:href="`#${pathId}`"
						startOffset="0%"
					>
						SCROLL FOR MORE • SCROLL FOR MORE •
					</textPath>
				</text>
			</svg>
			<span class="circular-scroll-indicator__icon" aria-hidden="true">
				↓
			</span>
		</a>
	</div>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'

const pathId = `scroll-indicator-path-${useId()}`
const root = ref<HTMLElement | null>(null)
const indicator = ref<HTMLElement | null>(null)

defineExpose({
	element: root,
	indicator
})
</script>
