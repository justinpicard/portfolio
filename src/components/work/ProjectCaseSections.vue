<template>
	<div>
		<section :class="`${projectSlug}-case__introduction`">
			<div class="container">
				<div class="row">
					<div class="col-12 lg:col-8 lg:offset-2 mb-16">
						<span
							v-for="(paragraph, index) in caseStudy.introduction"
							:key="`introduction-${index}`"
							class="text-xl"
						>
							{{ paragraph }}
						</span>
					</div>
				</div>
			</div>
		</section>

		<div class="container">
			<div class="row">
				<div class="col-12 lg:col-8 lg:offset-2 mb-3">
					<template
						v-for="section in caseStudy.sections"
						:key="section.id"
					>
						<p v-if="section.title"><strong>{{ section.title }}</strong></p>
						<p
							v-for="(paragraph, index) in section.paragraphs"
							:key="`${section.id}-${index}`"
						>
							{{ paragraph }}
						</p>
					</template>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { ProjectCaseStudy, ProjectSlug } from '../../content'

defineProps<{
	caseStudy: ProjectCaseStudy
	projectSlug: ProjectSlug
}>()
</script>
