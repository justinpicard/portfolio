<template>
	<Teleport to="body">
		<div
			class="project-layer-prototype"
			:class="{
				'project-layer-prototype--opening': isOpening && isOpeningVisibilityLocked
			}"
			role="dialog"
			aria-modal="true"
			aria-labelledby="project-layer-title"
			:aria-busy="isOpening || isTransitioning"
		>
			<article
				ref="surface"
				class="project-layer-prototype__surface"
				:class="initialProjectClass"
			>
				<ProjectHeader
					ref="projectHeader"
					:title="displayedProject.title"
					:project-index="displayedIndex"
					@close="requestClose('button')"
				/>

				<div ref="content" class="project-layer-prototype__content">
					<ProjectHero
						ref="projectHero"
						:project="displayedProject"
						:video-enabled="!compactRendering || (!isOpening && !isTransitioning)"
					/>

					<div ref="caseContent" class="project-layer-prototype__copy">
						<ProjectCaseContent
							v-if="!isOpening"
							:key="displayedProject.slug"
							:project="displayedProject"
						/>
					</div>

					<section
						ref="projectNav"
						class="section-layout section-layout--case section-layout--case-spacious project-nav"
					>
						<div class="container" aria-hidden="true">
							<div
								ref="projectNavDivider"
								class="project-nav__divider divider"
							/>
						</div>
						<div class="project-nav__title">
							<div class="container">
								<div class="row project-nav__row">
									<div class="col-12 lg:col-8 lg:offset-2">
										<div class="project-nav-title__inner d-flex flex-1 justify-center">
											<h2>{{ t('project.wantToSeeMore') }}</h2>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div class="container">
							<div class="row project-nav__row">
								<div class="col-12 lg:col-8 lg:offset-2">
									<ProjectStackNavigator
										v-if="!isOpening"
										ref="projectNavigator"
										:projects="projects"
										:current-project-index="displayedIndex"
										:disabled="isOpening || isTransitioning || isClosing"
										@select="emit('request-project-change', $event)"
									/>
								</div>
							</div>
						</div>
					</section>
				</div>

				<p class="sr-only" aria-live="polite" aria-atomic="true">
					{{ announcement }}
				</p>

				<div ref="scrims" class="project-layer-prototype__scrims" aria-hidden="true">
					<span class="project-layer-prototype__scrim project-layer-prototype__scrim--top" />
					<span
						ref="bottomScrim"
						class="project-layer-prototype__scrim project-layer-prototype__scrim--bottom"
					/>
				</div>
			</article>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
	gsap,
	prefersReducedMotion,
	registerGsapPlugins,
	ScrollTrigger,
	SplitText
} from '../../utils/animations/gsap'
import {
	animationDurations,
	animationEases,
	animationStaggers
} from '../../utils/animations/presets'
import type { WorkCloseTarget } from '../../config/workOverlay'
import { isProjectPublished, type Project } from '../../content'
import ProjectCaseContent from './ProjectCaseContent.vue'
import ProjectHeader from './ProjectHeader.vue'
import ProjectHero from './ProjectHero.vue'
import ProjectStackNavigator from './ProjectStackNavigator.vue'

const { t } = useI18n()
type LayerOrigin = {
	top: number
	left: number
	width: number
	height: number
	borderRadius: string
}

type SharedElementKey = 'media' | 'year' | 'title' | 'intro' | 'tags'
type SharedElementMap = Record<SharedElementKey, HTMLElement>
type HeroElementMap = Omit<SharedElementMap, 'tags'> & {
	tags?: HTMLElement
}

type SharedElementTarget = {
	rect: DOMRect
	borderRadius: string
	color: string
	fontFamily: string
	fontFeatureSettings: string
	fontKerning: string
	fontSize: string
	fontStretch: string
	fontStyle: string
	fontVariationSettings: string
	fontWeight: string
	letterSpacing: string
	lineHeight: string
	textAlign: string
	textTransform: string
	whiteSpace: string
	wordSpacing: string
}

type SharedElementRepresentation = {
	key: SharedElementKey
	element: HTMLElement
}

type SharedElementTiming = {
	position: number
	duration: number
	ease: string
}

type OpenTimingVariant = 'a' | 'b' | 'c'
type CloseSource = 'button' | 'escape'

const props = defineProps<{
	projects: Project[]
	projectIndex: number
	origin: LayerOrigin
	sourceCard: HTMLElement
}>()

const emit = defineEmits<{
	close: [source: CloseSource]
	'request-project-change': [nextIndex: number]
	'project-change-commit': [nextIndex: number]
	opened: []
	'switch-complete': []
	'content-hidden': []
	'close-complete': []
	'source-ready': []
	'target-ready': []
}>()

registerGsapPlugins()

const surface = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const projectHero = ref<InstanceType<typeof ProjectHero> | null>(null)
const caseContent = ref<HTMLElement | null>(null)
const scrims = ref<HTMLElement | null>(null)
const bottomScrim = ref<HTMLElement | null>(null)
const projectHeader = ref<InstanceType<typeof ProjectHeader> | null>(null)
const projectNavigator = ref<InstanceType<typeof ProjectStackNavigator> | null>(null)
const projectNav = ref<HTMLElement | null>(null)
const projectNavDivider = ref<HTMLElement | null>(null)
const sharedTransitionLayer = ref<HTMLElement | null>(null)
const displayedIndex = ref(props.projectIndex)
const isTransitioning = ref(false)
const isOpening = ref(true)
const isOpeningVisibilityLocked = ref(true)
const isClosing = ref(false)
const announcement = ref('')
const initialProjectClass = `project-card--${props.projectIndex + 1}`

const displayedProject = computed(() => props.projects[displayedIndex.value])

const OPEN_DURATION = 1
const HERO_REVEAL_START = 0.64
const CLOSE_DURATION = 0.9
const TEXT_OUT_DURATION = 0.24
const CONTEXT_FADE_DURATION = 0.48
const PROJECT_NAV_DIVIDER_REVEAL_START = 'top 70%'
const SHARED_ELEMENT_TRANSITIONS_ENABLED = false
const COMPACT_OR_TOUCH_QUERY = '(max-width: 63.999rem), (hover: none) and (pointer: coarse)'
const FULLSCREEN_CLIP_PATH = 'inset(0px 0px 0px 0px round 0px)'
const compactRendering = ref(
	typeof window !== 'undefined'
	&& window.matchMedia(COMPACT_OR_TOUCH_QUERY).matches
)
const DEBUG_SHARED_TRANSITION = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugSharedTransition')
const DEBUG_TYPOGRAPHY_DRIFT = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugTypographyDrift')
const DEBUG_SHARED_GEOMETRY = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugSharedGeometry')
const DEBUG_SURFACE_CLONE_SYNC = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugSurfaceCloneSync')
const DEBUG_PROJECT_CLOSE = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugProjectClose')
const SLOW_SHARED_TRANSITION = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('slowSharedTransition')
const STATIC_SHARED_TRANSITION = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugSharedStatic')
const EXPERIMENT_MEDIA_CLONE_IN_SURFACE = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('experimentSharedCloneSurface')
const EXPERIMENT_SURFACE_VERTICAL_LEAD = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('experimentSurfaceVerticalLead')
const EXPERIMENT_MEDIA_VERTICAL_LAG = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('experimentMediaVerticalLag')
const EXPERIMENT_SYMMETRIC_OPEN = import.meta.env.DEV
	&& (
		new URLSearchParams(window.location.search).has('experimentSymmetricOpen')
		|| EXPERIMENT_SURFACE_VERTICAL_LEAD
		|| EXPERIMENT_MEDIA_VERTICAL_LAG
	)
const SHARED_RECT_TOLERANCE = 2
const STATIC_DEBUG_DURATION = 3000
const SURFACE_VERTICAL_LEAD_AMOUNT = 0.10
const MEDIA_VERTICAL_LAG_AMOUNT = 0.12
const OPEN_TIMING_VARIANTS: Record<
	OpenTimingVariant,
	{ overlayEase: string; media: SharedElementTiming }
> = {
	a: {
		overlayEase: animationEases.strongInOut,
		media: {
			position: 0.02,
			duration: 0.82,
			ease: animationEases.strongInOut
		}
	},
	b: {
		overlayEase: animationEases.strongInOut,
		media: {
			position: 0.07,
			duration: 0.82,
			ease: animationEases.strongInOut
		}
	},
	c: {
		overlayEase: animationEases.strongOut,
		media: {
			position: 0.02,
			duration: 0.82,
			ease: animationEases.strongInOut
		}
	}
}
const requestedOpenTimingVariant = import.meta.env.DEV
	? new URLSearchParams(window.location.search).get('sharedTimingVariant')
	: null
const activeOpenTimingVariant: OpenTimingVariant = (
	requestedOpenTimingVariant === 'a'
	|| requestedOpenTimingVariant === 'c'
)
	? requestedOpenTimingVariant
	: 'b'
const openTiming = OPEN_TIMING_VARIANTS[activeOpenTimingVariant]
const activeOpenSurfaceTiming: SharedElementTiming = EXPERIMENT_SYMMETRIC_OPEN
	? {
		position: 0,
		duration: CLOSE_DURATION,
		ease: animationEases.strongInOut
	}
	: {
		position: 0,
		duration: OPEN_DURATION,
		ease: openTiming.overlayEase
	}
const activeOpenMediaTiming: SharedElementTiming = EXPERIMENT_SYMMETRIC_OPEN
	? activeOpenSurfaceTiming
	: openTiming.media

let timeline: gsap.core.Timeline | undefined
let transitionTimeline: gsap.core.Timeline | undefined
let transitionSplits: SplitText[] = []
let heroRevealTimeline: gsap.core.Timeline | undefined
let heroRevealSplits: SplitText[] = []
let heroRevealTargets: HTMLElement[] = []
let cardRestoreSplits: SplitText[] = []
let cardRestoreTargets: HTMLElement[] = []
let contextTransitionRunId = 0
let isBottomScrimVisible: boolean | undefined
let sharedRepresentations: SharedElementRepresentation[] = []
let closeRequestedDuringOpen: CloseSource | undefined
let projectNavDividerTween: gsap.core.Tween | undefined
const typographyFrameWidths = new WeakMap<
	HTMLElement,
	{ scrollWidth: number; clientWidth: number; offsetWidth: number }
