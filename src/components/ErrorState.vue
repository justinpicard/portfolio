<template>
	<section ref="root" class="error-state" :aria-labelledby="titleId">
		<div class="container">
			<div class="row">
				<div class="col-12 md:col-8 lg:col-6">
					<p class="error-state__eyebrow eyebrow">{{ eyebrow }}</p>
					<h1
						:id="titleId"
						ref="titleElement"
						class="error-state__title type-display-large"
					>
						{{ title }}
					</h1>
					<p
						ref="messageElement"
						class="error-state__message type-body-small"
					>
						{{ message }}
					</p>
					<div class="error-state__actions">
						<slot name="actions" />
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
	gsap,
	prefersReducedMotion,
	registerGsapPlugins,
	SplitText
} from '../utils/animations/gsap'
import {
	animationDurations,
	animationEases,
	animationStaggers
} from '../utils/animations/presets'

withDefaults(defineProps<{
	eyebrow: string
	title: string
	message: string
	titleId?: string
}>(), {
	titleId: 'error-state-title'
})

const root = ref<HTMLElement | null>(null)
const titleElement = ref<HTMLElement | null>(null)
const messageElement = ref<HTMLElement | null>(null)
let animationContext: gsap.Context | undefined
let copySplits: SplitText[] = []

function wrapSplitLines(lines: Element[]) {
	lines.forEach((line) => {
		const wrapper = document.createElement('span')
		wrapper.classList.add('split-line-wrapper')
		line.parentNode?.insertBefore(wrapper, line)
		wrapper.appendChild(line)
	})
}

onMounted(async () => {
	if (prefersReducedMotion()) return

	registerGsapPlugins()
	await document.fonts.ready
	await nextTick()
	if (!root.value || !titleElement.value || !messageElement.value) return

	animationContext = gsap.context(() => {
		const titleSplit = new SplitText(titleElement.value, {
			type: 'lines',
			linesClass: 'split-line',
			tag: 'span'
		})
		const messageSplit = new SplitText(messageElement.value, {
			type: 'lines',
			linesClass: 'split-line',
			tag: 'span'
		})
		copySplits = [titleSplit, messageSplit]
		wrapSplitLines([...titleSplit.lines, ...messageSplit.lines])

		gsap.timeline()
			.from(titleSplit.lines, {
				yPercent: 110,
				duration: animationDurations.reveal,
				ease: animationEases.strongOut,
				stagger: animationStaggers.lines
			})
			.from(messageSplit.lines, {
				yPercent: 110,
				duration: animationDurations.base,
				ease: animationEases.strongOut,
				stagger: animationStaggers.lines
			}, 0.16)
	}, root.value)
})

onUnmounted(() => {
	animationContext?.revert()
	animationContext = undefined
	copySplits.forEach((split) => split.revert())
	copySplits = []
})
</script>
