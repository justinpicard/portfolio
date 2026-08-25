<template>
	<nav
		ref="root"
		class="project-stack-navigator d-flex flex-column"
		:aria-label="t('project.navigationLabel')"
	>
		<div class="project-stack-navigator__stack">
			<button
				v-for="(projectIndex, position) in orderedProjectIndices"
				:key="projects[projectIndex].id"
				:ref="(element) => setCardRef(projectIndex, element)"
				class="project-stack-navigator__card"
				:class="{
					'project-stack-navigator__card--front': position === 0,
					'project-stack-navigator__card--coming-soon':
						!isProjectPublished(projects[projectIndex]),
					'project-stack-navigator__card--hidden': position > visibleRearCardCount + 1
				}"
				:style="getCardStyles(projectIndex, position)"
				type="button"
				:disabled="position !== 0 || interactionDisabled"
				:tabindex="canOpenProject(projectIndex, position) ? 0 : -1"
				:aria-disabled="position === 0 && !isProjectPublished(projects[projectIndex])
					? 'true'
					: undefined"
				:aria-hidden="position === 0 ? undefined : 'true'"
				:aria-label="getCardAriaLabel(projectIndex, position)"
				@click="openProject(projectIndex)"
				@pointerenter="animateCardHover($event, position, true)"
				@pointerleave="animateCardHover($event, position, false)"
			>
				<span class="project-stack-navigator__visual" aria-hidden="true">
					<BaseImage
						:src="`/images/${
							projects[projectIndex].landscapeThumbnailImage
							?? projects[projectIndex].thumbnailImage
						}`"
						:alt="projects[projectIndex].title"
						:fallback-format="
							projects[projectIndex].landscapeThumbnailImageFormat
							?? projects[projectIndex].thumbnailImageFormat
						"
						:position="
							projects[projectIndex].landscapeThumbnailImagePosition
							?? projects[projectIndex].thumbnailImagePosition
							?? 'center center'
						"
					/>
				</span>

				<span class="project-stack-navigator__content">
					<span
						v-if="!isProjectPublished(projects[projectIndex])"
						class="project-stack-navigator__status"
					>
						<Tag size="sm">{{ t('project.caseComingSoon') }}</Tag>
					</span>
					<span class="project-stack-navigator__year eyebrow">
						{{ projects[projectIndex].year }}
					</span>
					<span class="project-stack-navigator__title">
						{{ projects[projectIndex].title }}
					</span>
					<span class="project-stack-navigator__summary">
						{{ projects[projectIndex].summary }}
					</span>
					<span class="project-stack-navigator__tags" aria-hidden="true">
						<Tag
							v-for="tag in projects[projectIndex].tags"
							:key="tag"
						>
							{{ tag }}
						</Tag>
					</span>
				</span>

				<span
					class="project-stack-navigator__shadow-overlay"
					aria-hidden="true"
				/>
			</button>

			<CircularScrollIndicator
				ref="projectIndicator"
				variant="project"
				:text="cursorIndicatorText"
				:href="undefined"
				aria-label=""
				:show-icon="false"
				aria-hidden="true"
			/>
		</div>

		<Button
			class="project-stack-navigator__next"
			:label="t('project.next')"
			:aria-label="t('project.cyclePreview')"
			:disabled="interactionDisabled"
			color="primary"
			@click="shuffle"
		/>

		<p class="sr-only" aria-live="polite" aria-atomic="true">
			{{ announcement }}
		</p>
	</nav>
</template>

<script setup lang="ts">
import {
	computed,
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
	type ComponentPublicInstance,
	type CSSProperties
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useCursorFollowIndicator } from '../../composables/useCursorFollowIndicator'
import { isProjectPublished, type Project } from '../../content'
import {
	gsap,
	prefersReducedMotion,
	registerGsapPlugins
} from '../../utils/animations/gsap'
import {
	animationDurations,
	animationEases
} from '../../utils/animations/presets'
import {
	playUnavailableCardShake,
	resetUnavailableCardShake
} from '../../utils/animations/unavailableCardShake'
import Button from '../Button.vue'
import BaseImage from '../base/BaseImage.vue'
import CircularScrollIndicator from '../ui/CircularScrollIndicator.vue'
import Tag from '../ui/Tag.vue'

const props = defineProps<{
	projects: Project[]
	currentProjectIndex: number
	disabled?: boolean
}>()

const emit = defineEmits<{
	select: [projectIndex: number]
}>()

const { t } = useI18n()
const visibleRearCardCount = 2
const root = ref<HTMLElement | null>(null)
const orderedProjectIndices = ref<number[]>([])
const isShuffling = ref(false)
const announcement = ref('')
const activeCard = ref<HTMLElement | null>(null)
const projectIndicator = ref<InstanceType<typeof CircularScrollIndicator> | null>(
	null
)
const cardElements = new Map<number, HTMLButtonElement>()
let animationContext: gsap.Context | undefined
let shuffleTimeline: gsap.core.Timeline | undefined
let unavailableShakeTimeline: gsap.core.Timeline | undefined
let unavailableShakeCard: HTMLButtonElement | null = null
let cursorFollowIndicator: ReturnType<typeof useCursorFollowIndicator> | undefined

const projectIndicatorWrapper = computed(
	() => projectIndicator.value?.element ?? null
)
const projectIndicatorVisual = computed(
	() => projectIndicator.value?.indicator ?? null
)
const frontProject = computed(() => {
	const frontProjectIndex = orderedProjectIndices.value[0]

	return frontProjectIndex === undefined
		? undefined
		: props.projects[frontProjectIndex]
})
const cursorIndicatorText = computed(() => (
	frontProject.value && !isProjectPublished(frontProject.value)
		? t('project.caseComingSoonIndicator')
		: t('project.viewProjectIndicator')
))

const interactionDisabled = computed(() => (
	Boolean(props.disabled)
	|| isShuffling.value
	|| orderedProjectIndices.value.length === 0
))

function buildCircularOrder(currentProjectIndex: number) {
	return props.projects
		.map((_, offset) => (
			(currentProjectIndex + offset + 1) % props.projects.length
		))
		.filter((projectIndex) => projectIndex !== currentProjectIndex)
}

function resetOrder() {
	orderedProjectIndices.value = buildCircularOrder(props.currentProjectIndex)
}

function canOpenProject(projectIndex: number, position: number) {
	return position === 0
		&& !interactionDisabled.value
		&& isProjectPublished(props.projects[projectIndex])
}

function getCardAriaLabel(projectIndex: number, position: number) {
	if (position !== 0) return undefined

	const project = props.projects[projectIndex]

	return isProjectPublished(project)
		? t('project.openProject', { title: project.title })
		: `${project.title}: ${t('project.caseComingSoon')}`
}

function syncActiveCard() {
	const frontProjectIndex = orderedProjectIndices.value[0]

	activeCard.value = cardElements.get(frontProjectIndex) ?? null
}

function cleanupCursorIndicator() {
	cursorFollowIndicator?.cleanup()
	cursorFollowIndicator = undefined
}

async function setupCursorIndicator() {
	await nextTick()
	cleanupCursorIndicator()
	syncActiveCard()

	if (
		!activeCard.value
		|| !projectIndicatorWrapper.value
		|| !projectIndicatorVisual.value
	) return

	cursorFollowIndicator = useCursorFollowIndicator({
		triggerElement: activeCard,
		wrapperElement: projectIndicatorWrapper,
		visualElement: projectIndicatorVisual
	})

	if (!interactionDisabled.value) {
		cursorFollowIndicator.enable()
	}
}

function setCardRef(
	projectIndex: number,
	element: Element | ComponentPublicInstance | null
) {
	if (element instanceof HTMLButtonElement) {
		cardElements.set(projectIndex, element)
		return
	}

	cardElements.delete(projectIndex)
}

function getStackOffset(position: number) {
	return position * -22
}

function getStackScale(position: number) {
	return 1 - position * 0.028
}

function getRearShadowOpacity(position: number) {
	if (position === 0) return 0

	return Math.min(0.14 + position * 0.07, 0.32)
}

function getCardStyles(projectIndex: number, position: number): CSSProperties {
	const project = props.projects[projectIndex]

	return {
		'--project-stack-color': project.overlayBackground,
		'--project-stack-offset': `${getStackOffset(position)}px`,
		'--project-stack-scale': getStackScale(position),
		'--project-stack-rear-shadow-opacity': getRearShadowOpacity(position),
		'--project-stack-opacity': position <= visibleRearCardCount ? 1 : 0,
		zIndex: props.projects.length - position
	} as CSSProperties
}

function rotateOrder() {
	const [frontProjectIndex, ...remainingProjectIndices] = orderedProjectIndices.value

	if (frontProjectIndex === undefined) return

	orderedProjectIndices.value = [
		...remainingProjectIndices,
		frontProjectIndex
	]
}

function announceFrontProject() {
	const frontProjectIndex = orderedProjectIndices.value[0]
	const frontProject = props.projects[frontProjectIndex]

	announcement.value = frontProject
		? t('project.previewAnnouncement', { title: frontProject.title })
		: ''
}

async function finishShuffle() {
	cleanupCursorIndicator()
	rotateOrder()
	await nextTick()

	gsap.set(Array.from(cardElements.values()), {
		clearProps: 'opacity,transform'
	})
	gsap.set(
		Array.from(cardElements.values())
			.map((card) => card.querySelector<HTMLElement>(
				'.project-stack-navigator__shadow-overlay'
			))
			.filter((shadow): shadow is HTMLElement => Boolean(shadow)),
		{ clearProps: 'opacity' }
	)

	shuffleTimeline = undefined
	isShuffling.value = false
	announceFrontProject()
	await setupCursorIndicator()
}

function shuffle() {
	if (interactionDisabled.value) return
	clearUnavailableCardShake()

	const cardOrder = orderedProjectIndices.value
		.map((projectIndex) => cardElements.get(projectIndex))
		.filter((card): card is HTMLButtonElement => Boolean(card))
	const frontCard = cardOrder[0]

	if (!frontCard) return

	announcement.value = ''
	isShuffling.value = true
	cursorFollowIndicator?.disable()
	gsap.killTweensOf(
		cardOrder,
		'--project-stack-hover-scale,--project-stack-hover-rotation'
	)
	gsap.set(cardOrder, {
		'--project-stack-hover-scale': 1,
		'--project-stack-hover-rotation': '0deg'
	})

	if (prefersReducedMotion()) {
		void finishShuffle()
		return
	}

	const frontCardBounds = frontCard.getBoundingClientRect()
	const dropDistance = Math.max(
		frontCard.offsetHeight + 48,
		window.innerHeight - frontCardBounds.top + 48
	)

	animationContext?.add(() => {
		shuffleTimeline = gsap.timeline({
			onComplete: () => {
				void finishShuffle()
			}
		})

		shuffleTimeline.to(frontCard, {
			y: dropDistance,
			opacity: 1,
			duration: animationDurations.base,
			ease: animationEases.inOut
		}, 0)

		cardOrder.slice(1, visibleRearCardCount + 2).forEach((card, index) => {
			const targetPosition = index
			const shadowOverlay = card.querySelector<HTMLElement>(
				'.project-stack-navigator__shadow-overlay'
			)

			shuffleTimeline?.to(card, {
				y: getStackOffset(targetPosition),
				scale: getStackScale(targetPosition),
				opacity: targetPosition <= visibleRearCardCount ? 1 : 0,
				duration: animationDurations.base,
				ease: animationEases.inOut
			}, 0.08)

			if (shadowOverlay) {
				shuffleTimeline?.to(shadowOverlay, {
					opacity: getRearShadowOpacity(targetPosition),
					duration: animationDurations.base * 0.75,
					ease: animationEases.out
				}, 0.08)
			}
		})
	})
}

function openProject(projectIndex: number) {
	if (interactionDisabled.value) return

	if (!isProjectPublished(props.projects[projectIndex])) {
		animateUnavailableCard(projectIndex)
		return
	}

	emit('select', projectIndex)
}

function animateUnavailableCard(projectIndex: number) {
	const card = cardElements.get(projectIndex)
	if (!card) return

	unavailableShakeCard = card
	unavailableShakeTimeline = playUnavailableCardShake(
		card,
		unavailableShakeTimeline,
		() => {
			unavailableShakeTimeline = undefined
			unavailableShakeCard = null
		}
	)

	if (!unavailableShakeTimeline) unavailableShakeCard = null
}

function clearUnavailableCardShake() {
	resetUnavailableCardShake(
		unavailableShakeCard,
		unavailableShakeTimeline
	)
	unavailableShakeTimeline = undefined
	unavailableShakeCard = null
}

function animateCardHover(
	event: PointerEvent,
	position: number,
	isHovered: boolean
) {
	if (
		!(event.currentTarget instanceof HTMLButtonElement)
		|| (position !== 0 && isHovered)
		|| (interactionDisabled.value && isHovered)
	) return

	gsap.to(event.currentTarget, {
		'--project-stack-hover-scale': isHovered ? 1.1 : 1,
		'--project-stack-hover-rotation': isHovered ? '0.8deg' : '0deg',
		duration: isHovered ? 0.45 : 0.3,
		ease: isHovered ? animationEases.backOut : animationEases.out,
		overwrite: 'auto'
	})
}

function focusActiveCard() {
	const frontProjectIndex = orderedProjectIndices.value[0]

	cardElements.get(frontProjectIndex)?.focus({ preventScroll: true })
}

watch(
	() => props.currentProjectIndex,
	async () => {
		cleanupCursorIndicator()
		clearUnavailableCardShake()
		shuffleTimeline?.kill()
		shuffleTimeline = undefined
		isShuffling.value = false
		resetOrder()
		await setupCursorIndicator()
	}
)

watch(() => props.disabled, (disabled) => {
	if (disabled) {
		cursorFollowIndicator?.disable()
		clearUnavailableCardShake()
		return
	}

	cursorFollowIndicator?.enable()
})

onMounted(async () => {
	registerGsapPlugins()
	resetOrder()
	await setupCursorIndicator()

	if (root.value) {
		animationContext = gsap.context(() => undefined, root.value)
	}
})

onBeforeUnmount(() => {
	clearUnavailableCardShake()
	shuffleTimeline?.kill()
	shuffleTimeline = undefined
	cleanupCursorIndicator()
	gsap.killTweensOf(Array.from(cardElements.values()))
	animationContext?.revert()
	animationContext = undefined
	cardElements.clear()
})

defineExpose({
	element: root,
	focusActiveCard
})
</script>