>()

type GeometryDebugElement = 'overlay' | 'imageClone' | 'heroImage'
type GeometryDebugProperty = 'top' | 'left' | 'width' | 'height' | 'right' | 'bottom'
type GeometryDebugRect = Record<GeometryDebugProperty, number>
type GeometryDebugDelta = Record<GeometryDebugProperty, number>

type SharedGeometryDebugSession = {
	direction: 'open' | 'close'
	frame: number
	overlay: HTMLElement
	imageClone: HTMLElement
	heroImage: HTMLElement
	boxes: Record<GeometryDebugElement, HTMLElement>
	firstDeviation?: {
		frame: number
		overlayToClone: GeometryDebugDelta
		cloneToHero: GeometryDebugDelta
	}
	maxima: Record<
		'overlayToClone' | 'cloneToHero',
		Record<GeometryDebugProperty, { value: number; frame: number }>
	>
}

let sharedGeometryDebugSession: SharedGeometryDebugSession | undefined

type SurfaceCloneSyncMaximum = {
	value: number
	frame: number
	progress: number
	elapsedMs: number
	surfaceValue: number
	cloneValue: number
}

type SurfaceCloneSyncSession = {
	frame: number
	startedAt: number
	surface: HTMLElement
	clone: HTMLElement
	surfaceBox: HTMLElement
	cloneBox: HTMLElement
	maxima: Record<GeometryDebugProperty, SurfaceCloneSyncMaximum>
}

let surfaceCloneSyncSession: SurfaceCloneSyncSession | undefined

function getProjectBackground(index: number) {
	return props.projects[index].overlayBackground ?? '#b0b0fe'
}

function getSharedElements(root: ParentNode): SharedElementMap | undefined {
	const entries = (['media', 'year', 'title', 'intro', 'tags'] as SharedElementKey[])
		.map((key) => [
			key,
			root.querySelector<HTMLElement>(`[data-project-shared="${key}"]`)
		] as const)

	if (entries.some(([, element]) => !element)) return undefined

	return Object.fromEntries(entries) as SharedElementMap
}

function getHeroElements(): HeroElementMap | undefined {
	const elements = projectHero.value?.getSharedElements()
	if (
		!elements?.media
		|| !elements.year
		|| !elements.title
		|| !elements.intro
	) return undefined

	return elements as HeroElementMap
}

function getHeroSharedElements(): SharedElementMap | undefined {
	const elements = getHeroElements()

	return elements?.tags
		? elements as SharedElementMap
		: undefined
}

function getTransitionBodies() {
	return [
		...(projectHero.value?.getContextBodyElements() ?? []),
		caseContent.value
	].filter(Boolean) as HTMLElement[]
}

function getDetailElements() {
	return [
		...(projectHero.value?.getDetailElements() ?? []),
		caseContent.value
	].filter(Boolean) as HTMLElement[]
}

function getOverlayControls(includeProjectHeader = true) {
	return [
		...(includeProjectHeader ? [projectHeader.value?.element] : []),
		projectNavigator.value?.element
	].filter(Boolean) as HTMLElement[]
}

function captureSharedTargets(elements: SharedElementMap) {
	return Object.fromEntries(
		Object.entries(elements).map(([key, element]) => {
			const styles = window.getComputedStyle(element)

			return [
				key,
				{
					rect: element.getBoundingClientRect(),
					borderRadius: styles.borderRadius,
					color: styles.color,
					fontFamily: styles.fontFamily,
					fontFeatureSettings: styles.fontFeatureSettings,
					fontKerning: styles.fontKerning,
					fontSize: styles.fontSize,
					fontStretch: styles.fontStretch,
					fontStyle: styles.fontStyle,
					fontVariationSettings: styles.fontVariationSettings,
					fontWeight: styles.fontWeight,
					letterSpacing: styles.letterSpacing,
					lineHeight: styles.lineHeight,
					textAlign: styles.textAlign,
					textTransform: styles.textTransform,
					whiteSpace: styles.whiteSpace,
					wordSpacing: styles.wordSpacing
				}
			]
		})
	) as Record<SharedElementKey, SharedElementTarget>
}

function isValidSharedTarget(target: SharedElementTarget) {
	const { top, left, width, height } = target.rect

	return Number.isFinite(top)
		&& Number.isFinite(left)
		&& !(top === 0 && left === 0)
		&& width > 0
		&& height > 0
}

function validateSharedTargets(
	label: 'source' | 'target',
	targets: Record<SharedElementKey, SharedElementTarget>
) {
	const invalidKeys = (Object.keys(targets) as SharedElementKey[])
		.filter((key) => !isValidSharedTarget(targets[key]))

	if (invalidKeys.length > 0) {
		console.warn(`Invalid shared-element ${label} rects`, invalidKeys, targets)
		return false
	}

	return true
}

function debugSharedTargets(
	sourceTargets: Record<SharedElementKey, SharedElementTarget>,
	targetTargets: Record<SharedElementKey, SharedElementTarget>
) {
	if (!DEBUG_SHARED_TRANSITION) return

	(Object.keys(sourceTargets) as SharedElementKey[]).forEach((key) => {
		const sourceRect = sourceTargets[key].rect
		const targetRect = targetTargets[key].rect

		console.table({
			key,
			sourceTop: sourceRect.top,
			sourceLeft: sourceRect.left,
			sourceWidth: sourceRect.width,
			sourceHeight: sourceRect.height,
			targetTop: targetRect.top,
			targetLeft: targetRect.left,
			targetWidth: targetRect.width,
			targetHeight: targetRect.height
		})
	})
}

function getTypographyDebugRow(
	context: 'card' | 'clone' | 'hero',
	key: SharedElementKey,
	element: HTMLElement
) {
	const rect = element.getBoundingClientRect()
	const styles = window.getComputedStyle(element)
	const parentStyles = element.parentElement
		? window.getComputedStyle(element.parentElement)
		: undefined
	const heroRoot = element.closest<HTMLElement>('.project-hero')
	const heroRootStyles = heroRoot
		? window.getComputedStyle(heroRoot)
		: undefined

	return {
		context,
		key,
		top: rect.top,
		left: rect.left,
		width: rect.width,
		height: rect.height,
		scrollWidth: element.scrollWidth,
		clientWidth: element.clientWidth,
		offsetWidth: element.offsetWidth,
		fontFamily: styles.fontFamily,
		fontSize: styles.fontSize,
		fontWeight: styles.fontWeight,
		fontStyle: styles.fontStyle,
		lineHeight: styles.lineHeight,
		letterSpacing: styles.letterSpacing,
		wordSpacing: styles.wordSpacing,
		textTransform: styles.textTransform,
		whiteSpace: styles.whiteSpace,
		fontFeatureSettings: styles.fontFeatureSettings,
		fontVariationSettings: styles.fontVariationSettings,
		fontKerning: styles.fontKerning,
		textRendering: styles.getPropertyValue('text-rendering'),
		textSizeAdjust: styles.getPropertyValue('text-size-adjust'),
		textIndent: styles.textIndent,
		display: styles.display,
		position: styles.position,
		marginTop: styles.marginTop,
		marginBottom: styles.marginBottom,
		paddingTop: styles.paddingTop,
		paddingBottom: styles.paddingBottom,
		boxSizing: styles.boxSizing,
		parentDisplay: parentStyles?.display,
		parentAlignItems: parentStyles?.alignItems,
		parentJustifyContent: parentStyles?.justifyContent,
		parentGap: parentStyles?.gap,
		parentWritingMode: parentStyles?.writingMode,
		parentTransform: parentStyles?.transform,
		heroRootDisplay: heroRootStyles?.display
	}
}

function getComputedTypographySnapshot(element: HTMLElement) {
	const styles = window.getComputedStyle(element)

	return {
		fontSize: styles.fontSize,
		lineHeight: styles.lineHeight,
		fontWeight: styles.fontWeight,
		letterSpacing: styles.letterSpacing,
		wordSpacing: styles.wordSpacing,
		whiteSpace: styles.whiteSpace,
		display: styles.display,
		transform: styles.transform,
		transformOrigin: styles.transformOrigin
	}
}

function getParentDebugSnapshot(element: HTMLElement) {
	const parent = element.parentElement
	const styles = parent ? window.getComputedStyle(parent) : undefined

	return {
		offsetParent: element.offsetParent instanceof HTMLElement
			? `${element.offsetParent.tagName.toLowerCase()}.${element.offsetParent.className}`
			: null,
		display: styles?.display,
		grid: styles?.grid,
		flex: styles?.flex,
		alignItems: styles?.alignItems,
		justifyContent: styles?.justifyContent,
		gap: styles?.gap,
		transform: styles?.transform
	}
}

function interpolateRect(
	source: DOMRect,
	target: DOMRect,
	progress: number
) {
	return {
		top: gsap.utils.interpolate(source.top, target.top, progress),
		left: gsap.utils.interpolate(source.left, target.left, progress),
		width: gsap.utils.interpolate(source.width, target.width, progress),
		height: gsap.utils.interpolate(source.height, target.height, progress)
	}
}

