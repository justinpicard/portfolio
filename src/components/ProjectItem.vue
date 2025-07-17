<template>
  <div class="col-6">
    <div class="project-item mb-3">
      <a :href="link" target="_blank" rel="noopener">
        <figure class="project-image mb-1">
          <img :src="'/images/' + image + '.jpg'">
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
export default {
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
