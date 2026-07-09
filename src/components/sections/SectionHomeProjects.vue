<template>
	<section class="section home-projects projects pt-0" id="section-projects" ref="root">
		<div class="pinned-title-wrapper">
			<div class="title text">
				<h2 class="section-title" ref="titleRef">my work</h2>
			</div>
		</div>
		<div class="projects">
			<div class="row">
				<div class="col-12">
					<!--
					<project-item
						v-for="project in projects"
						:key="project.id"
						:name="project.name"
						:image="project.image"
						:link="project.link"
						:job="project.job"
						:type="project.type"
						:year="project.year"
					/>
				-->
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import ProjectItem from "../ProjectItem.vue";
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap, SplitText, registerGsapPlugins } from '../../utils/animations/gsap'
import { animationDurations, animationEases, animationStaggers } from '../../utils/animations/presets'
import projects from '../../data/projects.json'

const titleRef = ref(null)
const root = ref(null)
let splitTitle
let ctx

onMounted(() => {
  registerGsapPlugins()

  ctx = gsap.context(() => {
    splitTitle = new SplitText(titleRef.value, {
      type: "chars",
      wordsClass: "split-word"
    })

    gsap.from(splitTitle.chars, {
      yPercent: 100,
      opacity: 0,
      stagger: animationStaggers.chars,
      duration: animationDurations.base - 0.1,
      ease: animationEases.out,
      scrollTrigger: {
        trigger: root.value?.querySelector('.pinned-title-wrapper'),
        start: "top 40%",
        toggleActions: "play none none reverse"
      }
    })
  }, root.value)
})

onUnmounted(() => {
  ctx?.revert()
  splitTitle?.revert()
})
</script>
