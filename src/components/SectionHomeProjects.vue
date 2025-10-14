<template>
	<section class="section projects pt-0" id="section-projects">
		<div class="pinned-title-wrapper">
			<div class="title text">
				<h2 class="section-title" ref="titleRef">Playground</h2>
			</div>
		</div>
		<div class="projects">
			<div class="row">
				<div class="col-12">
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
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import ProjectItem from "./ProjectItem.vue";
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import SplitText from 'gsap/SplitText'
import projects from '../data/projects.json'

const titleRef = ref(null)
let splitTitle

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger, SplitText)

  splitTitle = new SplitText(titleRef.value, {
    type: "chars",
    wordsClass: "split-word"
  })

  gsap.from(splitTitle.chars, {
    yPercent: 100,
    opacity: 0,
    stagger: 0.015,
    duration: 0.6,
    ease: "power2.out",
    scrollTrigger: {
      trigger: '.pinned-title-wrapper',
      start: "top 40%",
      toggleActions: "play none none reverse"
    }
  })
})
</script>

<style scoped>
.pinned-title-wrapper {
	height: 100vh;
	position: relative;
	z-index: 1;
	pointer-events: none;
	width: 100%;
	position: sticky;
	top: 0;
	overflow: hidden;
	margin-top: -30vh;
}

.title {
	z-index: 1;
    pointer-events: none;
    flex-direction: column;
    justify-content: center;
    align-items: unsafe center;
    width: 100%;
    height: 100%;
    display: flex;
    position: absolute;
    top: 0;
}
.split-word {
  display: inline-block;
  overflow: hidden;
}

.section-title {

}
</style>