<template>
	<Teleport to="body">
		<div
			class="project-layer-prototype"
			:class="{ 'project-layer-prototype--opening': isOpening }"
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
				<div ref="content" class="project-layer-prototype__content">
					<ProjectHero
						ref="projectHero"
						:project="displayedProject"
					/>
					<div ref="caseContent" class="project-layer-prototype__copy">
						<component
							:is="activeCaseComponent"
							:key="displayedProject.case"
						/>
					</div>
				</div>

				<button
					ref="closeButton"
					class="project-layer-prototype__close"
					type="button"
					aria-label="Close project"
					@click="requestClose"
				>
					Close
				</button>

				<nav ref="projectNav" class="project-layer-prototype__nav" aria-label="Project navigation">
					<a
						v-if="previousProject"
						ref="previousLink"
						class="project-layer-prototype__nav-link"
						href="#"
						:aria-disabled="isPreviousDisabled"
						data-stagger-link
						@click.prevent="navigate('previous', true)"
					>
						<span data-stagger-link-container>← {{ previousProject.name }}</span>
					</a>
					<a
						v-if="nextProject"
						ref="nextLink"
						class="project-layer-prototype__nav-link project-layer-prototype__nav-link--next"
						href="#"
						:aria-disabled="isNextDisabled"
						data-stagger-link
						@click.prevent="navigate('next', true)"
					>
						<span data-stagger-link-container>{{ nextProject.name }} →</span>
					</a>
				</nav>

				<p class="sr-only" aria-live="polite" aria-atomic="true">
					{{ announcement }}
				</p>

				<div ref="scrims" class="project-layer-prototype__scrims" aria-hidden="true">
					<span class="project-layer-prototype__scrim project-layer-prototype__scrim--top" />
					<span class="project-layer-prototype__scrim project-layer-prototype__scrim--bottom" />
				</div>
			</article>
		</div>
		<div
			ref="sharedTransitionLayer"
			class="project-layer-prototype__shared-elements"
			aria-hidden="true"
		/>
	</Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
	gsap,
	prefersReducedMotion,
	registerGsapPlugins,
	SplitText
} from '../../utils/animations/gsap'
import {
	initStaggerLinks,
	type StaggerLinksController
} from '../../utils/animations/staggerLinks'
import { animationEases } from '../../utils/animations/presets'
import type { Project } from '../../types/project'
import ProjectHero from './ProjectHero.vue'
import { getCaseComponent } from './cases/caseRegistry'

type LayerOrigin = {
	top: number
	left: number
	width: number
	height: number
	borderRadius: string
}

type NavigationDirection = 'previous' | 'next'
type SharedElementKey = 'media' | 'year' | 'title' | 'intro' | 'tags'
type SharedElementMap = Record<SharedElementKey, HTMLElement>

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

const props = defineProps<{
	projects: Project[]
	projectIndex: number
	origin: LayerOrigin
	sourceCard: HTMLElement
}>()

const emit = defineEmits<{
	close: []
	'change-project': [nextIndex: number]
	'header-contrast-change': [isActive: boolean]
	'source-ready': []
	'target-ready': []
}>()

registerGsapPlugins()

const surface = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const projectHero = ref<InstanceType<typeof ProjectHero> | null>(null)
const caseContent = ref<HTMLElement | null>(null)
const scrims = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const projectNav = ref<HTMLElement | null>(null)
const sharedTransitionLayer = ref<HTMLElement | null>(null)
const previousLink = ref<HTMLAnchorElement | null>(null)
const nextLink = ref<HTMLAnchorElement | null>(null)
const displayedIndex = ref(props.projectIndex)
const isTransitioning = ref(false)
const isOpening = ref(true)
const isClosing = ref(false)
const announcement = ref('')
const initialProjectClass = `project-card--${props.projectIndex + 1}`

const displayedProject = computed(() => props.projects[displayedIndex.value])
const activeCaseComponent = computed(() => (
	getCaseComponent(displayedProject.value.case)
))
const previousProject = computed(() => props.projects[displayedIndex.value - 1])
const nextProject = computed(() => props.projects[displayedIndex.value + 1])
const isPreviousDisabled = computed(() => (
	isOpening.value
	|| isTransitioning.value
	|| isClosing.value
	|| displayedIndex.value === 0
))
const isNextDisabled = computed(() => (
	isOpening.value
	|| isTransitioning.value
	|| isClosing.value
	|| displayedIndex.value === props.projects.length - 1
))

