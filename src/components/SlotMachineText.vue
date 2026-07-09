<template>
	<div
		class="slot-machine-text"
		ref="root"
		@mouseenter="onEnter"
		@mouseleave="onLeave"
	>
		<div class="slot-machine-text-container">
			<span ref="textTop">{{ top }}</span>
			<span ref="textBottom" :class="bottomClass">{{ resolvedBottom }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { gsap, SplitText, registerGsapPlugins } from '../utils/animations/gsap'
import { slotTextPreset } from '../utils/animations/presets'

const props = withDefaults(defineProps<{
	top: string
	bottom?: string
	bottomClass?: string
}>(), {
	bottom: undefined,
	bottomClass: undefined
})

const root = ref<HTMLElement | null>(null)
const textTop = ref<HTMLElement | null>(null)
const textBottom = ref<HTMLElement | null>(null)

const resolvedBottom = computed(() => props.bottom ?? props.top)

let topSplit: SplitText | undefined
let bottomSplit: SplitText | undefined
let hoverTimeline: gsap.core.Timeline | undefined
let ctx: gsap.Context | undefined
let isHovering = false

registerGsapPlugins()

function cleanupAnimation() {
	ctx?.revert()
	ctx = undefined
	hoverTimeline?.kill()
	hoverTimeline = undefined
	topSplit?.revert()
	bottomSplit?.revert()
	topSplit = undefined
	bottomSplit = undefined
}

async function setupAnimation() {
	await nextTick()
	cleanupAnimation()

	if (!root.value || !textTop.value || !textBottom.value) {
		return
	}

	ctx = gsap.context(() => {
		topSplit = new SplitText(textTop.value, { type: 'chars', charsClass: 'chars' })
		bottomSplit = new SplitText(textBottom.value, { type: 'chars', charsClass: 'chars' })

		hoverTimeline = gsap.timeline({ paused: true })
		hoverTimeline
			.to(
				topSplit.chars,
				{
					y: -20,
					opacity: 0,
					...slotTextPreset
				},
				0
			)
			.fromTo(
				bottomSplit.chars,
				{
					y: 10,
					opacity: 0
				},
				{
					y: 0,
					opacity: 1,
					...slotTextPreset
				},
				0
			)

		if (isHovering) {
			hoverTimeline.progress(1)
		}
	}, root.value)
}

function onEnter() {
	isHovering = true
	hoverTimeline?.play()
}

function onLeave() {
	isHovering = false
	hoverTimeline?.reverse()
}

onMounted(() => {
	setupAnimation()
})

watch(() => [props.top, props.bottom], () => {
	setupAnimation()
})

onUnmounted(() => {
	cleanupAnimation()
})
</script>
