<template>
	<nav
		ref="root"
		class="section-nav"
		:class="{
			'section-nav--open': isOpen,
			'section-nav--closing': isClosing,
			'section-nav--disabled': disabled
		}"
		:aria-label="t('sectionNavigation.label')"
		@focusout="handleFocusOut"
		@keydown="handleKeydown"
		@pointerenter="handlePointerEnter"
		@pointerleave="handlePointerLeave"
	>
		<div ref="panel" class="section-nav__panel">
			<button
				ref="trigger"
				class="section-nav__trigger"
				type="button"
				:aria-controls="listId"
				:aria-expanded="isOpen"
				:disabled="disabled"
				@click="handleTriggerClick"
				@focus="handleTriggerFocus"
				@pointerdown="handleTriggerPointerDown"
			>
				<span ref="labelWindow" class="section-nav__label-window" aria-live="polite">
					<span
						:key="displayedSectionId"
						ref="currentLabel"
						class="section-nav__label-layer"
					>
						<span class="section-nav__number">{{ displayedItem.number }}</span>
						<span>{{ t(displayedItem.labelKey) }}</span>
					</span>
					<span
						v-if="incomingItem"
						ref="incomingLabel"
						class="section-nav__label-layer section-nav__label-layer--incoming"
						aria-hidden="true"
					>
						<span class="section-nav__number">{{ incomingItem.number }}</span>
						<span>{{ t(incomingItem.labelKey) }}</span>
					</span>
				</span>
			</button>

			<ul
				:id="listId"
				ref="list"
				class="section-nav__list"
				:aria-hidden="!isOpen ? 'true' : undefined"
			>
				<li
					v-for="item in SECTION_NAVIGATION_ITEMS"
					:key="item.id"
					:ref="(element) => setItemRef(item.id, element)"
					class="section-nav__item"
					:class="{ 'section-nav__item--active': item.id === activeSectionId }"
				>
					<a
						:href="getItemHref(item.id)"
						class="section-nav__link"
						:aria-current="item.id === activeSectionId ? 'location' : undefined"
						:tabindex="isOpen && !disabled ? 0 : -1"
						data-stagger-link
						@click="handleItemClick($event, item.id)"
					>
						<span class="section-nav__link-content" data-stagger-link-container>
							<span class="section-nav__number">{{ item.number }}</span>
							<span>{{ t(item.labelKey) }}</span>
						</span>
					</a>
				</li>
			</ul>
		</div>
	</nav>
</template>

<script setup lang="ts">
import {
	computed,
	nextTick,
	onMounted,
	onUnmounted,
	ref,
	useId,
	watch,
	type ComponentPublicInstance
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
	SECTION_NAVIGATION_ACTIVE_THRESHOLD,
	SECTION_NAVIGATION_ITEMS,
	SECTION_NAVIGATION_OPEN_EXTRA_WIDTH,
	type SectionNavigationId
} from '../../config/sectionNavigation'
import { useLocalizedRoute } from '../../composables/useLocalizedRoute'
import { getLocaleParams } from '../../i18n'
import {
	gsap,
	prefersReducedMotion,
	registerGsapPlugins,
	ScrollTrigger,
	SplitText
} from '../../utils/animations/gsap'
import {
	animationEases,
	staggerLinkPreset
} from '../../utils/animations/presets'
import {
	initStaggerLinks,
	type StaggerLinksController
} from '../../utils/animations/staggerLinks'
import {
	getPortfolioScrollY,
	setPortfolioScrollY
} from '../../utils/animations/portfolioScrollSmoother'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { currentLocale } = useLocalizedRoute()
const props = withDefaults(defineProps<{
	disabled?: boolean
	fixedSectionId?: SectionNavigationId
}>(), {
	disabled: false,
	fixedSectionId: undefined
})
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const labelWindow = ref<HTMLElement | null>(null)
const currentLabel = ref<HTMLElement | null>(null)
const incomingLabel = ref<HTMLElement | null>(null)
const list = ref<HTMLUListElement | null>(null)
const isOpen = ref(false)
const isClosing = ref(false)
const initialSectionId = props.fixedSectionId ?? 'intro'
const activeSectionId = ref<SectionNavigationId>(initialSectionId)
const displayedSectionId = ref<SectionNavigationId>(initialSectionId)
const incomingSectionId = ref<SectionNavigationId | null>(null)
const listId = `section-navigation-${useId()}`
const itemElements = new Map<SectionNavigationId, HTMLLIElement>()
const displayedItem = computed(() => (
	SECTION_NAVIGATION_ITEMS.find((item) => item.id === displayedSectionId.value)
	?? SECTION_NAVIGATION_ITEMS[0]
))
const incomingItem = computed(() => (
	SECTION_NAVIGATION_ITEMS.find((item) => item.id === incomingSectionId.value)
))
const navigationLabelSignature = computed(() => (
	SECTION_NAVIGATION_ITEMS.map((item) => t(item.labelKey)).join('\u0000')
))
let animationContext: gsap.Context | undefined
let activeSectionTrigger: ReturnType<typeof ScrollTrigger.create> | undefined
let panelTween: gsap.core.Tween | undefined
let itemTimeline: gsap.core.Timeline | undefined
let labelTimeline: gsap.core.Timeline | undefined
let labelSplits: SplitText[] = []
let staggerLinks: StaggerLinksController | undefined
let scrollTween: gsap.core.Tween | undefined
let isProgrammaticScrolling = false
let triggerPointerType: string | undefined
let suppressTriggerFocusOpen = false
let labelTransitionId = 0
const LABEL_RESIZE_DURATION = 0.32
const ITEM_REVEAL_OFFSET = 8
const ITEM_REVEAL_DURATION = 0.24
const ITEM_REVEAL_STAGGER = 0.045
const ITEM_REVEAL_DELAY = 0.06
const PANEL_OPEN_EASE = 'back.out(1.15)'
const PANEL_CLOSE_EASE = 'back.in(1.15)'

