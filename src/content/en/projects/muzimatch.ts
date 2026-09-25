import type { ProjectContent } from '../../types'

const muzimatch = {
	slug: 'muzimatch',
	title: 'MuziMatch',
	summary: 'Helping musicians find their next band, collaboration or project through a privacy-first classifieds platform.',
	tags: [
		'Side project',
		'Product Design',
		'Nuxt',
		'Redesign coming',
	],
	year: '2026',
	job: 'Sideproject',
	role: 'Product designer & developer',
	type: 'Privacy-first musicians classifieds platform',
	caseStudy: {
		introduction: [
			'MuziMatch helps musicians find the right people for their next band, project or collaboration. What started as a side project to learn Nuxt became a live product used by musicians across the Netherlands.'
		],
		sections: [
			{
				id: 'introvisual',
				type: 'media',
				width: 'full',
				src: 'projects/muzimatch/muzimatch-listing-detail-early-version@2x',
				alt: 'MuziMatch interface',
				presentation: 'wide',
				spacing: 'spacious'
			},
			{
				id: 'problem',
				eyebrow: 'The problem',
				title: 'Finding the right musicians is harder than it should be',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						width: 'content',
						paragraphs: [
							'Finding musicians online often means relying on outdated platforms, scattered communities or services that add unnecessary friction to making contact. I saw an opportunity for a simpler approach, focused on helping musicians discover relevant people and get in touch with as little friction as possible.',
						]
					},
					{ // Images
						type: 'columns',
						width: 'full',
						caption: 'The first version of MuziMatch focused on the core experience: discovering relevant listings and making it easy to get in touch.',
						columns: [
							{
								emphasis: 'equal',
								blocks: [{
									type: 'media',
									src: 'projects/muzimatch/muzimatch-listings-overview-early-version@2x',
									alt: 'MuziMatch portrait project artwork',
									presentation: 'landscape'
								}]
							},
							{
								emphasis: 'equal',
								blocks: [{
									type: 'media',
									src: 'projects/muzimatch/muzimatch-listing-detail-early-version@2x',
									alt: 'MuziMatch landscape project artwork',
									presentation: 'landscape'
								}]
							}
						]
					},
					{
						type: 'text',
						width: 'content',
						align: 'center',
						eyebrow: 'The challenge',
						title: 'Starting with an empty marketplace',
						paragraphs: [
							'A platform for finding musicians only works when there is something to find. I started with a small set of example listings, giving early visitors something to explore while I worked on attracting the first real users. As organic listings started appearing, MuziMatch gradually became a product shaped by its users rather than my assumptions.'
						]
					},
					{
						type: 'media',
						width: 'content',
						src: 'projects/muzimatch/muzimatch_oproepen-demos@2x',
						format: 'jpg',
						alt: 'MuziMatch interface',
						//caption: 'MuziMatch',
						presentation: 'natural'
					},
					/**
					{
						type: 'feature',
						width: 'full',
						direction: 'text-media',
						text: {
							type: 'text',
							paragraphs: [
								paragraphThree
							]
						},
						media: {
							type: 'media',
							src: 'projects/muzimatch/muzimatch-hero',
							alt: 'MuziMatch project artwork',
							presentation: 'landscape'
						}
					}
					**/
				]
			},
			{
				id: 'decision',
				eyebrow: 'The decision',
				title: 'Designing MuziMatch without accounts',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						paragraphs: [
							'(Accountless model + privacy)',
						]
					},
				]
			},
			{
				id: 'iteration',
				eyebrow: 'The evidence',
				title: 'From assumptions to evidence',
				spacing: 'spacious',
				blocks: []
			},
			{
				id: 'outcome',
				eyebrow: 'The outcome',
				title: 'An evolving product',
				spacing: 'spacious',
				blocks: []
			},
		]
	}
} satisfies ProjectContent

export default muzimatch
