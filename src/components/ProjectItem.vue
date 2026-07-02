<template>
  <div class="col-6">
    <div class="project-item mb-3">
      <a :href="link" target="_blank" rel="noopener">
        <figure class="project-image mb-1">
          <BaseImage
            :src="`/images/${image}`"
            :alt="name"
            aspect-ratio="9 / 11"
          />
        </figure>
        <div class="project-info">
          <h3 class="project-title">{{ name }}</h3>
          <span class="byline">{{ type }}<span class="star">✦</span>{{ job }}<span class="star">✦</span>{{ year }}</span>
        </div>
      </a>
    </div>
  </div>
</template>

<script>
import BaseImage from './base/BaseImage.vue'

export default {
  components: {
    BaseImage
  },
  props: [
      'name',
      'image',
      'link',
      'job',
      'type',
      'year'
  ]
}
</script>
