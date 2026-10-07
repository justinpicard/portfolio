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
				id: 'context',
				eyebrow: 'The context',
				title: 'Finding the right musicians is harder than it should be',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						width: 'narrow',
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
				]
			},
			{
				id: 'product',
				eyebrow: 'The product',
				title: 'Designing the core experience',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						width: 'narrow',
						paragraphs: [
							'I kept the first version focused on the essentials: finding relevant listings, getting in touch and posting a listing. The challenge was making that experience useful from day one without adding unnecessary friction.',
						]
					},
					{
						type: 'text',
						width: 'narrow',
						align: 'center',
						title: 'Starting with an empty marketplace',
						paragraphs: [
							'I launched with a small set of example listings so early visitors had something to explore. The first real listing was an early sign that people were willing to use it themselves.'
						]
					},
					{
						type: 'media',
						width: 'content',
						src: 'projects/muzimatch/muzimatch_listings-demos@2x',
						format: 'jpg',
						alt: 'MuziMatch listings overview with example listings',
						presentation: 'natural'
					},
					{
						type: 'text',
						width: 'narrow',
						align: 'center',
						title: 'No account required',
						paragraphs: [
							'Creating an account felt like unnecessary friction for someone who simply wanted to post or respond to a listing. MuziMatch uses email verification and secure links instead, while keeping personal contact details private.'
						]
					},
				]
			},
			{
				id: 'evolution',
				eyebrow: 'The evolution',
				title: 'Learning from real usage',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						width: 'narrow',
						title: 'Tracking usage and feedback',
						paragraphs: [
							'I built a small privacy-friendly analytics dashboard to understand how MuziMatch was being used and where people dropped out. Combined with feedback from users, it helps me decide what to simplify or improve next.',
						]
					},
					{
						type: 'media',
						width: 'content',
						src: 'projects/muzimatch/muzimatch_statistics@2x',
						format: 'jpg',
						alt: 'MuziMatch usage statistics',
						presentation: 'natural'
					},
					{
						type: 'text',
						width: 'narrow',
						title: 'Simplifying the create flow',
						paragraphs: [
							'I replaced the original three-step wizard with a single-page flow to reduce friction and make the process easier to understand. Since the change, 54.8% of tracked sessions have resulted in a completed listing, compared with 21.2% in the earlier flow.',
						]
					},
					{
						type: 'media',
						width: 'content',
						src: 'projects/muzimatch/muzimatch-create-flow-simplification@2x',
						format: 'jpg',
						alt: 'The old and new create flow for MuziMatch',
						presentation: 'natural'
					},
					{
						type: 'text',
						width: 'narrow',
						title: 'Keeping listings relevant',
						paragraphs: [
							'As MuziMatch grew, older listings made it harder to know who was still looking. I introduced status reminder emails that let musicians confirm their listing is still relevant or take it offline.',
						]
					},
					{
						type: 'media',
						width: 'content',
						src: 'projects/muzimatch/muzimatch_reminder-email@2x',
						format: 'jpg',
						alt: 'Example of a MuziMatch reminder email',
						presentation: 'natural'
					},
					{
						type: 'text',
						width: 'narrow',
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
						width: 'narrow',
						paragraphs: [
							'MuziMatch started as a way to learn Nuxt, but grew into a live product used by musicians across the Netherlands. It continues to evolve as more people post, respond and show me where the product can improve.',
						]
					},
					{
						type: 'text',
						width: 'narrow',
						paragraphs: [
							'(visuals of metrics (listings posted, responses sent, matches made, active in X provinces)',
						]
					},
					{
						type: 'text',
						width: 'narrow',
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
