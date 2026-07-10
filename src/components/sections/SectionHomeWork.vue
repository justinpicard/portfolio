<template>
	<section class="section work-section" id="work" ref="root">
		<div class="work-section__title-wrapper">
			<div class="work-section__title-inner">
				<h2 class="work-section__title" ref="titleRef">Work.</h2>
			</div>
		</div>
		<div class="work-section__projects">
			<div class="work-section__column work-section__column--left">
				<ProjectCard
					v-for="project in leftColumnProjects"
					:key="project.id"
					:project="project"
					:index="project.index"
				/>
			</div>
			<div class="work-section__column work-section__column--right">
				<ProjectCard
					v-for="project in rightColumnProjects"
					:key="project.id"
					:project="project"
					:index="project.index"
				/>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { gsap, SplitText, registerGsapPlugins } from '../../utils/animations/gsap'
import projects from '../../data/projects.json'
import ProjectCard from '../work/ProjectCard.vue'

const root = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLHeadingElement | null>(null)
let splitTitle: SplitText | undefined
let ctx: gsap.Context | undefined

const orderedProjects = computed(() => (
	projects.map((project, index) => ({
		...project,
		index
	}))
))

const leftColumnProjects = computed(() => orderedProjects.value.filter((_, index) => index % 2 === 0))
const rightColumnProjects = computed(() => orderedProjects.value.filter((_, index) => index % 2 === 1))

function wrapSplitElements(elements: Element[], className: string, tagName: 'span' = 'span') {
	elements.forEach((element) => {
		const wrapper = document.createElement(tagName)
		wrapper.classList.add(className)
		element.parentNode?.insertBefore(wrapper, element)
		wrapper.appendChild(element)
	})
}

onMounted(() => {
	registerGsapPlugins()

	ctx = gsap.context(() => {
		if (!titleRef.value) return

		splitTitle = new SplitText(titleRef.value, {
			type: 'chars',
			charsClass: 'split-display-char'
		})

		wrapSplitElements(splitTitle.chars, 'split-display-char-wrapper')

		gsap.set(splitTitle.chars, {
			yPercent: 115
		})

		gsap.to(splitTitle.chars, {
			yPercent: 0,
			duration: 0.9,
			stagger: 0.06,
			ease: 'power4.out',
			scrollTrigger: {
				trigger: root.value?.querySelector('.work-section__title-wrapper'),
				start: 'top 40%',
				toggleActions: 'play none none reverse'
			}
		})
	}, root.value ?? undefined)
})

onUnmounted(() => {
	ctx?.revert()
	splitTitle?.revert()
})
</script>
