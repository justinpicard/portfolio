import type { ProjectContent } from '../../types'

const recranet = {
	slug: 'recranet',
	title: 'Recranet Booking',
	summary: 'Designing a scalable booking platform that helps holiday parks manage reservations and guest experiences.',
	tags: [
		'Enterprise SaaS',
		'Product Design',
		'Design System',
		'Online booking management'
	],
	year: '2023 - Current',
	job: 'Recranet',
	role: 'Product designer',
	type: 'Design system & SaaS product design',
	caseStudy: {
		introduction: [
			'Recranet Booking is a reservation management platform for leisure businesses. It handles online bookings, availability, payments and guest communication, while giving businesses the tools to manage their day-to-day operations.'
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
				id: 'role',
				eyebrow: 'My role',
				title: 'Product & web design at Recranet',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						width: 'narrow',
						paragraphs: [
							'I worked on Recranet Booking as a Product Designer, designing new features and improving existing parts of the platform. I worked closely with developers from early ideas through to implementation.',
							'I created Verano, Recranet’s design system, and continued to maintain and evolve it as the product grew. Alongside the product, I designed and optimized websites for Recranet’s customers, balancing usability with their commercial goals.',
						]
					},
					{
						type: 'text',
						width: 'narrow',
						paragraphs: [
							'(visuals of Verano design system, Recranet Booking interface, and Recranet customer websites)',
						]
					},
					// { // Images
					// 	type: 'columns',
					// 	width: 'full',
					// 	caption: 'The first version of MuziMatch focused on the core experience: discovering relevant listings and making it easy to get in touch.',
					// 	columns: [
					// 		{
					// 			emphasis: 'equal',
					// 			blocks: [{
					// 				type: 'media',
					// 				src: 'projects/muzimatch/muzimatch-listings-overview-early-version@2x',
					// 				alt: 'MuziMatch portrait project artwork',
					// 				presentation: 'landscape'
					// 			}]
					// 		},
					// 		{
					// 			emphasis: 'equal',
					// 			blocks: [{
					// 				type: 'media',
					// 				src: 'projects/muzimatch/muzimatch-listing-detail-early-version@2x',
					// 				alt: 'MuziMatch landscape project artwork',
					// 				presentation: 'landscape'
					// 			}]
					// 		}
					// 	]
					// },
				]
			},
			{
				id: 'product',
				//eyebrow: 'The product',
				title: 'Product work',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						width: 'narrow',
						eyebrow: 'PMS cockpit',
						title: 'A central hub for managing operations',
						paragraphs: [
							'I designed the PMS cockpit to give users an overview when they log in. It brings together relevant information and provides quick access to common day-to-day tasks.',
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
						width: 'narrow',
						paragraphs: [
							'I built a small analytics dashboard to understand how MuziMatch was being used and where people dropped out. Combined with feedback from users, it helps me decide what to simplify or improve next.',
						]
					},
					{
						type: 'text',
						width: 'narrow',
						title: 'Simplifying the create flow',
						paragraphs: [
							'The original three-step flow felt more complicated than it needed to be, so I reduced it to a single page.',
						]
					},
					{
						type: 'text',
						width: 'narrow',
						paragraphs: [
							'(visuals of the old and new create flow and showing the results precentages of people completing the flow)',
						]
					},
					{
						type: 'text',
						width: 'narrow',
						title: 'Keeping listings relevant',
						paragraphs: [
							'As MuziMatch grew, older listings made it harder to know who was still looking. I introduced status reminders that let musicians confirm their listing is still relevant or take it offline.',
						]
					},
					{
						type: 'text',
						width: 'narrow',
						paragraphs: [
							'(visuals of reminder email)',
						]
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

export default recranet
