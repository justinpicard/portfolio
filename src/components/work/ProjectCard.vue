x<template>
	<article
		ref="card"
		class="project-card"
		:class="[
			`project-card--${index + 1}`,
			{
				'project-card--active': active,
				'project-card--interactive': interactive,
				'project-card--coming-soon': !casePublished,
				'project-card--transition-hidden': transitionHidden
			}
		]"
		:aria-label="cardAriaLabel"
		:tabindex="canNavigate ? 0 : -1"
		:role="canNavigate ? 'button' : undefined"
		:style="cardStyles"
		data-project-card
		@click="handleOpen"
		@pointerenter="animateHover(true)"
		@pointerleave="animateHover(false)"
		@keydown.enter.prevent="handleOpen"
		@keydown.space.prevent="handleOpen"
	>
		<div ref="hoverSurface" class="project-card__hover-surface">
			<div class="project-card__visual" data-project-shared="media" aria-hidden="true">
				<BaseImage
					:src="`/images/${project.thumbnailImage}`"
					alt=""
					:fallback-format="project.thumbnailImageFormat"
					:position="project.thumbnailImagePosition ?? 'center center'"
				/>
			</div>
			<span v-if="!casePublished" class="project-card__corner-label">
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

			<span
				class="project-card__shadow project-card__shadow--from-left"
				data-project-shadow-from-left
				aria-hidden="true"
			/>
			<span
				class="project-card__shadow project-card__shadow--from-right"
				data-project-shadow-from-right
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
import { gsap } from '../../utils/animations/gsap'
import { animationEases } from '../../utils/animations/presets'
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
}>()

const emit = defineEmits<{
	open: [payload: {
		projectIndex: number
		sourceElement: HTMLElement
	}]
}>()

const { t } = useI18n()
const casePublished = computed(() => isProjectPublished(props.project))
const canNavigate = computed(() => Boolean(props.interactive) && casePublished.value)
const cardAriaLabel = computed(() => (
	casePublished.value
		? props.project.title
		: `${props.project.title}: ${t('project.caseComingSoon')}`
))
const cursorIndicatorText = computed(() => (
	casePublished.value
		? t('project.viewProjectIndicator')
		: t('project.caseComingSoonIndicator')
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

function animateHover(isHovered: boolean) {
	if (!hoverSurface.value || (!props.interactive && isHovered)) return

	gsap.to(hoverSurface.value, {
		scale: isHovered ? 1.1 : 1,
		duration: isHovered ? 0.45 : 0.3,
		ease: isHovered ? animationEases.backOut : animationEases.out,
		overwrite: 'auto'
	})
}

onMounted(() => {
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
	animateHover(false)
})

onUnmounted(() => {
	cursorFollowIndicator?.cleanup()
	unavailableShakeTimeline?.kill()
	if (hoverSurface.value) gsap.killTweensOf(hoverSurface.value)
})
</script>
