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
	year: '2023 - 2026',
	job: 'Recranet',
	role: 'Product designer',
	type: 'Design system & SaaS product design',
	caseStudy: {
		introduction: [
			'Recranet Booking is a reservation management platform for leisure businesses. It handles online bookings, availability, payments and guest communication, while giving businesses the tools to manage their day-to-day operations.'
		],
		sections: [
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
							'I created Verano, Recranet’s design system, and continued to develop and maintain it. Alongside the product, I designed and optimized websites for Recranet’s customers, balancing usability with their commercial goals.',
						]
					},
				]
			},
			{
				id: 'product',
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
						src: 'projects/recranet/recranet-pms-cockpit@2x',
						format: 'png',
						alt: 'Recranet PMS cockpit interface',
						//caption: 'Screenshot of cockpit interface showing a summary of bookings, tasks and messages.',
						presentation: 'natural'
					},
					{
						type: 'text',
						width: 'narrow',
						eyebrow: 'Book on map',
						title: 'Finding the right accommodation with a map-based search',
						paragraphs: [
							'I worked on improving Book on Map, a feature that lets guests choose their preferred accommodation or pitch directly from a map. The interface helps guests explore available options and select a location that suits their preferences.',
						]
					},
					{
						type: 'media-group',
						width: 'content',
						layout: 'overlap',
						verticalAlign: 'center',
						items: [
							{
								type: 'media',
								src: 'projects/recranet/recranet-book-on-map-desktop@2x',
								format: 'png',
								alt: 'Book on Map booking interface on desktop',
								width: 84,
								align: 'start',
								appearance: { radius: 'none' }
							},
							{
								type: 'media',
								src: 'projects/recranet/recranet-book-on-map-mobile@2x',
								format: 'png',
								alt: 'Book on Map booking interface on mobile',
								width: 26,
								align: 'end',
								appearance: { radius: 'none', maxWidth: '24rem' },
								belowMd: { width: 100, align: 'center' }
							}
						]
					},
					{
						type: 'text',
						width: 'narrow',
						eyebrow: 'Kiosk',
						title: 'Checking in without a staffed reception',
						paragraphs: [
							'I designed a self-service check-in flow for guests arriving at locations without a staffed reception. The interface guides them through the check-in process, allowing them to complete their arrival independently.',
						]
					},
					{ // Images
						type: 'columns',
						width: 'full',
						caption: 'Self-service check-in kiosk in a holiday park reception.',
						columns: [
							{
								emphasis: 'equal',
								blocks: [{
									type: 'media',
									src: 'projects/recranet/recranet-kiosk-1',
									format: 'png',
									alt: 'Self-service check-in kiosk in a holiday park reception',
									presentation: 'landscape'
								}]
							},
							{
								emphasis: 'equal',
								blocks: [{
									type: 'media',
									src: 'projects/recranet/recranet-kiosk-2',
									format: 'png',
									alt: 'Self-service check-in kiosk in a holiday park reception',
									presentation: 'landscape'
								}]
							}
						]
					},
				]
			},
			{
				id: 'designsystem',
				title: 'Verano Design System',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						width: 'narrow',
						paragraphs: [
							'Verano brings together reusable components, design tokens and interaction patterns for Recranet Booking. It provides a consistent foundation for designing new features and helps bridge the gap between design and development.',
						]
					},
					{
						type: 'media',
						width: 'full',
						src: 'projects/recranet/recranet-verano-design-system@2x',
						//format: 'png',
						alt: 'Verano Design System components and patterns for Recranet Booking',
						caption: 'Verano Design System components and patterns for Recranet Booking.',
						presentation: 'natural'
					},
				]
			},
			{
				id: 'websites',
				title: 'Client websites',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						width: 'narrow',
						paragraphs: [
							'Alongside Recranet Booking, I designed and improved websites for leisure businesses, focusing on usability, clear navigation and making it easier for visitors to find and book their ideal stay. Below is a selection of my work.',
						]
					},
					{
						type: 'media-carousel',
						width: 'narrow',
						label: 'Client websites',
						slides: [
							{
								type: 'media-group',
								width: 'narrow',
								layout: 'overlap',
								verticalAlign: 'center',
								items: [
									{
										type: 'media',
										src: 'projects/recranet/recranet-vodatent-desktop@2x',
										format: 'png',
										alt: 'Vodatent website interface on desktop',
										width: 84,
										align: 'start',
										appearance: { radius: 'none' }
									},
									{
										type: 'media',
										src: 'projects/recranet/recranet-vodatent-mobile@2x',
										format: 'png',
										alt: 'Vodatent website interface on mobile',
										width: 26,
										align: 'end',
										appearance: { radius: 'none', maxWidth: '24rem' },
										belowMd: { width: 100, align: 'center' }
									}
								],
								caption: {
									link: {
										label: 'Vodatent',
										href: 'https://vodatent.com',
										rel: 'noopener noreferrer',
										target: '_blank'
									}
								}
							},
							{
								type: 'media-group',
								width: 'narrow',
								layout: 'overlap',
								verticalAlign: 'center',
								items: [
									{
										type: 'media',
										src: 'projects/recranet/recranet-beaujean-vacances-desktop@2x',
										format: 'png',
										alt: 'Beaujean Vacances website interface on desktop',
										width: 84,
										align: 'start',
										appearance: { radius: 'none' }
									},
									{
										type: 'media',
										src: 'projects/recranet/recranet-beaujean-vacances-mobile@2x',
										format: 'png',
										alt: 'Beaujean Vacances website interface on mobile',
										width: 26,
										align: 'end',
										appearance: { radius: 'none', maxWidth: '24rem' },
										belowMd: { width: 100, align: 'center' }
									}
								],
								caption: {
									link: {
										label: 'Beaujean Vacances',
										href: 'https://www.beaujean-vacances.com/en/',
										rel: 'noopener noreferrer',
										target: '_blank'
									}
								}
							},
							{
								type: 'media-group',
								width: 'narrow',
								layout: 'overlap',
								verticalAlign: 'center',
								items: [
									{
										type: 'media',
										src: 'projects/recranet/recranet-buitenleven-vakanties-desktop@2x',
										format: 'png',
										alt: 'Buiteleven Vakanties website interface on desktop',
										width: 84,
										align: 'start',
										appearance: { radius: 'none' }
									},
									{
										type: 'media',
										src: 'projects/recranet/recranet-buitenleven-vakanties-mobile@2x',
										format: 'png',
										alt: 'Buiteleven Vakanties website interface on mobile',
										width: 26,
										align: 'end',
										appearance: { radius: 'none', maxWidth: '24rem' },
										belowMd: { width: 100, align: 'center' }
									}
								],
								caption: {
									link: {
										label: 'Buiteleven Vakanties',
										href: 'https://buitenlevenvakanties.nl/',
										rel: 'noopener noreferrer',
										target: '_blank'
									}
								}
							},
							{
								type: 'media-group',
								width: 'narrow',
								layout: 'overlap',
								verticalAlign: 'center',
								items: [
									{
										type: 'media',
										src: 'projects/recranet/recranet-de-paardekreek-desktop@2x',
										format: 'png',
										alt: 'De Paardekreek website interface on desktop',
										width: 84,
										align: 'start',
										appearance: { radius: 'none' }
									},
									{
										type: 'media',
										src: 'projects/recranet/recranet-de-paardekreek-mobile@2x',
										format: 'png',
										alt: 'De Paardekreek website interface on mobile',
										width: 26,
										align: 'end',
										appearance: { radius: 'none', maxWidth: '24rem' },
										belowMd: { width: 100, align: 'center' }
									}
								],
								caption: {
									link: {
										label: 'De Paardekreek',
										href: 'https://www.depaardekreek.nl/en/',
										rel: 'noopener noreferrer',
										target: '_blank'
									}
								}
							}
						]
					},
				]
			},
		]
	}
} satisfies ProjectContent

export default recranet
