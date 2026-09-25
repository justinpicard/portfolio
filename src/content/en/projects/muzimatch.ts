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
				src: 'projects/muzimatch/muzimatch-redesign-opening-visual@2x',
				format: 'jpg',
				alt: 'MuziMatch interface',
				presentation: 'wide',
				spacing: 'spacious',
				caption: 'A glimpse of the Muzimatch redesign, which is currently in progress.',
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
							'Finding musicians online often means searching across outdated platforms and scattered communities. MuziMatch was my attempt to make finding and contacting relevant musicians simpler.',
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
							'I started with a small set of example listings, giving early visitors something to explore until the first real listings began to appear.'
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
				title: 'No account required',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						paragraphs: [
							'Creating an account felt like unnecessary friction for someone who simply wanted to post or respond to a listing. MuziMatch uses email verification and secure links instead, while keeping personal contact details private.',
						]
					},
				]
			},
			{
				id: 'iteration',
				eyebrow: 'The evidence',
				title: 'Learning from real usage',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						paragraphs: [
							'I built a small analytics dashboard to understand how MuziMatch was being used and where people dropped out. Combined with feedback from users, it helps me decide what to simplify or improve next.',
						]
					},
					{
						type: 'text',
						title: 'Simplifying the create flow',
						paragraphs: [
							'The original three-step flow felt more complicated than it needed to be, so I reduced it to a single page.',
						]
					},
					{
						type: 'text',
						paragraphs: [
							'(visuals of the old and new create flow and showing the results precentages of people completing the flow)',
						]
					},
					{
						type: 'text',
						title: 'Keeping listings relevant',
						paragraphs: [
							'As MuziMatch grew, older listings made it harder to know who was still looking. I introduced status reminders that let musicians confirm their listing is still relevant or take it offline.',
						]
					},
					{
						type: 'text',
						paragraphs: [
							'(visuals of reminder email)',
						]
					},
					{
						type: 'text',
						title: 'Understanding what happens after contact',
						paragraphs: [
							'MuziMatch can track when musicians get in touch, but not whether that contact actually leads to a match. While I know the platform has resulted in at least one successful match, there’s currently no reliable way to measure what happens after that first contact.',
						]
					},
				]
			},
			{
				id: 'outcome',
				eyebrow: 'The outcome',
				title: 'From side project to a product people use',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						paragraphs: [
							'MuziMatch started as a way to learn Nuxt, but grew into a live product used by musicians across the Netherlands. It continues to evolve as more people post, respond and show me where the product can improve.',
						]
					},
					{
						type: 'text',
						paragraphs: [
							'(visuals of metrics (listings posted, responses sent, matches made, active in X provinces)',
						]
					},
					{
						type: 'text',
						title: 'Still evolving',
						paragraphs: [
							'MuziMatch isn’t finished. The next challenge is understanding what happens after musicians connect, while continuing to simplify the experience and build features people actually use.',
						]
					},
				]
			},
		]
	}
} satisfies ProjectContent

export default muzimatch