async function refreshNavigationStaggerLinks() {
	staggerLinks?.destroy()
	staggerLinks = undefined
	await nextTick()

	if (root.value) staggerLinks = initStaggerLinks(root.value)
}

function setItemRef(
	sectionId: SectionNavigationId,
	element: Element | ComponentPublicInstance | null
) {
	if (element instanceof HTMLLIElement) {
		itemElements.set(sectionId, element)
		return
	}

	itemElements.delete(sectionId)
}

function getLabelWidth(label: HTMLElement) {
	if (!trigger.value) return label.offsetWidth

	const styles = window.getComputedStyle(trigger.value)
	return label.offsetWidth
		+ Number.parseFloat(styles.paddingLeft)
		+ Number.parseFloat(styles.paddingRight)
}

function getNavigationLinkWidth(link: HTMLElement) {
	const styles = window.getComputedStyle(link)
	const content = link.querySelector<HTMLElement>('.section-nav__link-content')
	const contentWidth = content?.scrollWidth ?? link.scrollWidth

	return Math.ceil(contentWidth)
		+ Number.parseFloat(styles.paddingLeft)
		+ Number.parseFloat(styles.paddingRight)
}

function getPanelMeasurements(open: boolean) {
	if (!trigger.value || !list.value) return

	if (!open) {
		const visibleLabel = incomingLabel.value ?? currentLabel.value
		if (!visibleLabel) return

		return {
			width: getLabelWidth(visibleLabel),
			height: trigger.value.offsetHeight
		}
	}

	const itemWidths = Array.from(itemElements.values()).map((item) => {
		const link = item.querySelector<HTMLElement>('.section-nav__link')
		return link ? getNavigationLinkWidth(link) : item.scrollWidth
	})

	return {
		width: Math.max(...itemWidths) + SECTION_NAVIGATION_OPEN_EXTRA_WIDTH,
		height: list.value.scrollHeight
	}
}

async function renderNavigationState(animate = true) {
	await nextTick()

	if (!panel.value) return

	const measurements = getPanelMeasurements(isOpen.value)
	if (!measurements) return

	panelTween?.kill()
	panelTween = gsap.to(panel.value, {
		...measurements,
		duration: animate && !prefersReducedMotion() ? 0.45 : 0,
		ease: isOpen.value ? PANEL_OPEN_EASE : PANEL_CLOSE_EASE,
		overwrite: true,
		onComplete: () => {
			panelTween = undefined
			if (!isOpen.value) isClosing.value = false
		}
	})
}

function getNavigationItems() {
	return SECTION_NAVIGATION_ITEMS
		.map((item) => itemElements.get(item.id))
		.filter((item): item is HTMLLIElement => Boolean(item))
}

