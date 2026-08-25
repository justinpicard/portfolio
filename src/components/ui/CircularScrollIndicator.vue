<template>
	<Teleport to="body" :disabled="!useViewportLayer">
		<div
			v-bind="$attrs"
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
							:textLength="INDICATOR_TEXT_LENGTH"
							lengthAdjust="spacing"
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
	</Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, useId } from 'vue'

defineOptions({
	inheritAttrs: false
})

const props = withDefaults(defineProps<{
	variant?: 'hero' | 'project'
	text: string
	href?: string
	ariaLabel?: string
	showIcon?: boolean
}>(), {
	variant: 'hero',
	showIcon: true
})

const pathId = `scroll-indicator-path-${useId()}`
// Keep translated labels distributed consistently without scaling the glyphs.
const INDICATOR_TEXT_LENGTH = 350
const root = ref<HTMLElement | null>(null)
const indicator = ref<HTMLElement | null>(null)
const useViewportLayer = ref(false)
let pointerQuery: MediaQueryList | undefined

function updateViewportLayer() {
	useViewportLayer.value = props.variant === 'hero'
		&& Boolean(pointerQuery?.matches)
}

onMounted(() => {
	pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
	pointerQuery.addEventListener('change', updateViewportLayer)
	updateViewportLayer()
})

onUnmounted(() => {
	pointerQuery?.removeEventListener('change', updateViewportLayer)
})

defineExpose({
	element: root,
	indicator
})
</script>
