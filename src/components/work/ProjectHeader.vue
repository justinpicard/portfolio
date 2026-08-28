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
					class="project-header__close-label d-none sm:d-flex"
					data-stagger-link-container
				>
					{{ t('project.closeText') }}
				</span>
			</button>
		</div>

		<div class="project-header__project-pill">
			<div
				class="project-header__pill section-nav section-nav--disabled"
				aria-live="polite"
				aria-atomic="true"
			>
				<div ref="pillPanel" class="project-header__pill-panel section-nav__panel">
					<span ref="pillContent" class="project-header__pill-content section-nav__trigger">
						<span ref="titleWindow" class="section-nav__label-window">
							<span
								:key="displayedProjectIndex"
								ref="currentLabel"
								class="section-nav__label-layer"
							>
								<span class="section-nav__number">
									{{ formatProjectNumber(displayedProjectIndex) }}
								</span>
								<span class="project-header__pill-title">
									{{ displayedTitle }}
								</span>
							</span>
							<span
								v-if="incomingTitle"
								ref="incomingLabel"
								class="section-nav__label-layer section-nav__label-layer--incoming"
								aria-hidden="true"
							>
								<span class="section-nav__number">
									{{ formatProjectNumber(incomingProjectIndex ?? displayedProjectIndex) }}
								</span>
								<span class="project-header__pill-title">
									{{ incomingTitle }}
								</span>
							</span>
						</span>
					</span>
				</div>
			</div>
		</div>
	</header>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
	gsap,
	prefersReducedMotion,
	registerGsapPlugins,
	SplitText
} from '../../utils/animations/gsap'
import { pillLabelTransitionPreset } from '../../utils/animations/presets'
import {
	initStaggerLinks,
	type StaggerLinksController
} from '../../utils/animations/staggerLinks'

const props = defineProps<{
	title: string
	projectIndex: number
}>()

const emit = defineEmits<{
	close: []
}>()

const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const pillPanel = ref<HTMLElement | null>(null)
const pillContent = ref<HTMLElement | null>(null)
const titleWindow = ref<HTMLElement | null>(null)
const currentLabel = ref<HTMLElement | null>(null)
const incomingLabel = ref<HTMLElement | null>(null)
const displayedTitle = ref(props.title)
const displayedProjectIndex = ref(props.projectIndex)
const incomingTitle = ref<string | null>(null)
const incomingProjectIndex = ref<number | null>(null)
let staggerLinks: StaggerLinksController | undefined
let titleTimeline: gsap.core.Timeline | undefined
let titleSplits: SplitText[] = []
let titleTransitionId = 0

function formatProjectNumber(projectIndex: number) {
	return String(projectIndex + 1).padStart(2, '0')
}

function getPillWidth(label: HTMLElement) {
	if (!pillContent.value || !pillPanel.value) return label.offsetWidth

	const contentStyles = window.getComputedStyle(pillContent.value)
	const panelStyles = window.getComputedStyle(pillPanel.value)

	return Math.ceil(label.offsetWidth)
		+ Number.parseFloat(contentStyles.paddingLeft)
		+ Number.parseFloat(contentStyles.paddingRight)
		+ Number.parseFloat(panelStyles.borderLeftWidth)
		+ Number.parseFloat(panelStyles.borderRightWidth)
}

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

function resetTitleAnimationStyles() {
	const widthTargets = [pillPanel.value, titleWindow.value]
		.filter((element): element is HTMLElement => Boolean(element))

	if (widthTargets.length > 0) {
		gsap.set(widthTargets, { clearProps: 'width' })
	}
}

function cleanupTitleAnimation(commitIncoming = false, resetStyles = true) {
	titleTimeline?.kill()
	titleTimeline = undefined
	titleSplits.forEach((split) => split.revert())
	titleSplits = []

	if (commitIncoming && incomingTitle.value) {
		displayedTitle.value = incomingTitle.value
		displayedProjectIndex.value = incomingProjectIndex.value
			?? displayedProjectIndex.value
	}

	incomingTitle.value = null
	incomingProjectIndex.value = null
	if (resetStyles) resetTitleAnimationStyles()
}

async function animateTitle(nextTitle: string, nextProjectIndex: number) {
	if (
		nextTitle === displayedTitle.value
		&& nextProjectIndex === displayedProjectIndex.value
		&& !incomingTitle.value
	) return

	const transitionId = ++titleTransitionId
	cleanupTitleAnimation(true)

	if (prefersReducedMotion()) {
		displayedTitle.value = nextTitle
		displayedProjectIndex.value = nextProjectIndex
		return
	}

	incomingTitle.value = nextTitle
	incomingProjectIndex.value = nextProjectIndex
	await nextTick()

	if (
		transitionId !== titleTransitionId
		|| !pillPanel.value
		|| !pillContent.value
		|| !titleWindow.value
		|| !currentLabel.value
		|| !incomingLabel.value
	) return

	const currentPanelWidth = pillPanel.value.getBoundingClientRect().width
	const outgoingLabelWidth = currentLabel.value.offsetWidth
	const incomingLabelWidth = incomingLabel.value.offsetWidth
	const incomingPanelWidth = getPillWidth(incomingLabel.value)
	const outgoingSplit = new SplitText(currentLabel.value, {
		type: 'chars',
		charsClass: 'section-nav__label-char'
	})
	const incomingSplit = new SplitText(incomingLabel.value, {
		type: 'chars',
		charsClass: 'section-nav__label-char'
	})
	titleSplits = [outgoingSplit, incomingSplit]

	gsap.set(pillPanel.value, { width: currentPanelWidth })
	gsap.set(titleWindow.value, { width: outgoingLabelWidth })
	gsap.set(incomingSplit.chars, { yPercent: 110 })

	titleTimeline = gsap.timeline({
		onComplete: () => {
			if (transitionId !== titleTransitionId) return

			titleTimeline = undefined
			titleSplits.forEach((split) => split.revert())
			titleSplits = []
			displayedTitle.value = nextTitle
			displayedProjectIndex.value = nextProjectIndex
			incomingTitle.value = null
			incomingProjectIndex.value = null
			void nextTick(() => {
				if (transitionId !== titleTransitionId) return

				resetTitleAnimationStyles()
			})
		}
	})
		.to(pillPanel.value, {
			width: incomingPanelWidth,
			...pillLabelTransitionPreset.resize,
			overwrite: true
		}, 0)
		.to(titleWindow.value, {
			width: incomingLabelWidth,
			...pillLabelTransitionPreset.resize,
			overwrite: true
		}, 0)
		.to(outgoingSplit.chars, {
			yPercent: -110,
			...pillLabelTransitionPreset.text,
			overwrite: true
		}, 0)
		.to(incomingSplit.chars, {
			yPercent: 0,
			...pillLabelTransitionPreset.text,
			overwrite: true
		}, pillLabelTransitionPreset.resize.duration)
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

watch(
	() => [props.title, props.projectIndex] as const,
	([title, projectIndex]) => {
		void animateTitle(title, projectIndex)
	}
)

onBeforeUnmount(() => {
	titleTransitionId += 1
	cleanupCloseAnimation()
	// The DOM is being removed, so only stop animation work and restore SplitText.
	cleanupTitleAnimation(false, false)
})

defineExpose({
	element: root,
	focusClose
})
</script>