function getItemTargetOpacity(item: HTMLLIElement) {
	if (!root.value) return 1

	const styles = window.getComputedStyle(root.value)
	const property = item.classList.contains('section-nav__item--active')
		|| item.matches(':focus-within')
		? '--section-nav-active-opacity'
		: item.matches(':hover')
			? '--section-nav-hover-opacity'
			: '--section-nav-item-opacity'

	return Number.parseFloat(styles.getPropertyValue(property))
}

function animateNavigationItems(open: boolean) {
	const items = getNavigationItems()
	if (items.length === 0) return

	itemTimeline?.kill()
	itemTimeline = undefined

	if (prefersReducedMotion()) {
		gsap.set(items, open
			? { clearProps: 'opacity,transform,transition' }
			: { y: 0, opacity: 0, transition: 'none' }
		)
		return
	}

	gsap.set(items, { transition: 'none' })
	itemTimeline = gsap.timeline({
		onComplete: () => {
			itemTimeline = undefined
			gsap.set(items, open
				? { clearProps: 'opacity,transform,transition' }
				: { clearProps: 'transition' }
			)
		}
	})

	itemTimeline.to(items, {
		y: open ? 0 : ITEM_REVEAL_OFFSET,
		opacity: open
			? (_index: number, item: HTMLLIElement) => getItemTargetOpacity(item)
			: 0,
		duration: ITEM_REVEAL_DURATION,
		ease: open ? animationEases.out : animationEases.inOut,
		stagger: {
			each: ITEM_REVEAL_STAGGER,
			from: open ? 'start' : 'end'
		}
	}, open ? ITEM_REVEAL_DELAY : 0)
}

function openNavigation() {
	if (props.disabled || isOpen.value) return

	isClosing.value = false
	isOpen.value = true
	animateNavigationItems(true)
	void renderNavigationState()
}

function closeNavigation() {
	if (!isOpen.value) return

	isOpen.value = false
	isClosing.value = true
	animateNavigationItems(false)
	if (incomingSectionId.value) return

	void renderNavigationState()
}

function handlePointerEnter(event: PointerEvent) {
	if (event.pointerType === 'mouse') openNavigation()
}

function handlePointerLeave(event: PointerEvent) {
	if (
		event.pointerType === 'mouse'
		&& !root.value?.contains(document.activeElement)
	) closeNavigation()
}

function handleFocusOut(event: FocusEvent) {
	if (
		event.relatedTarget instanceof Node
		&& root.value?.contains(event.relatedTarget)
	) return

	closeNavigation()
}

function handleTriggerPointerDown(event: PointerEvent) {
	triggerPointerType = event.pointerType
}

function handleTriggerFocus() {
	if (suppressTriggerFocusOpen) return
	if (triggerPointerType === 'touch' || triggerPointerType === 'pen') return

	openNavigation()
	if (triggerPointerType === undefined) {
		void nextTick(() => focusItem(activeSectionId.value))
	}
}

function handleTriggerClick() {
	if (triggerPointerType === 'touch' || triggerPointerType === 'pen') {
		isOpen.value ? closeNavigation() : openNavigation()
	} else {
		openNavigation()
	}

	triggerPointerType = undefined
}

function focusItem(sectionId: SectionNavigationId) {
	itemElements.get(sectionId)?.querySelector<HTMLAnchorElement>('a')?.focus()
}

function handleKeydown(event: KeyboardEvent) {
	if (props.disabled) return

	const itemIds = SECTION_NAVIGATION_ITEMS.map((item) => item.id)
	const focusedItem = document.activeElement?.closest<HTMLLIElement>(
		'.section-nav__item'
	)
	const focusedIndex = focusedItem
		? itemIds.findIndex((id) => itemElements.get(id) === focusedItem)
		: -1

	if (event.key === 'Escape') {
		event.preventDefault()
		closeNavigation()
		trigger.value?.focus()
		return
	}

	if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

	event.preventDefault()
	openNavigation()

	if (event.key === 'Home') {
		focusItem(itemIds[0])
		return
	}

	if (event.key === 'End') {
		focusItem(itemIds[itemIds.length - 1])
		return
	}

	const direction = event.key === 'ArrowDown' ? 1 : -1
	const nextIndex = focusedIndex < 0
		? (direction > 0 ? 0 : itemIds.length - 1)
		: (focusedIndex + direction + itemIds.length) % itemIds.length
	focusItem(itemIds[nextIndex])
}

