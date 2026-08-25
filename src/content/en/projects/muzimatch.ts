import type { ProjectContent } from '../../types'

const paragraphOne = 'Finding musicians online often means relying on outdated platforms, scattered communities or services that add unnecessary friction to making contact. I saw an opportunity for a simpler approach, focused on helping musicians discover relevant people and get in touch with as little friction as possible.'
const paragraphTwo = 'Voluptatum ratione dolor cupiditate ipsum praesentium dolor dolore mollitia dolores ut libero laudantium non in aut. Id nisi qui quibusdam velit non a fugit itaque necessitatibus rerum dolorum et enim vel.'
const paragraphThree = 'Et sit repellat voluptas debitis et iusto quia vero corporis cum in qui nesciunt ipsum. Minima voluptate perspiciatis sapiente deleniti in et et est optio. Consectetur cupiditate sint saepe voluptates corporis enim excepturi. Sunt ad laudantium odio sit necessitatibus cum hic minima velit reprehenderit non ipsa impedit quis. Animi quo qui a neque sequi ut eum distinctio sed eos consequuntur.'

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
			'What started as a side project to learn Nuxt evolved into an ongoing product with real users. Building MuziMatch pushed me beyond interface design, using feedback, analytics and continuous iteration to improve the product.'
		],
		sections: [
			{
				id: 'overview',
				title: 'Finding the right musicians is harder than it should be',
				blocks: [
					{
						type: 'text',
						paragraphs: [
							paragraphOne,
						]
					},
					{
						type: 'columns',
						width: 'full',
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
									src: 'projects/muzimatch/muzimatch-thumb-horizontal@2x',
									alt: 'MuziMatch landscape project artwork',
									presentation: 'landscape'
								}]
							}
						]
					},
					{
						type: 'text',
						width: 'narrow',
						align: 'center',
						paragraphs: [
							paragraphOne,
							paragraphTwo
						]
					},
					{
						type: 'media',
						width: 'full',
						src: 'projects/muzimatch/muzimatch_oproepen',
						format: 'png',
						alt: 'MuziMatch interface',
						caption: 'MuziMatch',
						presentation: 'wide'
					},
					
					{
						type: 'columns',
						width: 'full',
						columns: [
							{
								emphasis: 'narrow',
								blocks: [{
									type: 'text',
									paragraphs: [
										paragraphThree,
										paragraphOne,
										paragraphTwo,
										paragraphThree
									]
								}]
							},
							{
								emphasis: 'wide',
								blocks: [{
									type: 'media',
									src: 'projects/muzimatch/muzimatch-hero',
									alt: 'MuziMatch project artwork',
									presentation: 'landscape'
								}]
							}
						]
					}
				]
			}
		]
	}
} satisfies ProjectContent

export default muzimatch