function debugTypographyFrame(
	key: SharedElementKey,
	progress: number,
	sourceElement: HTMLElement,
	clone: HTMLElement,
	targetElement: HTMLElement,
	sourceRect: DOMRect,
	targetRect: DOMRect
) {
	if (!DEBUG_TYPOGRAPHY_DRIFT || key === 'media') return

	const cloneRect = clone.getBoundingClientRect()
	const expectedRect = interpolateRect(sourceRect, targetRect, progress)
	const deltaTop = cloneRect.top - expectedRect.top
	const deltaLeft = cloneRect.left - expectedRect.left
	const deltaWidth = cloneRect.width - expectedRect.width
	const deltaHeight = cloneRect.height - expectedRect.height
	const widths = {
		scrollWidth: clone.scrollWidth,
		clientWidth: clone.clientWidth,
		offsetWidth: clone.offsetWidth
	}
	const previousWidths = typographyFrameWidths.get(clone)
	const wrappingChanged = previousWidths !== undefined && (
		previousWidths.scrollWidth !== widths.scrollWidth
		|| previousWidths.clientWidth !== widths.clientWidth
		|| previousWidths.offsetWidth !== widths.offsetWidth
	)

	typographyFrameWidths.set(clone, widths)

	const frame = {
		key,
		progress,
		sourceRect: toRectSnapshot(sourceElement.getBoundingClientRect()),
		cloneRect: toRectSnapshot(cloneRect),
		targetRect: toRectSnapshot(targetElement.getBoundingClientRect()),
		expectedRect,
		deltaTop,
		deltaLeft,
		deltaWidth,
		deltaHeight,
		wrapping: {
			...widths,
			changed: wrappingChanged
		},
		sourceComputed: getComputedTypographySnapshot(sourceElement),
		cloneComputed: getComputedTypographySnapshot(clone),
		targetComputed: getComputedTypographySnapshot(targetElement),
		sourceParent: getParentDebugSnapshot(sourceElement),
		cloneParent: getParentDebugSnapshot(clone),
		targetParent: getParentDebugSnapshot(targetElement)
	}

	console.debug('Shared typography frame', frame)

	if (
		Math.abs(deltaTop) > 0.5
		|| Math.abs(deltaLeft) > 0.5
		|| Math.abs(deltaWidth) > 0.5
		|| Math.abs(deltaHeight) > 0.5
	) {
		console.warn('Shared typography geometry drift > 0.5px', frame)
	}

	if (wrappingChanged) {
		console.warn('Shared typography wrapping metrics changed', frame)
	}
}

function debugTypographyHandoff(
	label: 'open' | 'close-before-handoff' | 'close-after-handoff',
	representations: SharedElementRepresentation[],
	sourceElements: SharedElementMap,
	targetElements: SharedElementMap
) {
	if (!DEBUG_TYPOGRAPHY_DRIFT) return

	const keys: SharedElementKey[] = ['year', 'title', 'intro', 'tags']
	const cloneElements = new Map(
		representations.map(({ key, element }) => [key, element])
	)

	keys.forEach((key) => {
		const clone = cloneElements.get(key)
		if (!clone) return

		const source = getTypographyDebugRow('card', key, sourceElements[key])
		const cloneRow = getTypographyDebugRow('clone', key, clone)
		const target = getTypographyDebugRow('hero', key, targetElements[key])
		const properties = [
			'top',
			'left',
			'width',
			'height',
			'fontFamily',
			'fontSize',
			'fontWeight',
			'fontStyle',
			'lineHeight',
			'letterSpacing',
			'wordSpacing',
			'textTransform',
			'whiteSpace',
			'fontFeatureSettings',
			'fontVariationSettings',
			'fontKerning',
			'textRendering',
			'display',
			'position',
			'marginTop',
			'marginBottom',
			'paddingTop',
			'paddingBottom',
			'boxSizing',
			'scrollWidth',
			'clientWidth',
			'offsetWidth',
			'parentDisplay',
			'parentAlignItems',
			'parentJustifyContent',
			'parentGap',
			'parentTransform'
		] as const

		console.groupCollapsed(`Typography handoff: ${label} / ${key}`)
		console.table(properties.map((property) => {
			const sourceValue = source[property]
			const cloneValue = cloneRow[property]
			const targetValue = target[property]
			const numericValues = [sourceValue, cloneValue, targetValue]
				.every((value) => typeof value === 'number')
			const identical = numericValues
				? Math.max(
					Math.abs(Number(sourceValue) - Number(cloneValue)),
					Math.abs(Number(cloneValue) - Number(targetValue))
				) <= 0.5
				: sourceValue === cloneValue && cloneValue === targetValue

			return {
				property,
				source: sourceValue,
				clone: cloneValue,
				target: targetValue,
				identical
			}
		}))
		console.groupEnd()
	})
}

function debugTypographyMetrics(
	sourceContext: 'card' | 'hero',
	sourceElements: SharedElementMap,
	representations: SharedElementRepresentation[],
	targetContext: 'card' | 'hero',
	targetElements: SharedElementMap
) {
	if (!DEBUG_SHARED_TRANSITION) return

	const typographyKeys: SharedElementKey[] = ['year', 'title', 'intro', 'tags']
	const cloneElements = new Map(
		representations.map(({ key, element }) => [key, element])
	)

	typographyKeys.forEach((key) => {
		const clone = cloneElements.get(key)
		if (!clone) return

		console.groupCollapsed(`Shared typography metrics: ${key}`)
		console.table([
			getTypographyDebugRow(sourceContext, key, sourceElements[key]),
			getTypographyDebugRow('clone', key, clone),
			getTypographyDebugRow(targetContext, key, targetElements[key])
		])
		console.groupEnd()
	})
}

function removeCloneIds(element: HTMLElement) {
	element.removeAttribute('id')
	element.querySelectorAll<HTMLElement>('[id]').forEach((child) => {
		child.removeAttribute('id')
	})
}

function clearSharedRepresentations() {
	sharedRepresentations.forEach(({ element }) => {
		gsap.killTweensOf(element)
		element.remove()
	})
	sharedRepresentations = []
}

function toRectSnapshot(rect: DOMRect) {
	return {
		top: rect.top,
		left: rect.left,
		width: rect.width,
		height: rect.height
	}
}

function toGeometryDebugRect(rect: DOMRect): GeometryDebugRect {
	return {
		top: rect.top,
		left: rect.left,
		width: rect.width,
		height: rect.height,
		right: rect.right,
		bottom: rect.bottom
	}
}

function subtractGeometryRects(
	first: GeometryDebugRect,
	second: GeometryDebugRect
): GeometryDebugDelta {
	return {
		top: first.top - second.top,
		left: first.left - second.left,
		width: first.width - second.width,
		height: first.height - second.height,
		right: first.right - second.right,
		bottom: first.bottom - second.bottom
	}
}

function createGeometryDebugBox(color: string) {
	const box = document.createElement('div')

	Object.assign(box.style, {
		position: 'fixed',
		zIndex: '2000',
		border: `2px solid ${color}`,
		pointerEvents: 'none',
		boxSizing: 'border-box'
	})
	document.body.appendChild(box)

	return box
}

function positionGeometryDebugBox(element: HTMLElement, rect: GeometryDebugRect) {
	Object.assign(element.style, {
		top: `${rect.top}px`,
		left: `${rect.left}px`,
		width: `${rect.width}px`,
		height: `${rect.height}px`
	})
}

function getGeometryContext(element: HTMLElement) {
	const styles = window.getComputedStyle(element)
	const parentStyles = element.parentElement
		? window.getComputedStyle(element.parentElement)
		: undefined

	return {
		element: `${element.tagName.toLowerCase()}.${element.className}`,
		parent: element.parentElement
			? `${element.parentElement.tagName.toLowerCase()}.${element.parentElement.className}`
			: null,
		offsetParent: element.offsetParent instanceof HTMLElement
			? `${element.offsetParent.tagName.toLowerCase()}.${element.offsetParent.className}`
			: null,
		position: styles.position,
		transform: styles.transform,
		transformOrigin: styles.transformOrigin,
		perspective: styles.perspective,
		contain: styles.contain,
		parentTransform: parentStyles?.transform,
		parentPerspective: parentStyles?.perspective,
		parentContain: parentStyles?.contain
	}
}

function createGeometryMaxima() {
	const properties: GeometryDebugProperty[] = [
		'top',
		'left',
		'width',
		'height',
		'right',
		'bottom'
	]

	return Object.fromEntries(properties.map((property) => [
		property,
		{ value: 0, frame: 0 }
	])) as Record<GeometryDebugProperty, { value: number; frame: number }>
}

function createSurfaceCloneSyncMaxima() {
	const properties: GeometryDebugProperty[] = [
		'top',
		'left',
		'width',
		'height',
		'right',
		'bottom'
	]

	return Object.fromEntries(properties.map((property) => [
		property,
		{
			value: 0,
			frame: 0,
			progress: 0,
			elapsedMs: 0,
			surfaceValue: 0,
			cloneValue: 0
		}
	])) as Record<GeometryDebugProperty, SurfaceCloneSyncMaximum>
}

function startSurfaceCloneSyncDebug(
	surfaceElement: HTMLElement,
	cloneElement: HTMLElement
) {
	if (!DEBUG_SURFACE_CLONE_SYNC) return

	finishSurfaceCloneSyncDebug()
	surfaceCloneSyncSession = {
		frame: 0,
		startedAt: performance.now(),
		surface: surfaceElement,
		clone: cloneElement,
		surfaceBox: createGeometryDebugBox('#ff3b30'),
		cloneBox: createGeometryDebugBox('#007aff'),
		maxima: createSurfaceCloneSyncMaxima()
	}
}

function updateSurfaceCloneSyncDebug(progress: number) {
	const session = surfaceCloneSyncSession
	if (!session) return

	session.frame += 1
	const elapsedMs = performance.now() - session.startedAt
	const surfaceRect = toGeometryDebugRect(
		session.surface.getBoundingClientRect()
	)
	const cloneRect = toGeometryDebugRect(
		session.clone.getBoundingClientRect()
	)
	// Keep the sign: positive means the clone edge/value is farther right,
	// lower or larger than the corresponding surface value.
	const delta = subtractGeometryRects(cloneRect, surfaceRect)

	positionGeometryDebugBox(session.surfaceBox, surfaceRect)
	positionGeometryDebugBox(session.cloneBox, cloneRect)

	const properties = Object.keys(delta) as GeometryDebugProperty[]
	properties.forEach((property) => {
		const signedValue = delta[property]
		if (Math.abs(signedValue) > Math.abs(session.maxima[property].value)) {
			session.maxima[property] = {
				value: signedValue,
				frame: session.frame,
				progress,
				elapsedMs,
				surfaceValue: surfaceRect[property],
				cloneValue: cloneRect[property]
			}
		}
	})

	if (Object.values(delta).some((value) => Math.abs(value) > 0.5)) {
		console.debug('Surface ↔ media clone edge deviation > 0.5px', {
			frame: session.frame,
			progress,
			elapsedMs,
			surface: surfaceRect,
			clone: cloneRect,
			delta
		})
	}
}