const OPEN_DURATION = 1
const CLOSE_DURATION = 0.9
const OPEN_HEADER_CONTRAST_POSITION = 0.58
const CLOSE_HEADER_CONTRAST_POSITION = CLOSE_DURATION * (
	1 - OPEN_HEADER_CONTRAST_POSITION / OPEN_DURATION
)
const TEXT_OUT_DURATION = 0.24
const CONTEXT_FADE_DURATION = 0.48
const TEXT_IN_DURATION = 0.5
const DEBUG_SHARED_TRANSITION = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugSharedTransition')
const DEBUG_TYPOGRAPHY_DRIFT = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugTypographyDrift')
const DEBUG_SHARED_GEOMETRY = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugSharedGeometry')
const DEBUG_SURFACE_CLONE_SYNC = import.meta.env.DEV
	&& new URLSearchParams(window.location.search).has('debugSurfaceCloneSync')
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
let navStaggerLinks: StaggerLinksController | undefined
let sharedRepresentations: SharedElementRepresentation[] = []
let previousDocumentOverflow = ''
let closeRequestedDuringOpen = false
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

function getHeroSharedElements(): SharedElementMap | undefined {
	const elements = projectHero.value?.getSharedElements()
	if (
		!elements?.media
		|| !elements.year
		|| !elements.title
		|| !elements.intro
		|| !elements.tags
	) return undefined

	return elements as SharedElementMap
}

