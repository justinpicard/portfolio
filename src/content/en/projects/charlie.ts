import type { ProjectContent } from '../../types'

const charlie = {
	slug: 'charlie',
	title: 'Charlie',
	summary: 'Exploring how thoughtful product design, AI and modern web technologies can simplify everyday meal planning.',
	tags: [
		'Side project',
		'Personal productivity',
		'Nuxt',
		'Work in progress'
	],
	year: '2026',
	job: 'Side project',
	role: 'Product designer & developer',
	type: 'Product experiments',
	caseStudy: {
		introduction: [
			'Exploring how thoughtful product design, AI and modern web technologies can simplify everyday meal planning.'
		],
		sections: []
	}
} satisfies ProjectContent

export default charlie
