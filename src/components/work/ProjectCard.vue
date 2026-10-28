<template>
	<article
		ref="card"
		class="project-card"
		:class="[
			`project-card--${index + 1}`,
			{
				'project-card--active': active,
				'project-card--interactive': interactive,
				'project-card--coming-soon': !casePublished,
				'project-card--experiment': project.caseStatus === 'experiment',
				'project-card--transition-hidden': transitionHidden
			}
		]"
		:aria-label="cardAriaLabel"
		:aria-hidden="obscured || undefined"
		:tabindex="canActivate ? 0 : -1"
		:role="canActivate ? 'button' : undefined"
		:style="cardStyles"
		data-project-card
		@click="handleOpen"
		@keydown.enter.prevent="handleOpen"
		@keydown.space.prevent="handleOpen"
	>
		<div ref="hoverSurface" class="project-card__hover-surface">
			<div class="project-card__visual" data-project-shared="media" aria-hidden="true">
				<BaseImage
					:src="`/images/${project.thumbnailImage}`"
					alt=""
					:fallback-format="project.thumbnailImageFormat"
					sizes="(max-height: 500px) 50vw, (max-width: 47.999rem) 100vw, 58vw"
					:position="project.thumbnailImagePosition ?? 'center center'"
				/>
			</div>
			<span v-if="project.caseStatus === 'coming-soon'" class="project-card__corner-label">
				<span class="project-card__corner-label-text">
					{{ t('project.caseComingSoon') }}
				</span>
			</span>

			<div class="project-card__content">
				<div class="project-card__meta">
					<p class="project-card__year" data-project-shared="year">{{ project.year }}</p>
				</div>
				<h3 class="project-card__title" data-project-shared="title">{{ project.title }}</h3>
				<p class="project-card__description" data-project-shared="intro">
					{{ project.type }}
				</p>
				<div class="project-card__tags" data-project-shared="tags">
					<Tag
						v-for="tag in project.tags"
						:key="tag"
					>
						{{ tag }}
					</Tag>
				</div>
			</div>

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
	</article>
</template>

<script setup lang="ts">
import {
	computed,
	onMounted,
	onUnmounted,
	ref,
	watch,
	type CSSProperties
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useCursorFollowIndicator } from '../../composables/useCursorFollowIndicator'
import { isProjectPublished, type Project } from '../../content'
import { gsap, observeReducedMotion } from '../../utils/animations/gsap'
import {
	playUnavailableCardShake,
	resetUnavailableCardShake
} from '../../utils/animations/unavailableCardShake'
import BaseImage from '../base/BaseImage.vue'
import CircularScrollIndicator from '../ui/CircularScrollIndicator.vue'
import Tag from '../ui/Tag.vue'

const props = defineProps<{
	index: number
	project: Project
	active?: boolean
	interactive?: boolean
	transitionHidden?: boolean
	obscured?: boolean
}>()

const emit = defineEmits<{
	'inactive-focus': []
	open: [payload: {
		projectIndex: number
		sourceElement: HTMLElement
	}]
}>()

const { t } = useI18n()
const casePublished = computed(() => isProjectPublished(props.project))
const canActivate = computed(() => (
	Boolean(props.interactive)
	&& (casePublished.value || props.project.caseStatus === 'experiment')
))
const cardAriaLabel = computed(() => (
	casePublished.value
		? props.project.title
		: `${props.project.title}: ${t(props.project.caseStatus === 'experiment'
			? 'project.experiment'
			: 'project.caseComingSoon')}`
))
const cursorIndicatorText = computed(() => (
	casePublished.value
		? t('project.viewProjectIndicator')
		: t(props.project.caseStatus === 'experiment'
			? 'project.experimentIndicator'
			: 'project.caseComingSoonIndicator')
))
const cardStyles = computed<CSSProperties>(() => (
	props.project.overlayBackground
		? {
			'--project-card-color': props.project.overlayBackground
		} as CSSProperties
		: {}
))

const card = ref<HTMLElement | null>(null)
const hoverSurface = ref<HTMLElement | null>(null)
const projectIndicator = ref<InstanceType<typeof CircularScrollIndicator> | null>(
	null
)
const projectIndicatorWrapper = computed(
	() => projectIndicator.value?.element ?? null
)
const projectIndicatorVisual = computed(
	() => projectIndicator.value?.indicator ?? null
)
let cursorFollowIndicator: ReturnType<typeof useCursorFollowIndicator> | undefined
let unavailableShakeTimeline: gsap.core.Timeline | undefined
let stopObservingMotion: (() => void) | undefined

function handleOpen() {
	if (!props.interactive || !card.value) return

	if (!casePublished.value) {
		animateUnavailableCard()
		return
	}

	emit('open', {
		projectIndex: props.index,
		sourceElement: card.value
	})
}

function animateUnavailableCard() {
	if (!hoverSurface.value) return

	unavailableShakeTimeline = playUnavailableCardShake(
		hoverSurface.value,
		unavailableShakeTimeline,
		() => {
			unavailableShakeTimeline = undefined
		}
	)
}

function clearUnavailableCardShake() {
	resetUnavailableCardShake(
		hoverSurface.value,
		unavailableShakeTimeline
	)
	unavailableShakeTimeline = undefined
}

onMounted(() => {
	stopObservingMotion = observeReducedMotion(() => {
		clearUnavailableCardShake()
	})
	if (!projectIndicatorWrapper.value || !projectIndicatorVisual.value) return

	cursorFollowIndicator = useCursorFollowIndicator({
		triggerElement: card,
		wrapperElement: projectIndicatorWrapper,
		visualElement: projectIndicatorVisual
	})

	if (props.interactive) {
		cursorFollowIndicator.enable()
	}
})

watch(() => props.interactive, (interactive) => {
	if (interactive) {
		cursorFollowIndicator?.enable()
		return
	}

	cursorFollowIndicator?.disable()
	clearUnavailableCardShake()
	if (document.activeElement === card.value) emit('inactive-focus')
})

onUnmounted(() => {
	stopObservingMotion?.()
	cursorFollowIndicator?.cleanup()
	unavailableShakeTimeline?.kill()
	if (hoverSurface.value) gsap.killTweensOf(hoverSurface.value)
})
</script>