function cleanupLabelTransition(commitIncoming = false) {
	labelTimeline?.kill()
	labelTimeline = undefined
	labelSplits.forEach((split) => split.revert())
	labelSplits = []
	gsap.set(labelWindow.value, { clearProps: 'width' })

	if (commitIncoming && incomingSectionId.value) {
		displayedSectionId.value = incomingSectionId.value
	}

	incomingSectionId.value = null
}

async function animateCollapsedLabel(sectionId: SectionNavigationId) {
	if (sectionId === displayedSectionId.value && !incomingSectionId.value) return

	const transitionId = ++labelTransitionId
	const wasNavigationOpen = isOpen.value
	cleanupLabelTransition(true)
	incomingSectionId.value = sectionId
	await nextTick()
	if (transitionId !== labelTransitionId) return

	if (
		!panel.value
		|| !trigger.value
		|| !labelWindow.value
		|| !currentLabel.value
		|| !incomingLabel.value
		|| prefersReducedMotion()
	) {
		displayedSectionId.value = sectionId
		incomingSectionId.value = null
		gsap.set(labelWindow.value, { clearProps: 'width' })
		if (!isOpen.value) void renderNavigationState(false)
		return
	}

	const outgoingLabelWidth = currentLabel.value.offsetWidth
	const incomingLabelWidth = incomingLabel.value.offsetWidth
	const incomingPanelWidth = getLabelWidth(incomingLabel.value)

	const outgoingSplit = new SplitText(currentLabel.value, {
		type: 'chars',
		charsClass: 'section-nav__label-char'
	})
	const incomingSplit = new SplitText(incomingLabel.value, {
		type: 'chars',
		charsClass: 'section-nav__label-char'
	})
	labelSplits = [outgoingSplit, incomingSplit]

	gsap.set(labelWindow.value, { width: outgoingLabelWidth })
	gsap.set(incomingSplit.chars, { yPercent: 110 })
	if (!isOpen.value) {
		panelTween?.kill()
		panelTween = undefined
	}

	labelTimeline = gsap.timeline({
		onComplete: () => {
			if (transitionId !== labelTransitionId) return

			labelTimeline = undefined
			labelSplits.forEach((split) => split.revert())
			labelSplits = []
			displayedSectionId.value = sectionId
			incomingSectionId.value = null
			void nextTick(() => {
				gsap.set(labelWindow.value, { clearProps: 'width' })
				if (!isOpen.value) void renderNavigationState(false)
			})
		}
	})

	if (!isOpen.value) {
		labelTimeline
			.to(panel.value, {
				width: incomingPanelWidth,
				height: trigger.value.offsetHeight,
				duration: LABEL_RESIZE_DURATION,
				ease: wasNavigationOpen ? PANEL_CLOSE_EASE : animationEases.inOut,
				overwrite: true,
				onComplete: () => {
					if (!isOpen.value) isClosing.value = false
				}
			}, 0)
			.to(labelWindow.value, {
				width: incomingLabelWidth,
				duration: LABEL_RESIZE_DURATION,
				ease: animationEases.inOut,
				overwrite: true
			}, 0)
	}

	labelTimeline
		.to(outgoingSplit.chars, {
			yPercent: -110,
			...staggerLinkPreset,
			overwrite: true
		}, 0)
		.to(incomingSplit.chars, {
			yPercent: 0,
			...staggerLinkPreset,
			overwrite: true
		}, isOpen.value ? 0 : LABEL_RESIZE_DURATION)
}

function setActiveSection(sectionId: SectionNavigationId) {
	if (activeSectionId.value === sectionId) return

	activeSectionId.value = sectionId
	void animateCollapsedLabel(sectionId)
}

function getItemHref(sectionId: SectionNavigationId) {
	if (route.name === 'home') return `#${sectionId}`

	return router.resolve({
		name: 'home',
		params: getLocaleParams(currentLocale.value),
		hash: `#${sectionId}`
	}).href
}

function updateLocationHash(sectionId: SectionNavigationId) {
	const nextUrl = new URL(window.location.href)
	nextUrl.hash = sectionId
	window.history.replaceState(window.history.state, '', nextUrl)
}

