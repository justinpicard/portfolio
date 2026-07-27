<template>
	<component
		:is="componentType"
		ref="root"
		v-bind="componentAttrs"
		:class="buttonClasses"
		data-stagger-link
		@mouseenter="onEnter"
		@mouseleave="onLeave"
		@click="onClick"
	>
		<span data-stagger-link-container>{{ label }}</span>
		<div class="btn-bg rounded-pill"></div>
	</component>
</template>

<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { computed, nextTick, onMounted, onUnmounted, ref, useAttrs, watch } from 'vue'
import { initStaggerLinks, type StaggerLinksController } from '../utils/animations/staggerLinks'

defineOptions({
	inheritAttrs: false
})

type ButtonVariant = 'filled' | 'outlined' | 'ghost'
type ButtonColor = 'light' | 'dark' | 'primary'
type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonType = 'button' | 'submit' | 'reset'

const props = withDefaults(defineProps<{
	label: string
	to?: RouteLocationRaw
	href?: string
	target?: string
	rel?: string
	type?: ButtonType
	variant?: ButtonVariant
	color?: ButtonColor
	size?: ButtonSize
	disabled?: boolean
	customClass?: string | string[] | Record<string, boolean>
}>(), {
	type: 'button',
	variant: 'outlined',
	color: 'light',
	size: 'md',
	disabled: false
})

const emit = defineEmits<{
	click: [event: MouseEvent]
	mouseenter: [event: MouseEvent]
	mouseleave: [event: MouseEvent]
}>()

const attrs = useAttrs()
const root = ref<HTMLElement | { $el: HTMLElement } | null>(null)
let staggerLinks: StaggerLinksController | undefined

const isRouterLink = computed(() => Boolean(props.to))
const isAnchor = computed(() => !props.to && Boolean(props.href))

const componentType = computed(() => {
	if (isRouterLink.value) {
		return RouterLink
	}

	if (isAnchor.value) {
		return 'a'
	}

	return 'button'
})

const resolvedRel = computed(() => {
	if (props.rel) {
		return props.rel
	}

	return props.target === '_blank' ? 'noopener noreferrer' : undefined
})

const buttonClasses = computed(() => [
	attrs.class,
	props.customClass,
	'btn',
	`btn-${props.variant}`,
	`btn-${props.color}`,
	`btn-${props.size}`,
	{
		'is-disabled': props.disabled
	}
])

const componentAttrs = computed(() => {
	const { class: _class, ...restAttrs } = attrs

	if (isRouterLink.value) {
		return {
			...restAttrs,
			to: props.to,
			'aria-disabled': props.disabled ? 'true' : undefined,
			tabindex: props.disabled ? -1 : restAttrs.tabindex
		}
	}

	if (isAnchor.value) {
		return {
			...restAttrs,
			href: props.disabled ? undefined : props.href,
			target: props.target,
			rel: resolvedRel.value,
			'aria-disabled': props.disabled ? 'true' : undefined,
			tabindex: props.disabled ? -1 : restAttrs.tabindex
		}
	}

	return {
		...restAttrs,
		type: props.type,
		disabled: props.disabled
	}
})

function getRootElement() {
	return root.value instanceof HTMLElement ? root.value : root.value?.$el
}

function cleanupAnimation() {
	staggerLinks?.destroy()
	staggerLinks = undefined
}

async function setupAnimation() {
	await nextTick()
	cleanupAnimation()

	const contextRoot = getRootElement()

	if (!contextRoot) return

	staggerLinks = initStaggerLinks(contextRoot)
}

function preventDisabledEvent(event: MouseEvent) {
	if (!props.disabled) {
		return false
	}

	event.preventDefault()
	event.stopPropagation()
	return true
}

function onClick(event: MouseEvent) {
	if (preventDisabledEvent(event)) {
		return
	}

	emit('click', event)
}

function onEnter(event: MouseEvent) {
	if (props.disabled) {
		return
	}

	emit('mouseenter', event)
}

function onLeave(event: MouseEvent) {
	if (props.disabled) {
		return
	}

	emit('mouseleave', event)
}

onMounted(() => {
	setupAnimation()
})

watch(() => props.label, () => {
	setupAnimation()
})

onUnmounted(() => {
	cleanupAnimation()
})
</script>