function finishSurfaceCloneSyncDebug() {
	const session = surfaceCloneSyncSession
	if (!session) return

	console.groupCollapsed('Surface ↔ media clone synchronization summary')
	console.table(
		(['left', 'right', 'top', 'bottom'] as GeometryDebugProperty[])
			.map((property) => ({
				property,
				maxDelta: session.maxima[property].value,
				frame: session.maxima[property].frame,
				progress: session.maxima[property].progress,
				elapsedMs: session.maxima[property].elapsedMs,
				surface: session.maxima[property].surfaceValue,
				clone: session.maxima[property].cloneValue
			}))
	)
	console.groupEnd()

	session.surfaceBox.remove()
	session.cloneBox.remove()
	surfaceCloneSyncSession = undefined
}

function startSharedGeometryDebug(
	direction: 'open' | 'close',
	overlay: HTMLElement,
	imageClone: HTMLElement,
	heroImage: HTMLElement
) {
	if (!DEBUG_SHARED_GEOMETRY) return

	finishSharedGeometryDebug()
	sharedGeometryDebugSession = {
		direction,
		frame: 0,
		overlay,
		imageClone,
		heroImage,
		boxes: {
			overlay: createGeometryDebugBox('#ff3b30'),
			imageClone: createGeometryDebugBox('#007aff'),
			heroImage: createGeometryDebugBox('#34c759')
		},
		maxima: {
			overlayToClone: createGeometryMaxima(),
			cloneToHero: createGeometryMaxima()
		}
	}

	const image = imageClone.querySelector<HTMLElement>('img')
	const imageStyles = image ? window.getComputedStyle(image) : undefined

	console.groupCollapsed(`Shared geometry context: ${direction}`)
	console.table({
		overlay: getGeometryContext(overlay),
		imageClone: getGeometryContext(imageClone),
		heroImage: getGeometryContext(heroImage)
	})
	console.info('Geometry interpolation', {
		overlay: 'GSAP top + left + width + height + borderRadius',
		imageClone: 'GSAP top + left + width + height + borderRadius',
		heroImage: 'Live layout target; no geometry tween'
	})
	console.info('Image internals', {
		transform: imageStyles?.transform,
		transformOrigin: imageStyles?.transformOrigin,
		objectFit: imageStyles?.objectFit,
		objectPosition: imageStyles?.objectPosition
	})
	console.groupEnd()
}

function updateGeometryMaximum(
	maxima: Record<GeometryDebugProperty, { value: number; frame: number }>,
	delta: GeometryDebugDelta,
	frame: number
) {
	(Object.keys(delta) as GeometryDebugProperty[]).forEach((property) => {
		const value = Math.abs(delta[property])
		if (value > maxima[property].value) {
			maxima[property] = { value, frame }
		}
	})
}

function updateSharedGeometryDebug() {
	const session = sharedGeometryDebugSession
	if (!session) return

	session.frame += 1
	const overlayRect = toGeometryDebugRect(session.overlay.getBoundingClientRect())
	const imageCloneRect = toGeometryDebugRect(session.imageClone.getBoundingClientRect())
	const heroImageRect = toGeometryDebugRect(session.heroImage.getBoundingClientRect())
	const overlayToClone = subtractGeometryRects(overlayRect, imageCloneRect)
	const cloneToHero = subtractGeometryRects(imageCloneRect, heroImageRect)

	positionGeometryDebugBox(session.boxes.overlay, overlayRect)
	positionGeometryDebugBox(session.boxes.imageClone, imageCloneRect)
	positionGeometryDebugBox(session.boxes.heroImage, heroImageRect)
	updateGeometryMaximum(
		session.maxima.overlayToClone,
		overlayToClone,
		session.frame
	)
	updateGeometryMaximum(
		session.maxima.cloneToHero,
		cloneToHero,
		session.frame
	)

	const exceedsTolerance = [
		...Object.values(overlayToClone),
		...Object.values(cloneToHero)
	].some((value) => Math.abs(value) > 0.5)

	if (exceedsTolerance && !session.firstDeviation) {
		session.firstDeviation = {
			frame: session.frame,
			overlayToClone,
			cloneToHero
		}
		console.warn('First shared geometry deviation > 0.5px', {
			direction: session.direction,
			frame: session.frame,
			overlayRect,
			imageCloneRect,
			heroImageRect,
			overlayToClone,
			cloneToHero
		})
	}
}

function finishSharedGeometryDebug() {
	const session = sharedGeometryDebugSession
	if (!session) return

	console.groupCollapsed(`Shared geometry summary: ${session.direction}`)
	console.info('First deviation', session.firstDeviation ?? 'None above 0.5px')
	console.table(
		(['overlayToClone', 'cloneToHero'] as const).flatMap((relation) => (
			(Object.entries(session.maxima[relation]) as [
				GeometryDebugProperty,
				{ value: number; frame: number }
			][]).map(([property, maximum]) => ({
				relation,
				property,
				maximum: maximum.value,
				frame: maximum.frame
			}))
		))
	)
	console.groupEnd()

	Object.values(session.boxes).forEach((box) => box.remove())
	sharedGeometryDebugSession = undefined
}

function cloneMatchesSourceRect(actual: DOMRect, expected: DOMRect) {
	return Math.abs(actual.top - expected.top) <= SHARED_RECT_TOLERANCE
		&& Math.abs(actual.left - expected.left) <= SHARED_RECT_TOLERANCE
		&& Math.abs(actual.width - expected.width) <= SHARED_RECT_TOLERANCE
		&& Math.abs(actual.height - expected.height) <= SHARED_RECT_TOLERANCE
}

function createCloneAtRect(
	key: SharedElementKey,
	sourceElement: HTMLElement,
	sourceTarget: SharedElementTarget
) {
	if (!sharedTransitionLayer.value) return undefined

	const element = sourceElement.cloneNode(true) as HTMLElement
	const sourceRect = sourceTarget.rect
	removeCloneIds(element)
	element.setAttribute('aria-hidden', 'true')

	// Set viewport geometry while detached, so the clone can never paint at its
	// natural DOM position before its source position has been verified.
	Object.assign(element.style, {
		position: 'fixed',
		top: `${sourceRect.top}px`,
		left: `${sourceRect.left}px`,
		right: 'auto',
		bottom: 'auto',
		width: `${sourceRect.width}px`,
		height: `${sourceRect.height}px`,
		margin: '0',
		boxSizing: 'border-box',
		transform: 'none',
		transformOrigin: 'top left',
		transition: 'none',
		color: sourceTarget.color,
		fontFamily: sourceTarget.fontFamily,
		fontFeatureSettings: sourceTarget.fontFeatureSettings,
		fontKerning: sourceTarget.fontKerning,
		fontSize: sourceTarget.fontSize,
		fontStretch: sourceTarget.fontStretch,
		fontStyle: sourceTarget.fontStyle,
		fontVariationSettings: sourceTarget.fontVariationSettings,
		fontWeight: sourceTarget.fontWeight,
		letterSpacing: sourceTarget.letterSpacing,
		lineHeight: sourceTarget.lineHeight,
		textAlign: sourceTarget.textAlign,
		textTransform: sourceTarget.textTransform,
		whiteSpace: sourceTarget.whiteSpace,
		wordSpacing: sourceTarget.wordSpacing,
		pointerEvents: 'none',
		opacity: '0',
		visibility: 'hidden'
	})

	// Controlled render-layer experiment: keep all animation inputs identical,
	// but let the media clone share the surface's clipping and stacking context.
	const cloneParent = EXPERIMENT_MEDIA_CLONE_IN_SURFACE && key === 'media'
		? surface.value
		: sharedTransitionLayer.value

	if (!cloneParent) return undefined

	if (EXPERIMENT_MEDIA_CLONE_IN_SURFACE && key === 'media') {
		element.style.zIndex = '6'
	}

	cloneParent.appendChild(element)

	const actualRect = element.getBoundingClientRect()
	const computedStyles = window.getComputedStyle(element)
	const isSourceReady = cloneMatchesSourceRect(actualRect, sourceRect)

	if (DEBUG_SHARED_TRANSITION || !isSourceReady) {
		const details = {
			key,
			expectedSourceRect: toRectSnapshot(sourceRect),
			actualCloneRect: toRectSnapshot(actualRect),
			inlineStyles: {
				top: element.style.top,
				left: element.style.left,
				width: element.style.width,
				height: element.style.height,
				transform: element.style.transform
			},
			computedStyles: {
				position: computedStyles.position,
				top: computedStyles.top,
				left: computedStyles.left,
				width: computedStyles.width,
				height: computedStyles.height,
				transform: computedStyles.transform,
				transformOrigin: computedStyles.transformOrigin
			}
		}

		if (isSourceReady) {
			console.debug('Shared-element clone verified', details)
		} else {
			console.warn('Shared-element clone failed source-rect verification', details)
		}
	}

	if (!isSourceReady) {
		element.remove()
		return undefined
	}

	if (DEBUG_SHARED_TRANSITION) {
		element.style.outline = '2px solid #ff00ff'
	}

	element.style.visibility = 'visible'
	element.style.opacity = '1'

	return {
		key,
		element
	}
}

function createSharedRepresentations(
	elements: SharedElementMap,
	startTargets: Record<SharedElementKey, SharedElementTarget>
) {
	if (!sharedTransitionLayer.value) return undefined

	clearSharedRepresentations()

	const representations: SharedElementRepresentation[] = []

	for (const [key, sourceElement] of Object.entries(elements)) {
		const sharedKey = key as SharedElementKey
		const representation = createCloneAtRect(
			sharedKey,
			sourceElement,
			startTargets[sharedKey]
		)

		if (!representation) {
			representations.forEach(({ element }) => element.remove())
			sharedRepresentations = []
			return undefined
		}

		representations.push(representation)
	}

	sharedRepresentations = representations
	return sharedRepresentations
}

function waitForStaticSharedDebug() {
	if (!STATIC_SHARED_TRANSITION) return Promise.resolve()

	return new Promise<void>((resolve) => {
		window.setTimeout(resolve, STATIC_DEBUG_DURATION)
	})
}

