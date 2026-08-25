<template>
	<header ref="root" class="project-header main-nav">
		<div class="project-header__close">
			<button
				ref="closeButton"
				class="project-header__close-control"
				type="button"
				:aria-label="t('project.closeLabel')"
				@click="emit('close')"
				data-stagger-link
			>
				<span class="project-header__close-icon" aria-hidden="true">✕</span>
				<span
					class="project-header__close-label"
					data-stagger-link-container
				>
					{{ t('project.closeText') }}
				</span>
			</button>
		</div>

		<div class="project-header__title">
			<span
				ref="titleWindow"
				class="project-header__title-window role type-body-small"
				aria-live="polite"
			>
				<span
					ref="currentTitle"
					class="project-header__title-layer"
				>
					{{ displayedTitle }}
				</span>
				<span
					v-if="incomingTitle"
					ref="incomingTitleElement"
					class="project-header__title-layer project-header__title-layer--incoming"
					aria-hidden="true"
				>
					{{ incomingTitle }}
				</span>
			</span>
		</div>

		<div class="project-header__section-nav">
			<SectionNavigation disabled fixed-section-id="work" />
		</div>
	</header>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionNavigation from '../navigation/SectionNavigation.vue'
import {
	gsap,
	prefersReducedMotion,
	registerGsapPlugins,
	SplitText
} from '../../utils/animations/gsap'
import { staggerLinkPreset } from '../../utils/animations/presets'
import {
	initStaggerLinks,
	type StaggerLinksController
} from '../../utils/animations/staggerLinks'

const props = defineProps<{
	title: string
}>()

const emit = defineEmits<{
	close: []
}>()

const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const titleWindow = ref<HTMLElement | null>(null)
const currentTitle = ref<HTMLElement | null>(null)
const incomingTitleElement = ref<HTMLElement | null>(null)
const displayedTitle = ref(props.title)
const incomingTitle = ref<string | null>(null)
let staggerLinks: StaggerLinksController | undefined
let titleTimeline: gsap.core.Timeline | undefined
let titleSplits: SplitText[] = []
let titleTransitionId = 0

async function setupCloseAnimation() {
	await nextTick()
	staggerLinks?.destroy()
	staggerLinks = closeButton.value
		? initStaggerLinks(closeButton.value)
		: undefined
}

function cleanupCloseAnimation() {
	staggerLinks?.destroy()
	staggerLinks = undefined
}

function cleanupTitleAnimation(commitIncoming = false) {
	titleTimeline?.kill()
	titleTimeline = undefined
	titleSplits.forEach((split) => split.revert())
	titleSplits = []

	if (commitIncoming && incomingTitle.value) {
		displayedTitle.value = incomingTitle.value
	}

	incomingTitle.value = null
}

async function animateTitle(nextTitle: string) {
	if (nextTitle === displayedTitle.value && !incomingTitle.value) return

	const transitionId = ++titleTransitionId
	cleanupTitleAnimation(true)

	if (prefersReducedMotion()) {
		displayedTitle.value = nextTitle
		return
	}

	incomingTitle.value = nextTitle
	await nextTick()

	if (
		transitionId !== titleTransitionId
		|| !titleWindow.value
		|| !currentTitle.value
		|| !incomingTitleElement.value
	) return

	const outgoingSplit = new SplitText(currentTitle.value, {
		type: 'chars',
		charsClass: 'project-header__title-char'
	})
	const incomingSplit = new SplitText(incomingTitleElement.value, {
		type: 'chars',
		charsClass: 'project-header__title-char'
	})
	titleSplits = [outgoingSplit, incomingSplit]

	gsap.set(incomingSplit.chars, { yPercent: 110 })

	titleTimeline = gsap.timeline({
		onComplete: () => {
			if (transitionId !== titleTransitionId) return

			titleTimeline = undefined
			titleSplits.forEach((split) => split.revert())
			titleSplits = []
			displayedTitle.value = nextTitle
			incomingTitle.value = null
		}
	})
		.to(outgoingSplit.chars, {
			yPercent: -110,
			...staggerLinkPreset,
			overwrite: true
		}, 0)
		.to(incomingSplit.chars, {
			yPercent: 0,
			...staggerLinkPreset,
			overwrite: true
		}, 0)
}

function focusClose() {
	closeButton.value?.focus()
}

onMounted(() => {
	registerGsapPlugins()
	setupCloseAnimation()
})

watch(() => t('project.closeText'), () => {
	setupCloseAnimation()
})

watch(() => props.title, (title) => {
	void animateTitle(title)
})

onUnmounted(() => {
	titleTransitionId += 1
	cleanupCloseAnimation()
	cleanupTitleAnimation()
})

defineExpose({
	element: root,
	focusClose
})
</script>
