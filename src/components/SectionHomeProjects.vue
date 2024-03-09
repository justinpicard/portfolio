<template>
  <section class="section projects" id="section-projects">
    <div class="container">
      <div class="row">
        <div class="col-12">
          <h2>Featured work</h2>
        </div>
      </div>
      <div class="row">
          <project-item
              v-for="project in projects"
              :key="project.id"
              :name="project.name"
              :image="project.image"
              :link="project.link"
          />
      </div>
    </div>
  </section>
</template>

<script>
import projects from '../data/projects.json'

export default {
  data() {
    return {
      name: String,
      image: String,
      link: String,
    };
  },
};
console.log(projects);
</script>
<script setup>
import ProjectItem from "./ProjectItem.vue";
</script>