function addSharedElementTweens(
	animation: gsap.core.Timeline,
	representations: SharedElementRepresentation[],
	sourceElements: SharedElementMap,
	sourceTargets: Record<SharedElementKey, SharedElementTarget>,
	targetElements: SharedElementMap,
	targets: Record<SharedElementKey, SharedElementTarget>,
	position: number,
	duration: number,
	timingOverrides: Partial<Record<SharedElementKey, SharedElementTiming>> = {},
	mediaVerticalLag = false
) {
	representations.forEach(({ key, element }) => {
		const target = targets[key]
		const usesMediaVerticalLag = mediaVerticalLag && key === 'media'
		const timing = timingOverrides[key] ?? {
			position,
			duration,
			ease: animationEases.strongInOut
		}

		animation.to(element, {
			...(usesMediaVerticalLag ? {} : { top: target.rect.top }),
			left: target.rect.left,
			width: target.rect.width,
			height: target.rect.height,
			borderRadius: target.borderRadius,
			fontFamily: target.fontFamily,
			fontFeatureSettings: target.fontFeatureSettings,
			fontKerning: target.fontKerning,
			fontSize: target.fontSize,
			fontStretch: target.fontStretch,
			fontStyle: target.fontStyle,
			fontVariationSettings: target.fontVariationSettings,
			fontWeight: target.fontWeight,
			letterSpacing: target.letterSpacing,
			lineHeight: target.lineHeight,
			textAlign: target.textAlign,
			textTransform: target.textTransform,
			whiteSpace: target.whiteSpace,
			wordSpacing: target.wordSpacing,
			duration: timing.duration,
			ease: timing.ease,
			onUpdate: function (this: gsap.core.Tween) {
				if (usesMediaVerticalLag) {
					const timelineProgress = this.progress()
					const easedProgress = this.ratio
					const lagEnvelope = Math.sin(Math.PI * timelineProgress)
					const verticalProgress = Math.max(
						0,
						easedProgress - MEDIA_VERTICAL_LAG_AMOUNT * lagEnvelope
					)

					gsap.set(element, {
						top: gsap.utils.interpolate(
							sourceTargets[key].rect.top,
							target.rect.top,
							verticalProgress
						)
					})
				}

				if (key === 'media') {
					updateSharedGeometryDebug()
					updateSurfaceCloneSyncDebug(this.ratio)
				}
				debugTypographyFrame(
					key,
					this.ratio,
					sourceElements[key],
					element,
					targetElements[key],
					sourceTargets[key].rect,
					target.rect
				)
			},
			onComplete: () => {
				if (key === 'media') {
					finishSharedGeometryDebug()
					finishSurfaceCloneSyncDebug()
				}
			}
		}, timing.position)
	})
}

function debugProjectClose(message: string, detail?: unknown) {
	if (!DEBUG_PROJECT_CLOSE) return

	if (detail === undefined) {
		console.debug(`[Project close] ${message}`)
		return
	}

	console.debug(`[Project close] ${message}`, detail)
}

function playTimeline(
	animation: gsap.core.Timeline,
	debugClosePhase?: string
) {
	return new Promise<'complete' | 'interrupted'>((resolve) => {
		let hasResolved = false
		const finish = (status: 'complete' | 'interrupted') => {
			if (hasResolved) return
			hasResolved = true
			if (status === 'interrupted' && DEBUG_PROJECT_CLOSE) {
				console.warn('[Project close] timeline interruption', {
					phase: debugClosePhase ?? 'unspecified'
				})
			}
			resolve(status)
		}

		animation.eventCallback('onComplete', () => finish('complete'))
		animation.eventCallback('onInterrupt', () => finish('interrupted'))
		animation.play(0)
	})
}

function revertTransitionSplits() {
	transitionSplits.forEach((split) => split.revert())
	transitionSplits = []
}

function splitHeroTransitionLines(elements: HeroElementMap) {
	const introReveal = splitMaskedLines(elements.intro)
	const titleReveal = splitMaskedLines(elements.title)
	transitionSplits = [introReveal.split, titleReveal.split]

	return {
		titleLines: titleReveal.lines,
		introLines: introReveal.lines
	}
}

function getHeroMetadataElements(elements: HeroElementMap) {
	return projectHero.value?.getMetadataElements() ?? [
		elements.intro,
		elements.year,
		...(elements.tags ? Array.from(elements.tags.children) : [])
	] as HTMLElement[]
}

async function waitForImageReady(image?: HTMLImageElement | null) {
	if (!image) return

	if (!image.complete) {
		await new Promise<void>((resolve) => {
			image.addEventListener('load', () => resolve(), { once: true })
			image.addEventListener('error', () => resolve(), { once: true })
		})
	}

	if (typeof image.decode === 'function') {
		try {
			await image.decode()
		} catch {
			// A loaded fallback can still be painted when decode() rejects.
		}
	}
}

function waitForAnimationFrame() {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve())
	})
}

function updateBottomScrim(immediate = false) {
	if (!content.value || !bottomScrim.value) return

	const heroMedia = projectHero.value?.getMediaElement()
	const contentBottom = content.value.getBoundingClientRect().bottom
	const scrimHeight = bottomScrim.value.getBoundingClientRect().height
	const shouldShow = heroMedia
		? heroMedia.getBoundingClientRect().bottom <= contentBottom - scrimHeight
		: false

	if (shouldShow === isBottomScrimVisible) return
	isBottomScrimVisible = shouldShow

	gsap.to(bottomScrim.value, {
		autoAlpha: shouldShow ? 1 : 0,
		yPercent: shouldShow ? 0 : 100,
		duration: immediate || prefersReducedMotion() ? 0 : 0.28,
		ease: animationEases.out,
		overwrite: true
	})
}

function setupBottomScrim() {
	isBottomScrimVisible = undefined
	updateBottomScrim(true)
	content.value?.addEventListener('scroll', handleProjectContentScroll, {
		passive: true
	})
	window.addEventListener('resize', handleProjectContentScroll)
}

function cleanupBottomScrim() {
	content.value?.removeEventListener('scroll', handleProjectContentScroll)
	window.removeEventListener('resize', handleProjectContentScroll)
	if (bottomScrim.value) {
		gsap.killTweensOf(bottomScrim.value)
		gsap.set(bottomScrim.value, {
			clearProps: 'opacity,transform,visibility'
		})
	}
	isBottomScrimVisible = undefined
}

function cleanupProjectNavDivider() {
	projectNavDividerTween?.scrollTrigger?.kill()
	projectNavDividerTween?.kill()
	projectNavDividerTween = undefined

	if (projectNavDivider.value) {
		gsap.set(projectNavDivider.value, { clearProps: 'width' })
	}
}

function setupProjectNavDivider() {
	cleanupProjectNavDivider()

	if (
		!content.value
		|| !projectNav.value
		|| !projectNavDivider.value
		|| prefersReducedMotion()
	) return

	projectNavDividerTween = gsap.fromTo(projectNavDivider.value, {
		width: '0%'
	}, {
		width: '100%',
		duration: 0.9,
		ease: animationEases.strongInOut,
		scrollTrigger: {
			trigger: projectNav.value,
			scroller: content.value,
			start: PROJECT_NAV_DIVIDER_REVEAL_START,
			toggleActions: 'play none none none'
		}
	})
}

function handleProjectContentScroll() {
	updateBottomScrim()
}

function killContextTransition() {
	contextTransitionRunId += 1
	transitionTimeline?.kill()
	transitionTimeline = undefined
	revertTransitionSplits()
	cleanupHeroReveal()
	if (content.value) {
		gsap.set(content.value, {
			clearProps: 'opacity,transform,visibility'
		})
	}
	if (surface.value) {
		gsap.set(surface.value, {
			'--project-card-color': getProjectBackground(displayedIndex.value)
		})
	}
}

function playUntil(
	animation: gsap.core.Timeline,
	position: number
) {
	return new Promise<void>((resolve) => {
		let hasResolved = false
		const finish = () => {
			if (hasResolved) return
			hasResolved = true
			resolve()
		}

		animation.call(finish, [], position)
		animation.eventCallback('onInterrupt', finish)
		animation.play(0)
	})
}

function continueTimeline(animation: gsap.core.Timeline) {
	return new Promise<void>((resolve) => {
		animation.eventCallback('onComplete', resolve)
		animation.eventCallback('onInterrupt', resolve)
		animation.play()
	})
}

function requestClose(source: CloseSource) {
	if (isClosing.value || isTransitioning.value) return

	if (isOpening.value) {
		closeRequestedDuringOpen = source
		debugProjectClose('close requested during opening; queued', { source })
		return
	}

	debugProjectClose('close requested', { source })
	emit('close', source)
}

function cancelClose() {
	restoreClosePresentation()
	isClosing.value = false
	debugProjectClose('close aborted; overlay restored to open state')
}

function completeProjectSwitch() {
	isTransitioning.value = false
}

function isStaleContextTransition(runId: number) {
	const isStale = runId !== contextTransitionRunId
	if (isStale) {
		debugProjectClose('stale runId cancellation', {
			runId,
			activeRunId: contextTransitionRunId
		})
	}

	return isStale
}