function updateActiveSection() {
	if (props.fixedSectionId) {
		setActiveSection(props.fixedSectionId)
		return
	}

	if (route.name !== 'home' || isProgrammaticScrolling) return

	const threshold = window.innerHeight * SECTION_NAVIGATION_ACTIVE_THRESHOLD
	let nextActiveId: SectionNavigationId = SECTION_NAVIGATION_ITEMS[0].id

	SECTION_NAVIGATION_ITEMS.forEach((item) => {
		const section = document.getElementById(item.id)
		if (section && section.getBoundingClientRect().top <= threshold) {
			nextActiveId = item.id
		}
	})

	setActiveSection(nextActiveId)
}

function scrollToSection(sectionId: SectionNavigationId) {
	const section = document.getElementById(sectionId)
	if (!section) return

	scrollTween?.kill()
	isProgrammaticScrolling = true
	setActiveSection(sectionId)
	updateLocationHash(sectionId)

	const configuredScrollY = Number.parseFloat(
		section.dataset.sectionNavigationScrollY ?? ''
	)
	const targetY = Number.isFinite(configuredScrollY)
		? configuredScrollY
		: getPortfolioScrollY() + section.getBoundingClientRect().top
	if (prefersReducedMotion()) {
		setPortfolioScrollY(targetY)
		isProgrammaticScrolling = false
		updateActiveSection()
		return
	}

	const scrollPosition = { y: getPortfolioScrollY() }
	scrollTween = gsap.to(scrollPosition, {
		y: targetY,
		duration: 0.9,
		ease: animationEases.inOut,
		onUpdate() {
			setPortfolioScrollY(scrollPosition.y)
		},
		onComplete() {
			scrollTween = undefined
			isProgrammaticScrolling = false
			updateActiveSection()
		}
	})
}

async function selectSection(sectionId: SectionNavigationId) {
	setActiveSection(sectionId)
	closeNavigation()
	suppressTriggerFocusOpen = true
	trigger.value?.focus({ preventScroll: true })
	requestAnimationFrame(() => {
		suppressTriggerFocusOpen = false
	})

	if (route.name !== 'home') {
		await router.push({
			name: 'home',
			params: getLocaleParams(currentLocale.value),
			hash: `#${sectionId}`
		})
		await nextTick()
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
	}

	scrollToSection(sectionId)
}

function handleItemClick(event: MouseEvent, sectionId: SectionNavigationId) {
	event.preventDefault()
	void selectSection(sectionId)
}

function setupActiveSectionDetection() {
	activeSectionTrigger?.kill()
	activeSectionTrigger = undefined

	if (props.fixedSectionId) {
		setActiveSection(props.fixedSectionId)
		return
	}

	if (route.name !== 'home') return

	activeSectionTrigger = ScrollTrigger.create({
		start: 0,
		end: 'max',
		refreshPriority: -2,
		onRefresh: updateActiveSection,
		onUpdate: updateActiveSection
	})
	updateActiveSection()
}

function handleDocumentPointerDown(event: PointerEvent) {
	if (event.target instanceof Node && !root.value?.contains(event.target)) {
		closeNavigation()
	}
}

onMounted(async () => {
	registerGsapPlugins()
	await nextTick()

	if (root.value) {
		animationContext = gsap.context(() => {
			setupActiveSectionDetection()
		}, root.value)
	}

	await renderNavigationState(false)
	await refreshNavigationStaggerLinks()
	gsap.set(getNavigationItems(), {
		y: ITEM_REVEAL_OFFSET,
		opacity: 0,
		transition: 'none'
	})
	gsap.set(root.value, { visibility: 'visible' })
	document.addEventListener('pointerdown', handleDocumentPointerDown)
})

watch(() => route.name, async () => {
	await nextTick()
	setupActiveSectionDetection()
})

watch(() => props.disabled, (disabled) => {
	if (!disabled) return

	triggerPointerType = undefined
	closeNavigation()
})

watch(() => props.fixedSectionId, () => {
	setupActiveSectionDetection()
})

watch(navigationLabelSignature, async () => {
	await refreshNavigationStaggerLinks()
	void renderNavigationState(false)
}, { flush: 'pre' })

onUnmounted(() => {
	labelTransitionId += 1
	activeSectionTrigger?.kill()
	panelTween?.kill()
	itemTimeline?.kill()
	cleanupLabelTransition()
	staggerLinks?.destroy()
	scrollTween?.kill()
	animationContext?.revert()
	itemElements.clear()
	document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>
