<template>
	<div class="rich-text" v-html="renderedContent" />
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { computed } from 'vue'

const props = defineProps<{
	content: string
}>()

const renderedContent = computed(() => {
	const html = marked.parse(props.content, {
		async: false,
		breaks: false,
		gfm: true
	})

	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br'],
		ALLOWED_ATTR: ['href', 'title']
	})
})
</script>