async function navigateToProject(nextIndex: number, restoreFocus = false) {
	if (isOpening.value || isTransitioning.value || isClosing.value) return

	if (
		nextIndex < 0
		|| nextIndex >= props.projects.length
		|| nextIndex === displayedIndex.value
		|| !isProjectPublished(props.projects[nextIndex])
	) return

	isTransitioning.value = true
	let shouldRestoreFocus = false

	try {
		announcement.value = ''
		killContextTransition()
		const runId = contextTransitionRunId

		if (prefersReducedMotion()) {
			gsap.set(content.value, { autoAlpha: 0 })
			displayedIndex.value = nextIndex
			emit('project-change-commit', nextIndex)
			await nextTick()
			if (isStaleContextTransition(runId)) return
			if (content.value) {
				content.value.scrollTop = 0
			}
			isBottomScrimVisible = undefined
			updateBottomScrim(true)
			gsap.set(surface.value, {
				'--project-card-color': getProjectBackground(nextIndex)
			})
			await waitForAnimationFrame()
			if (isStaleContextTransition(runId)) return
			gsap.set([
				...Object.values(getHeroElements() ?? {}),
				...getTransitionBodies()
			], {
				clearProps: 'clipPath,opacity,transform,visibility'
			})
			gsap.set(content.value, {
				clearProps: 'opacity,transform,visibility'
			})
			announcement.value = `${displayedProject.value.title} project loaded`
			shouldRestoreFocus = restoreFocus
			return
		}

		const outgoingHero = getHeroElements()
		if (!outgoingHero || !content.value) return

		const outgoingLines = splitHeroTransitionLines(outgoingHero)
		const outgoingMetadata = getHeroMetadataElements(outgoingHero)
			.filter((element) => element !== outgoingHero.intro)

		transitionTimeline = gsap.timeline({ paused: true })
		transitionTimeline
			.to([...outgoingLines.titleLines, ...outgoingLines.introLines], {
				yPercent: -110,
				duration: 0.34,
				ease: 'power2.in',
				stagger: 0.045
			}, 0)
			.to(outgoingMetadata, {
				autoAlpha: 0,
				y: -8,
				duration: TEXT_OUT_DURATION,
				ease: 'power2.in',
				stagger: 0.025
			}, 0)
			.to(content.value, {
				autoAlpha: 0,
				y: -12,
				duration: TEXT_OUT_DURATION,
				ease: 'power2.in'
			}, 0.08)
			.to(surface.value, {
				'--project-card-color': getProjectBackground(nextIndex),
				duration: CONTEXT_FADE_DURATION,
				ease: 'power2.inOut'
			}, 0.18)

		await playUntil(transitionTimeline, 0.34)
		if (isStaleContextTransition(runId)) return

		revertTransitionSplits()

		displayedIndex.value = nextIndex
		emit('project-change-commit', nextIndex)
		await nextTick()
		if (isStaleContextTransition(runId) || !content.value) return

		content.value.scrollTop = 0
		isBottomScrimVisible = undefined
		updateBottomScrim(true)
		const incomingHero = getHeroElements()
		if (!incomingHero) {
			gsap.set(content.value, {
				clearProps: 'opacity,transform,visibility'
			})
			return
		}

		await waitForAnimationFrame()
		if (isStaleContextTransition(runId)) return
		await waitForImageReady(
			incomingHero.media.querySelector<HTMLImageElement>('img')
		)
		if (isStaleContextTransition(runId)) return

		const caseHeroReveal = createCaseHeroReveal(false)
		if (caseHeroReveal) {
			transitionTimeline.add(caseHeroReveal, transitionTimeline.time())
			caseHeroReveal.paused(false)
			await continueTimeline(transitionTimeline)
		} else {
			gsap.set(content.value, {
				clearProps: 'opacity,transform,visibility'
			})
			await continueTimeline(transitionTimeline)
		}
		if (isStaleContextTransition(runId)) return

		cleanupHeroReveal()
		transitionTimeline = undefined
		announcement.value = `${displayedProject.value.title} project loaded`
		shouldRestoreFocus = restoreFocus
	} catch (error) {
		killContextTransition()
		if (DEBUG_PROJECT_CLOSE) {
			console.error('[Project close] caught exception', {
				transaction: 'project switch',
				error
			})
		}
	} finally {
		completeProjectSwitch()

		if (shouldRestoreFocus) {
			await nextTick()
			projectNavigator.value?.focusActiveCard()
		}
		emit('switch-complete')
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		requestClose('escape')
	}
}

function setInitialGeometry() {
	if (!surface.value) return

	gsap.set(surface.value, {
		top: props.origin.top,
		left: props.origin.left,
		width: props.origin.width,
		height: props.origin.height,
		borderRadius: props.origin.borderRadius,
		'--project-card-color': getProjectBackground(displayedIndex.value)
	})
}

function setFullscreenGeometry() {
	if (!surface.value) return

	gsap.set(surface.value, {
		top: 0,
		left: 0,
		width: '100vw',
		height: '100dvh',
		borderRadius: 0
	})
}

function usesCompactRendering() {
	return compactRendering.value
}

function getInsetClipPath(
	rect: Pick<DOMRect, 'top' | 'left' | 'right' | 'bottom'>,
	borderRadius: string
) {
	// Insets must use the rendered 100dvh surface as their coordinate space;
	// window.innerHeight can represent a different viewport while mobile chrome moves.
	const surfaceRect = surface.value?.getBoundingClientRect()
	const surfaceTop = surfaceRect?.top ?? 0
	const surfaceLeft = surfaceRect?.left ?? 0
	const surfaceRight = surfaceRect?.right ?? window.innerWidth
	const surfaceBottom = surfaceRect?.bottom ?? window.innerHeight
	const top = Math.max(0, rect.top - surfaceTop)
	const right = Math.max(0, surfaceRight - rect.right)
	const bottom = Math.max(0, surfaceBottom - rect.bottom)
	const left = Math.max(0, rect.left - surfaceLeft)

	return `inset(${top}px ${right}px ${bottom}px ${left}px round ${borderRadius})`
}

function getCompactSourceGeometry() {
	// Scroll locking and dynamic viewport changes can invalidate the pre-mount snapshot.
	const sourceRect = props.sourceCard.getBoundingClientRect()
	const hasLiveGeometry = props.sourceCard.isConnected
		&& sourceRect.width > 0
		&& sourceRect.height > 0

	if (hasLiveGeometry) {
		return {
			rect: sourceRect,
			borderRadius: window.getComputedStyle(props.sourceCard).borderRadius
		}
	}

	return {
		rect: {
			top: props.origin.top,
			left: props.origin.left,
			right: props.origin.left + props.origin.width,
			bottom: props.origin.top + props.origin.height
		},
		borderRadius: props.origin.borderRadius
	}
}

function debugCompactGeometry(
	phase: 'open' | 'close',
	targetRect: Pick<DOMRect, 'top' | 'left' | 'right' | 'bottom'>,
	clipPath: string
) {
	if (!DEBUG_PROJECT_CLOSE) return

	const visualViewport = window.visualViewport
	debugProjectClose(`mobile ${phase} geometry`, {
		homepageScrollY: window.scrollY,
		layerScrollY: content.value?.scrollTop ?? 0,
		windowViewport: {
			width: window.innerWidth,
			height: window.innerHeight
		},
		visualViewport: visualViewport ? {
			width: visualViewport.width,
			height: visualViewport.height,
			offsetTop: visualViewport.offsetTop,
			offsetLeft: visualViewport.offsetLeft
		} : null,
		surfaceRect: surface.value?.getBoundingClientRect(),
		targetRect,
		clipPath
	})
}

function getProjectCardContents(card: HTMLElement) {
	return Array.from(card.querySelectorAll<HTMLElement>([
		'.project-card__content',
		'.project-card__visual',
		'.project-card__shadow'
	].join(', ')))
}

function wrapHeroRevealLines(lines: Element[]) {
	lines.forEach((line) => {
		const mask = document.createElement('span')
		mask.classList.add('split-line-wrapper')
		line.parentNode?.insertBefore(mask, line)
		mask.appendChild(line)
	})
}

function splitMaskedLines(element: HTMLElement) {
	const split = new SplitText(element, {
		type: 'lines',
		linesClass: 'split-line',
		tag: 'span'
	})
	const lines = split.lines as HTMLElement[]
	wrapHeroRevealLines(lines)

	return { split, lines }
}

function revertHeroRevealSplits() {
	heroRevealSplits.forEach((split) => split.revert())
	heroRevealSplits = []
}

function cleanupHeroReveal() {
	heroRevealTimeline?.kill()
	heroRevealTimeline = undefined
	revertHeroRevealSplits()

	if (heroRevealTargets.length > 0) {
		gsap.killTweensOf(heroRevealTargets)
		gsap.set(heroRevealTargets, {
			clearProps: 'clipPath,opacity,transform,visibility,width'
		})
		heroRevealTargets = []
	}
}

function cleanupCardRestore() {
	cardRestoreSplits.forEach((split) => split.revert())
	cardRestoreSplits = []

	if (cardRestoreTargets.length > 0) {
		gsap.killTweensOf(cardRestoreTargets)
		gsap.set(cardRestoreTargets, {
			clearProps: 'opacity,transform,visibility'
		})
		cardRestoreTargets = []
	}
}

function prepareCardRestore(targetCard: HTMLElement) {
	const title = targetCard.querySelector<HTMLElement>('.project-card__title')
	const description = targetCard.querySelector<HTMLElement>(
		'.project-card__description'
	)
	const thumbnail = targetCard.querySelector<HTMLElement>('.project-card__visual')
	const year = targetCard.querySelector<HTMLElement>('.project-card__year')
	const tags = Array.from(
		targetCard.querySelectorAll<HTMLElement>('.project-card__tags .tag')
	)

	if (!title || !description || !thumbnail || !year) return undefined

	cleanupCardRestore()
	const titleReveal = splitMaskedLines(title)
	const descriptionReveal = splitMaskedLines(description)
	cardRestoreSplits = [titleReveal.split, descriptionReveal.split]

	const lineTargets = [
		...titleReveal.lines,
		...descriptionReveal.lines
	]
	const metadataTargets = [year, ...tags]
	cardRestoreTargets = [
		thumbnail,
		...lineTargets,
		...metadataTargets
	]

	gsap.set(thumbnail, {
		autoAlpha: 0,
		y: 5
	})
	gsap.set(lineTargets, {
		autoAlpha: 1,
		yPercent: 105
	})
	gsap.set(metadataTargets, {
		autoAlpha: 0,
		y: 6
	})

	return {
		thumbnail,
		titleLines: titleReveal.lines,
		descriptionLines: descriptionReveal.lines,
		metadataTargets
	}
}

async function waitForHeroRevealLayout() {
	if ('fonts' in document) {
		await document.fonts.ready
	}

	await nextTick()
}

