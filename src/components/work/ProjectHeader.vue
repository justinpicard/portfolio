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
			<span class="role text-lg">{{ title }}</span>
		</div>

		<div class="project-header__section-nav">
			<SectionNavigation disabled />
		</div>
	</header>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionNavigation from '../navigation/SectionNavigation.vue'
import {
	initStaggerLinks,
	type StaggerLinksController
} from '../../utils/animations/staggerLinks'

defineProps<{
	title: string
}>()

const emit = defineEmits<{
	close: []
}>()

const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
let staggerLinks: StaggerLinksController | undefined

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

function focusClose() {
	closeButton.value?.focus()
}

onMounted(() => {
	setupCloseAnimation()
})

watch(() => t('project.closeText'), () => {
	setupCloseAnimation()
})

onUnmounted(() => {
	cleanupCloseAnimation()
})

defineExpose({
	element: root,
	focusClose
})
</script>
