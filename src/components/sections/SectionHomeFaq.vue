<template>
	<section id="faq" ref="root" class="section-layout section-layout--editorial faq-section" aria-labelledby="faq-title">
		<div class="container">
			<header class="faq-section__header">
				<h2 id="faq-title" class="faq-section__title">{{ faq.heading }}</h2>
				<p class="faq-section__intro">{{ faq.introduction }}</p>
			</header>
			<div class="faq-section__items">
				<div v-for="(item, index) in faq.items" :key="item.id" class="faq-section__item">
					<h3 class="faq-section__question">
						<button
							:id="`faq-question-${item.id}`"
							class="faq-section__toggle"
							type="button"
							:aria-expanded="openItems.has(item.id)"
							:aria-controls="`faq-answer-${item.id}`"
							@click="toggle(item.id)"
						>
							<span class="faq-section__number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
							<span>{{ item.question }}</span>
							<span class="faq-section__icon" aria-hidden="true" />
						</button>
					</h3>
					<Transition :css="false" @enter="expand" @leave="collapse" @enter-cancelled="cancel" @leave-cancelled="cancel">
						<div
							v-show="openItems.has(item.id)"
							:id="`faq-answer-${item.id}`"
							class="faq-section__panel"
							:aria-hidden="!openItems.has(item.id)"
							:inert="!openItems.has(item.id)"
						>
							<div class="faq-section__answer">
								<p
									v-for="(paragraph, paragraphIndex) in (Array.isArray(item.answer) ? item.answer : [item.answer])"
									:key="paragraphIndex"
									class="faq-section__paragraph"
								>{{ paragraph }}</p>
							</div>
						</div>
					</Transition>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import { usePortfolioContent } from '../../composables/usePortfolioContent'
import { gsap, ScrollTrigger, prefersReducedMotion, observeReducedMotion, registerGsapPlugins } from '../../utils/animations/gsap'
import { animationEases } from '../../utils/animations/presets'

const { faq } = usePortfolioContent()
const root = ref<HTMLElement | null>(null)
const openItems = ref(new Set<string>())
let context: gsap.Context | undefined
let stopObservingMotion: (() => void) | undefined

function toggle(id: string) {
	if (openItems.value.has(id)) openItems.value.delete(id)
	else openItems.value.add(id)
}

function cancel(element: Element) {
	gsap.killTweensOf(element)
}

function animate(element: Element, done: () => void, opening: boolean) {
	const panel = element as HTMLElement
	cancel(panel)
	const finish = () => {
		gsap.set(panel, { clearProps: 'height,opacity,overflow' })
		done()
		// Keep footer navigation and existing scroll measurements aligned after reflow.
		void nextTick(() => { if (root.value) ScrollTrigger.refresh() })
	}
	if (prefersReducedMotion() || !context) {
		finish()
		return
	}
	context.add(() => {
		if (opening && !panel.style.height) gsap.set(panel, { height: 0, opacity: 0 })
		gsap.set(panel, { overflow: 'hidden' })
		gsap.to(panel, {
			height: opening ? panel.scrollHeight : 0,
			opacity: opening ? 1 : 0,
			duration: 0.25,
			ease: animationEases.inOut,
			onComplete: finish
		})
	})
}

function expand(element: Element, done: () => void) {
	animate(element, done, true)
}
function collapse(element: Element, done: () => void) {
	animate(element, done, false)
}

onMounted(() => {
	registerGsapPlugins()
	context = gsap.context(() => {}, root.value ?? undefined)
	stopObservingMotion = observeReducedMotion(reduced => {
		if (!reduced || !root.value) return
		const panels = root.value.querySelectorAll('.faq-section__panel')
		gsap.getTweensOf(panels).forEach(tween => tween.progress(1))
	})
})

onUnmounted(() => {
	stopObservingMotion?.()
	context?.revert()
})
</script>