function createCaseHeroReveal(includeProjectHeader = true) {
	const heroElements = getHeroElements()
	if (!heroElements || !content.value || !scrims.value) return undefined

	cleanupHeroReveal()

	const eyebrowReveal = splitMaskedLines(heroElements.intro)
	const titleReveal = splitMaskedLines(heroElements.title)
	heroRevealSplits = [eyebrowReveal.split, titleReveal.split]

	const eyebrowLines = eyebrowReveal.lines
	const titleLines = titleReveal.lines
	const eyebrow = heroElements.intro
	const divider = projectHero.value?.getDividerElement()
	const dividerTargets = divider ? [divider] : []
	const metadata = getHeroMetadataElements(heroElements)
		.filter((element) => element !== eyebrow)
	const metadataReveals = metadata.flatMap((element) => (
		Array.from(element.children)
			.filter((child): child is HTMLElement => child instanceof HTMLElement)
			.map((line) => splitMaskedLines(line))
	))
	const metadataLines = metadataReveals.flatMap(({ lines }) => lines)
	heroRevealSplits.push(...metadataReveals.map(({ split }) => split))
	const image = heroElements.media.querySelector<HTMLElement>('img')
	const controls = getOverlayControls(includeProjectHeader)
	const useCompactReveal = usesCompactRendering()

	heroRevealTargets = [
		content.value,
		heroElements.media,
		eyebrow,
		...eyebrowLines,
		...dividerTargets,
		...titleLines,
		...metadata,
		...metadataLines,
		...(caseContent.value ? [caseContent.value] : []),
		...controls,
		scrims.value,
		...(image ? [image] : [])
	]

	gsap.set(content.value, {
		autoAlpha: 0,
		y: 12
	})
	gsap.set(heroElements.media, useCompactReveal
		? { autoAlpha: 0 }
		: { clipPath: 'inset(100% 0 0 0)' }
	)
	if (image && !useCompactReveal) {
		gsap.set(image, {
			scale: 1.04,
			transformOrigin: 'center center'
		})
	}
	gsap.set(eyebrow, {
		autoAlpha: 1,
		y: 0
	})
	gsap.set(dividerTargets, {
		width: '0%'
	})
	gsap.set(metadata, {
		autoAlpha: 1,
		y: 0
	})
	gsap.set([...eyebrowLines, ...titleLines, ...metadataLines], {
		autoAlpha: 1,
		yPercent: 110
	})
	gsap.set(caseContent.value, {
		autoAlpha: 0,
		y: 12
	})
	gsap.set([...controls, scrims.value], { autoAlpha: 0 })
	gsap.set(bottomScrim.value, { autoAlpha: 0 })

	heroRevealTimeline = gsap.timeline({ paused: true })
		.to(content.value, {
			autoAlpha: 1,
			y: 0,
			duration: animationDurations.fast,
			ease: animationEases.out
		}, 0)
		.to(heroElements.media, useCompactReveal ? {
			autoAlpha: 1,
			duration: animationDurations.reveal,
			ease: animationEases.strongInOut
		} : {
			clipPath: 'inset(0% 0 0 0)',
			duration: animationDurations.reveal,
			ease: animationEases.strongInOut
		}, 0)

	if (image && !useCompactReveal) {
		// TODO: Replace this with the future enhanced case-image reveal.
		heroRevealTimeline.to(image, {
			scale: 1,
			duration: animationDurations.intro,
			ease: animationEases.strongOut
		}, 0)
	}

	heroRevealTimeline
		.to(eyebrowLines, {
			yPercent: 0,
			duration: animationDurations.fast,
			ease: animationEases.strongOut,
			stagger: animationStaggers.lines
		}, 0.1)
		.to(titleLines, {
			yPercent: 0,
			duration: animationDurations.base,
			ease: animationEases.strongOut,
			stagger: animationStaggers.lines
		}, 0.16)
		.to(dividerTargets, {
			width: '100%',
			duration: 0.9,
			ease: 'power3.inOut'
		}, 0.16)
		.to(metadataLines, {
			yPercent: 0,
			duration: animationDurations.base,
			ease: animationEases.strongOut,
			stagger: 0.035
		}, 0.38)
		.to(caseContent.value, {
			autoAlpha: 1,
			y: 0,
			duration: animationDurations.fast,
			ease: animationEases.out
		}, 0.46)
		.to([...controls, scrims.value], {
			autoAlpha: 1,
			duration: animationDurations.fast,
			ease: animationEases.out
		}, 0.52)

	return heroRevealTimeline
}

async function animateSimpleOpen() {
	if (
		!surface.value
		|| !content.value
		|| !scrims.value
	) return

	const sourceCardContents = getProjectCardContents(props.sourceCard)
	const destinationElements = [
		content.value,
		...getOverlayControls(),
		scrims.value
	]

	const useCompactTransition = usesCompactRendering()
	if (useCompactTransition) {
		setFullscreenGeometry()
		const sourceGeometry = getCompactSourceGeometry()
		const sourceClipPath = getInsetClipPath(
			sourceGeometry.rect,
			sourceGeometry.borderRadius
		)
		debugCompactGeometry('open', sourceGeometry.rect, sourceClipPath)
		gsap.set(surface.value, {
			clipPath: sourceClipPath,
			willChange: 'clip-path',
			'--project-card-color': getProjectBackground(displayedIndex.value)
		})
	} else {
		setInitialGeometry()
	}
	gsap.set(surface.value, { backgroundColor: 'transparent' })
	gsap.set(destinationElements, { autoAlpha: 0 })
	// Lay out the hero at its final viewport width while the surface clips it.
	// This prevents text from rewrapping as the card expands.
	gsap.set(content.value, {
		width: '100vw',
		height: '100dvh'
	})

	if (prefersReducedMotion()) {
		emit('source-ready')
		await nextTick()
		gsap.set(sourceCardContents, { clearProps: 'opacity,visibility' })
		gsap.set(surface.value, { clearProps: 'backgroundColor' })
		setFullscreenGeometry()
		gsap.set(surface.value, { clearProps: 'clipPath,willChange' })
		isOpeningVisibilityLocked.value = false
		gsap.set(destinationElements, { autoAlpha: 1 })
		gsap.set(content.value, { clearProps: 'width,height' })
		projectHeader.value?.focusClose()
		return
	}

	const heroRevealLayoutReady = waitForHeroRevealLayout()

	timeline = gsap.timeline({ paused: true })
		.to(sourceCardContents, {
			autoAlpha: 0,
			duration: 0.2,
			ease: 'power2.out'
		})

	await playTimeline(timeline)
	emit('source-ready')
	await nextTick()
	gsap.set(sourceCardContents, { clearProps: 'opacity,visibility' })
	gsap.set(surface.value, { clearProps: 'backgroundColor' })

	await heroRevealLayoutReady
	const caseHeroReveal = createCaseHeroReveal()

	timeline = gsap.timeline({ paused: true })
	timeline
		.to(surface.value, useCompactTransition ? {
			clipPath: FULLSCREEN_CLIP_PATH,
			duration: OPEN_DURATION,
			ease: animationEases.strongInOut
		} : {
			top: 0,
			left: 0,
			width: '100vw',
			height: '100dvh',
			borderRadius: 0,
			duration: OPEN_DURATION,
			ease: animationEases.strongInOut
		})
		.call(() => {
			isOpeningVisibilityLocked.value = false
		}, [], HERO_REVEAL_START)

	if (caseHeroReveal) {
		timeline.add(caseHeroReveal.paused(false), HERO_REVEAL_START)
	} else {
		timeline.set(destinationElements, { autoAlpha: 1 }, HERO_REVEAL_START)
	}

	await playTimeline(timeline)
	gsap.set(surface.value, { clearProps: 'clipPath,willChange' })
	setFullscreenGeometry()
	isOpeningVisibilityLocked.value = false
	cleanupHeroReveal()
	gsap.set(content.value, { clearProps: 'width,height' })
	projectHeader.value?.focusClose()

}

