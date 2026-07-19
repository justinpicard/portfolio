<template>
	<div
		ref="root"
		:class="[
			'circular-scroll-indicator-wrapper',
			`circular-scroll-indicator-wrapper--${variant}`
		]"
	>
		<component
			:is="href ? 'a' : 'div'"
			ref="indicator"
			:class="[
				'circular-scroll-indicator',
				`circular-scroll-indicator--${variant}`
			]"
			:href="href"
			:aria-label="ariaLabel || undefined"
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
						{{ text }}
					</textPath>
				</text>
			</svg>
			<span
				v-if="showIcon"
				class="circular-scroll-indicator__icon"
				aria-hidden="true"
			>
				↓
			</span>
		</component>
	</div>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'

withDefaults(defineProps<{
	variant?: 'hero' | 'project'
	text?: string
	href?: string
	ariaLabel?: string
	showIcon?: boolean
}>(), {
	variant: 'hero',
	text: 'SCROLL DOWN • SCROLL DOWN •',
	href: '#about',
	ariaLabel: 'Scroll to the About section',
	showIcon: true
})

const pathId = `scroll-indicator-path-${useId()}`
const root = ref<HTMLElement | null>(null)
const indicator = ref<HTMLElement | null>(null)

defineExpose({
	element: root,
	indicator
})
</script>