function getHeroMedia() {
	return getHeroSharedElements()?.media ?? null
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

function getOverlayControls() {
	return [closeButton.value, projectNav.value].filter(Boolean) as HTMLElement[]
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

function isHeroContextVisible(elements: SharedElementMap) {
	// The media and textual anchors are vertically distributed through the hero
	// and will rarely all intersect the viewport at once. One visible shared
	// anchor is enough to establish that the user is still viewing the hero.
	return Object.values(elements).some((element) => {
		const rect = element.getBoundingClientRect()

		return rect.bottom > 0
			&& rect.top < window.innerHeight
			&& rect.right > 0
			&& rect.left < window.innerWidth
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

function playTimeline(animation: gsap.core.Timeline) {
	return new Promise<void>((resolve) => {
		animation.eventCallback('onComplete', resolve)
		animation.play(0)
	})
}

function revertTransitionSplits() {
	transitionSplits.forEach((split) => split.revert())
	transitionSplits = []
}

function splitTransitionText() {
	if (!content.value) return []

	transitionSplits = Array.from(
		content.value.querySelectorAll<HTMLElement>('[data-project-transition-text]')
	).map((element) => new SplitText(element, {
		type: 'chars',
		charsClass: 'project-context-char'
	}))

	return transitionSplits.flatMap((split) => split.chars)
}

function killContextTransition() {
	transitionTimeline?.kill()
	transitionTimeline = undefined
	revertTransitionSplits()
}

function setupNavStaggerLinks() {
	navStaggerLinks?.destroy()
	navStaggerLinks = projectNav.value
		? initStaggerLinks(projectNav.value)
		: undefined
}

function restoreNavigationFocus(direction: NavigationDirection) {
	const preferredButton = direction === 'previous'
		? previousLink.value
		: nextLink.value
	const fallbackButton = direction === 'previous'
		? nextLink.value
		: previousLink.value

	if (preferredButton && preferredButton.getAttribute('aria-disabled') !== 'true') {
		preferredButton.focus({ preventScroll: true })
		return
	}

	if (fallbackButton && fallbackButton.getAttribute('aria-disabled') !== 'true') {
		fallbackButton.focus({ preventScroll: true })
	}
}

function requestClose() {
	if (isClosing.value) return

	if (isOpening.value) {
		closeRequestedDuringOpen = true
		return
	}

	isClosing.value = true
	emit('close')
}

async function navigate(direction: NavigationDirection, restoreFocus = false) {
	if (isOpening.value || isTransitioning.value || isClosing.value) return

	const nextIndex = displayedIndex.value + (direction === 'next' ? 1 : -1)
	if (nextIndex < 0 || nextIndex >= props.projects.length) return

	isTransitioning.value = true
	announcement.value = ''
	killContextTransition()
	navStaggerLinks?.destroy()
	navStaggerLinks = undefined

	if (prefersReducedMotion()) {
		displayedIndex.value = nextIndex
		emit('change-project', nextIndex)
		await nextTick()
		gsap.set(surface.value, {
			'--project-card-color': getProjectBackground(nextIndex)
		})
		announcement.value = `${displayedProject.value.name} project loaded`
		isTransitioning.value = false
		setupNavStaggerLinks()
		if (restoreFocus) restoreNavigationFocus(direction)
		return
	}

	const outgoingChars = splitTransitionText()
	transitionTimeline = gsap.timeline({ paused: true })
	transitionTimeline
		.to(outgoingChars, {
			y: '-0.25em',
			autoAlpha: 0,
			duration: TEXT_OUT_DURATION,
			ease: 'power2.in',
			stagger: {
				each: 0.006
			}
		}, 0)
		.to(getTransitionBodies(), {
			autoAlpha: 0,
			duration: TEXT_OUT_DURATION,
			ease: 'power2.in'
		}, 0)
		.to(getHeroMedia(), {
			autoAlpha: 0,
			duration: 0.28,
			ease: 'power2.inOut'
		}, 0)

	await playTimeline(transitionTimeline)
	revertTransitionSplits()

	displayedIndex.value = nextIndex
	emit('change-project', nextIndex)
	await nextTick()

	const incomingChars = splitTransitionText()
	gsap.set(incomingChars, {
		y: '0.42em',
		autoAlpha: 0
	})
	gsap.set([getHeroMedia(), ...getTransitionBodies()], {
		autoAlpha: 0
	})

	transitionTimeline = gsap.timeline({ paused: true })
	transitionTimeline
		.to(surface.value, {
			'--project-card-color': getProjectBackground(nextIndex),
			duration: CONTEXT_FADE_DURATION,
			ease: 'power2.inOut'
		}, 0)
		.to(getHeroMedia(), {
			autoAlpha: 1,
			duration: CONTEXT_FADE_DURATION,
			ease: 'power2.out'
		}, 0.04)
		.to(getTransitionBodies(), {
			autoAlpha: 1,
			duration: 0.4,
			ease: 'power2.out'
		}, 0.1)
		.to(incomingChars, {
			y: 0,
			autoAlpha: 1,
			duration: TEXT_IN_DURATION,
			ease: 'back.out(1.25)',
			stagger: {
				each: 0.012
			}
		}, 0.08)

	await playTimeline(transitionTimeline)
	revertTransitionSplits()
	transitionTimeline = undefined
	announcement.value = `${displayedProject.value.name} project loaded`
	isTransitioning.value = false
	setupNavStaggerLinks()

	if (restoreFocus) {
		await nextTick()
		restoreNavigationFocus(direction)
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		requestClose()
		return
	}

	if (event.key === 'ArrowLeft') {
		event.preventDefault()
		void navigate('previous')
	}

	if (event.key === 'ArrowRight') {
		event.preventDefault()
		void navigate('next')
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

async function animateOpen() {
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
		isOpening.value = false
		setupNavStaggerLinks()
		emit('header-contrast-change', true)
		closeButton.value?.focus()
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
		isOpening.value = false
		setupNavStaggerLinks()
		emit('header-contrast-change', true)
		closeButton.value?.focus()
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
		isOpening.value = false
		setupNavStaggerLinks()
		emit('header-contrast-change', true)
		closeButton.value?.focus()
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
		isOpening.value = false
		setupNavStaggerLinks()
		emit('header-contrast-change', true)
		closeButton.value?.focus()
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
			isOpening.value = false
			setupNavStaggerLinks()
			closeButton.value?.focus()

			if (closeRequestedDuringOpen) {
				closeRequestedDuringOpen = false
				requestClose()
			}
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
		.call(() => {
			emit('header-contrast-change', true)
		}, [], OPEN_HEADER_CONTRAST_POSITION)

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

function animateSimpleClose(targetCard: HTMLElement) {
	if (!surface.value || !content.value) return Promise.resolve()

	const target = targetCard.getBoundingClientRect()

	return new Promise<void>((resolve) => {
		timeline = gsap.timeline({ onComplete: resolve })
		timeline
			.to(content.value, {
				autoAlpha: 0,
				duration: 0.22,
				ease: 'power2.in'
			})
			.to(surface.value, {
				top: target.top,
				left: target.left,
				width: target.width,
				height: target.height,
				borderRadius: window.getComputedStyle(targetCard).borderRadius,
				duration: CLOSE_DURATION,
				ease: 'power3.inOut'
			}, 0)
	})
}

async function animateClose(targetCard: HTMLElement) {
	killContextTransition()
	isTransitioning.value = false

	if (
		!surface.value
		|| !content.value
		|| !scrims.value
		|| prefersReducedMotion()
	) {
		emit('header-contrast-change', false)
		emit('target-ready')
		await nextTick()
		return
	}

	timeline?.kill()
	clearSharedRepresentations()

	const heroElements = getHeroSharedElements()
	const targetElements = getSharedElements(targetCard)

	// Never move the detail scroller to manufacture a shared close transition.
	if (
		!heroElements
		|| !targetElements
		|| !isHeroContextVisible(heroElements)
	) {
		await animateSimpleClose(targetCard)
		emit('target-ready')
		await nextTick()
		return
	}

	const heroSnapshots = captureSharedTargets(heroElements)
	const targetSnapshots = captureSharedTargets(targetElements)

	if (
		!validateSharedTargets('source', heroSnapshots)
		|| !validateSharedTargets('target', targetSnapshots)
	) {
		await animateSimpleClose(targetCard)
		emit('target-ready')
		await nextTick()
		return
	}

	debugSharedTargets(heroSnapshots, targetSnapshots)

	const representations = createSharedRepresentations(heroElements, heroSnapshots)
	if (!representations) {
		await animateSimpleClose(targetCard)
		emit('target-ready')
		await nextTick()
		return
	}

	const mediaRepresentation = representations.find(({ key }) => key === 'media')
	if (mediaRepresentation) {
		startSharedGeometryDebug(
			'close',
			surface.value,
			mediaRepresentation.element,
			heroElements.media
		)
	}
	debugTypographyMetrics('hero', heroElements, representations, 'card', targetElements)
	await waitForStaticSharedDebug()

	const target = targetCard.getBoundingClientRect()
	const contentBackground = window.getComputedStyle(content.value).backgroundColor
	gsap.set(Object.values(heroElements), { autoAlpha: 0 })

	await new Promise<void>((resolve) => {
		timeline = gsap.timeline({ onComplete: resolve })

		timeline
			.to([...getDetailElements(), ...getOverlayControls(), scrims.value], {
				autoAlpha: 0,
				duration: 0.18,
				ease: 'power2.in',
				stagger: 0.015
			})
			.to(content.value, {
				backgroundColor: 'transparent',
				duration: 0.38,
				ease: 'power2.inOut'
			}, 0.34)
			.to(surface.value, {
				top: target.top,
				left: target.left,
				width: target.width,
				height: target.height,
				borderRadius: window.getComputedStyle(targetCard).borderRadius,
				duration: CLOSE_DURATION,
				ease: 'power3.inOut'
			}, 0)
			.call(() => {
				emit('header-contrast-change', false)
			}, [], CLOSE_HEADER_CONTRAST_POSITION)

		addSharedElementTweens(
			timeline,
			representations,
			heroElements,
			heroSnapshots,
			targetElements,
			targetSnapshots,
			0,
			CLOSE_DURATION
		)

		// Preserve the computed value so GSAP can interpolate from the current layer color.
		gsap.set(content.value, { backgroundColor: contentBackground })

		if (SLOW_SHARED_TRANSITION) {
			timeline.timeScale(0.5)
		}
	})

	// Hand visibility back only after the clones have reached the live card.
	// Waiting for Vue's render prevents a frame where both representations are hidden.
	debugTypographyHandoff(
		'close-before-handoff',
		representations,
		heroElements,
		targetElements
	)
	emit('target-ready')
	await nextTick()
	debugTypographyHandoff(
		'close-after-handoff',
		representations,
		heroElements,
		targetElements
	)
	clearSharedRepresentations()
}

watch(
	() => props.projectIndex,
	(nextIndex) => {
		if (!isTransitioning.value) {
			displayedIndex.value = nextIndex
		}
	}
)

onMounted(async () => {
	previousDocumentOverflow = document.documentElement.style.overflow
	document.documentElement.style.overflow = 'hidden'
	window.addEventListener('keydown', handleKeydown)
	await nextTick()
	await animateOpen()
})

onBeforeUnmount(() => {
	timeline?.kill()
	finishSharedGeometryDebug()
	finishSurfaceCloneSyncDebug()
	killContextTransition()
	navStaggerLinks?.destroy()
	navStaggerLinks = undefined
	clearSharedRepresentations()
	emit('header-contrast-change', false)
	document.documentElement.style.overflow = previousDocumentOverflow
	window.removeEventListener('keydown', handleKeydown)
})

defineExpose({
	animateClose
})
</script>