async function animateOpen() {
	if (!SHARED_ELEMENT_TRANSITIONS_ENABLED) {
		await animateSimpleOpen()
		return
	}

	if (
		!surface.value
		|| !content.value
		|| !scrims.value
	) return

	setInitialGeometry()

	if (prefersReducedMotion()) {
		emit('source-ready')
		setFullscreenGeometry()
		gsap.set(content.value, {
			autoAlpha: 1,
			y: 0
		})
		gsap.set([
			...Object.values(getHeroSharedElements() ?? {}),
			...getDetailElements(),
			...getOverlayControls(),
			scrims.value
		], {
			autoAlpha: 1
		})
		projectHeader.value?.focusClose()
		return
	}

	const sourceElements = getSharedElements(props.sourceCard)
	const heroElements = getHeroSharedElements()
	if (!sourceElements || !heroElements) {
		emit('source-ready')
		setFullscreenGeometry()
		gsap.set(content.value, { autoAlpha: 1, y: 0 })
		gsap.set([...getDetailElements(), ...getOverlayControls(), scrims.value], {
			autoAlpha: 1
		})
		projectHeader.value?.focusClose()
		return
	}

	const contentBackground = window.getComputedStyle(content.value).backgroundColor
	const sourceTargets = captureSharedTargets(sourceElements)

	setFullscreenGeometry()
	const fullscreenSurfaceHeight = surface.value.getBoundingClientRect().height
	const heroTargets = captureSharedTargets(heroElements)
	setInitialGeometry()

	if (
		!validateSharedTargets('source', sourceTargets)
		|| !validateSharedTargets('target', heroTargets)
	) {
		emit('source-ready')
		setFullscreenGeometry()
		gsap.set(content.value, { autoAlpha: 1, y: 0 })
		gsap.set([
			...Object.values(heroElements),
			...getDetailElements(),
			...getOverlayControls(),
			scrims.value
		], { autoAlpha: 1 })
		projectHeader.value?.focusClose()
		return
	}

	debugSharedTargets(sourceTargets, heroTargets)

	const representations = createSharedRepresentations(sourceElements, sourceTargets)
	if (!representations) {
		emit('source-ready')
		setFullscreenGeometry()
		gsap.set(content.value, { autoAlpha: 1, y: 0 })
		gsap.set([
			...Object.values(heroElements),
			...getDetailElements(),
			...getOverlayControls(),
			scrims.value
		], { autoAlpha: 1 })
		projectHeader.value?.focusClose()
		return
	}

	const mediaRepresentation = representations.find(({ key }) => key === 'media')
	const typographyRepresentations = representations.filter(({ key }) => key !== 'media')
	const typographyRepresentationElements = typographyRepresentations
		.map(({ element }) => element)
	const typographyHeroElements = Object.entries(heroElements)
		.filter(([key]) => key !== 'media')
		.map(([, element]) => element)
	const mediaHandoffPosition = activeOpenMediaTiming.position
		+ activeOpenMediaTiming.duration
	if (mediaRepresentation) {
		startSharedGeometryDebug(
			'open',
			surface.value,
			mediaRepresentation.element,
			heroElements.media
		)
		startSurfaceCloneSyncDebug(
			surface.value,
			mediaRepresentation.element
		)
	}
	debugTypographyMetrics('card', sourceElements, representations, 'hero', heroElements)
	await waitForStaticSharedDebug()
	emit('source-ready')

	gsap.set(Object.values(heroElements), { autoAlpha: 0 })
	gsap.set(getDetailElements(), {
		autoAlpha: 0,
		y: 16
	})
	gsap.set(getOverlayControls(), {
		autoAlpha: 0,
		y: -8
	})
	gsap.set(content.value, {
		autoAlpha: 1,
		y: 0,
		backgroundColor: contentBackground
	})
	gsap.set(scrims.value, { autoAlpha: 0 })

	timeline = gsap.timeline({
		onComplete: () => {
			debugTypographyHandoff(
				'open',
				representations,
				sourceElements,
				heroElements
			)
			clearSharedRepresentations()
			gsap.set(Object.values(heroElements), { autoAlpha: 1 })
			projectHeader.value?.focusClose()

		}
	})

	timeline
		.to(surface.value, {
			top: 0,
			left: 0,
			width: '100vw',
			...(EXPERIMENT_SURFACE_VERTICAL_LEAD ? {} : { height: '100dvh' }),
			borderRadius: 0,
			duration: activeOpenSurfaceTiming.duration,
			ease: activeOpenSurfaceTiming.ease,
			onUpdate: EXPERIMENT_SURFACE_VERTICAL_LEAD
				? function (this: gsap.core.Tween) {
					const timelineProgress = this.progress()
					const easedProgress = this.ratio
					const leadEnvelope = Math.sin(Math.PI * timelineProgress)
					const verticalProgress = Math.min(
						1,
						easedProgress
						+ SURFACE_VERTICAL_LEAD_AMOUNT * leadEnvelope
					)

					gsap.set(surface.value, {
						height: gsap.utils.interpolate(
							props.origin.height,
							fullscreenSurfaceHeight,
							verticalProgress
						)
					})
				}
				: undefined
		}, activeOpenSurfaceTiming.position)
		.to(getDetailElements(), {
			autoAlpha: 1,
			y: 0,
			duration: 0.32,
			ease: 'power2.out',
			stagger: 0.025
		}, 0.76)
		.to(scrims.value, {
			autoAlpha: 1,
			duration: 0.3,
			ease: 'power2.out'
		}, 0.78)
		.set(typographyHeroElements, {
			autoAlpha: 1
		}, 0.84)
		.to(typographyRepresentationElements, {
			autoAlpha: 0,
			duration: 0.12,
			ease: 'power1.out'
		}, 0.84)
		.set(heroElements.media, {
			autoAlpha: 1
		}, mediaHandoffPosition)
		.to(mediaRepresentation?.element ?? [], {
			autoAlpha: 0,
			duration: Math.min(0.12, OPEN_DURATION - mediaHandoffPosition),
			ease: 'power1.out'
		}, mediaHandoffPosition)
		.to(getOverlayControls(), {
			autoAlpha: 1,
			y: 0,
			duration: 0.22,
			ease: 'power2.out',
			stagger: 0.035
		}, 0.86)

	addSharedElementTweens(
		timeline,
		representations,
		sourceElements,
		sourceTargets,
		heroElements,
		heroTargets,
		0.02,
		0.82,
		{
			media: activeOpenMediaTiming
		},
		EXPERIMENT_MEDIA_VERTICAL_LAG
	)

	if (SLOW_SHARED_TRANSITION) {
		timeline.timeScale(0.5)
	}
}

function restoreClosePresentation() {
	if (content.value && scrims.value) {
		gsap.set([
			content.value,
			...getOverlayControls(),
			scrims.value
		], {
			clearProps: 'opacity,transform,visibility'
		})
	}

	if (surface.value) {
		setFullscreenGeometry()
		gsap.set(surface.value, {
			autoAlpha: 1,
			clearProps: 'clipPath,willChange'
		})
	}
}

async function hideCloseContent() {
	if (
		!content.value
		|| !scrims.value
	) return false

	isClosing.value = true
	killContextTransition()
	isTransitioning.value = false
	timeline?.kill()
	const destinationElements = [
		content.value,
		...getOverlayControls(),
		scrims.value
	]

	if (prefersReducedMotion()) {
		gsap.set(destinationElements, { autoAlpha: 0 })
		emit('content-hidden')
		return true
	}

	timeline = gsap.timeline({ paused: true })
		.to(destinationElements, {
			autoAlpha: 0,
			duration: 0.22,
			ease: 'power2.in'
		})

	const fadeStatus = await playTimeline(timeline, 'fade phase')
	if (fadeStatus !== 'complete') {
		restoreClosePresentation()
		return false
	}
	emit('content-hidden')
	return true
}

async function finishClose(target: WorkCloseTarget) {
	if (!surface.value) return false

	const useCompactTransition = usesCompactRendering()
	const { card: targetCard, rect, borderRadius: targetBorderRadius } = target

	if (prefersReducedMotion()) {
		gsap.set(surface.value, {
			top: rect.top,
			left: rect.left,
			width: rect.width,
			height: rect.height,
			borderRadius: targetBorderRadius
		})
		debugProjectClose('surface collapse start', { reducedMotion: true })
		debugProjectClose('collapse start', { reducedMotion: true })
		debugProjectClose('surface collapse complete', { reducedMotion: true })
		debugProjectClose('collapse end', { reducedMotion: true })
		debugProjectClose('card restoration start', { reducedMotion: true })
		emit('target-ready')
		await nextTick()
		debugProjectClose('card restoration complete', { reducedMotion: true })
		emit('close-complete')
		return true
	}

	debugProjectClose('surface collapse start')
	debugProjectClose('collapse start')
	if (useCompactTransition) {
		setFullscreenGeometry()
		const targetClipPath = getInsetClipPath(rect, targetBorderRadius)
		debugCompactGeometry('close', rect, targetClipPath)
		gsap.set(surface.value, {
			clipPath: FULLSCREEN_CLIP_PATH,
			willChange: 'clip-path'
		})
		timeline = gsap.timeline({ paused: true })
			.to(surface.value, {
				clipPath: targetClipPath,
				duration: CLOSE_DURATION,
				ease: animationEases.strongInOut
			})
	} else {
		timeline = gsap.timeline({ paused: true })
			.to(surface.value, {
				top: rect.top,
				left: rect.left,
				width: rect.width,
				height: rect.height,
				borderRadius: targetBorderRadius,
				duration: CLOSE_DURATION,
				ease: animationEases.strongInOut
			})
	}

	const surfaceCollapseStatus = await playTimeline(
		timeline,
		'surface collapse phase'
	)
	if (surfaceCollapseStatus !== 'complete') {
		gsap.set(surface.value, { clearProps: 'willChange' })
		restoreClosePresentation()
		return false
	}
	debugProjectClose('surface collapse complete')
	debugProjectClose('collapse end')
	gsap.set(surface.value, { clearProps: 'willChange' })
	const cardRestore = prepareCardRestore(targetCard)
	gsap.set(surface.value, { autoAlpha: 0 })
	debugProjectClose('card restoration start')
	emit('target-ready')
	await nextTick()

	if (!cardRestore) {
		debugProjectClose('card restoration complete', { skipped: true })
		emit('close-complete')
		return true
	}

	timeline = gsap.timeline({ paused: true })
		.to(cardRestore.thumbnail, {
			autoAlpha: 1,
			y: 0,
			duration: 0.28,
			ease: animationEases.out
		}, 0)
		.to(cardRestore.titleLines, {
			yPercent: 0,
			duration: 0.42,
			ease: animationEases.strongOut,
			stagger: 0.04
		}, 0.04)
		.to(cardRestore.descriptionLines, {
			yPercent: 0,
			duration: 0.38,
			ease: animationEases.strongOut,
			stagger: 0.04
		}, 0.08)
		.to(cardRestore.metadataTargets, {
			autoAlpha: 1,
			y: 0,
			duration: 0.26,
			ease: animationEases.out,
			stagger: 0.025
		}, 0.1)

	const cardRestoreStatus = await playTimeline(timeline, 'card restore phase')
	if (cardRestoreStatus !== 'complete') {
		cleanupCardRestore()
		restoreClosePresentation()
		return false
	}
	debugProjectClose('card restoration complete')
	cleanupCardRestore()
	emit('close-complete')
	return true
}

watch(
	() => props.projectIndex,
	(nextIndex) => {
		if (!isTransitioning.value) {
			displayedIndex.value = nextIndex
		}
	}
)

watch(displayedIndex, async () => {
	await nextTick()
	setupProjectNavDivider()
}, { flush: 'post' })

onMounted(async () => {
	window.addEventListener('keydown', handleKeydown)
	await nextTick()
	setupBottomScrim()
	await animateOpen()
	emit('opened')
	isOpening.value = false
	setupProjectNavDivider()

	// The coordinator must enter `open` before a close queued during opening is emitted.
	if (closeRequestedDuringOpen) {
		const closeSource = closeRequestedDuringOpen
		closeRequestedDuringOpen = undefined
		requestClose(closeSource)
	}
})

onBeforeUnmount(() => {
	timeline?.kill()
	cleanupHeroReveal()
	cleanupCardRestore()
	killContextTransition()
	cleanupBottomScrim()
	cleanupProjectNavDivider()
	window.removeEventListener('keydown', handleKeydown)
	isClosing.value = false
	isTransitioning.value = false
})

defineExpose({
	hideCloseContent,
	finishClose,
	cancelClose,
	navigateToProject,
	scrollToTop: () => content.value?.scrollTo({ top: 0 })
})
</script>
