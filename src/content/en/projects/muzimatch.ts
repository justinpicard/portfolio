import type { ProjectContent } from '../../types'

const paragraphOne = 'Nam fugiat est explicabo expedita numquam et dolor optio occaecati. Aut magnam illum odio aut pariatur deleniti exercitationem labore nam et magnam est qui inventore esse. Iste eum minus qui voluptas. Voluptas ex eaque rerum ut sequi accusantium quidem. Est qui excepturi magni non ipsa harum expedita et et quia vel reprehenderit et est.'
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
		'GSAP'
	],
	year: '2026',
	job: 'Sideproject',
	role: 'Product designer & developer',
	type: 'Musicians classifieds platform',
	caseStudy: {
		layout: 'contained',
		sections: [
			{
				id: 'overview',
				paragraphs: [
					paragraphOne,
					paragraphTwo,
					paragraphThree,
					paragraphOne,
					paragraphTwo,
					paragraphThree,
					paragraphOne,
					paragraphTwo,
					paragraphThree
				]
			}
		]
	}
} satisfies ProjectContent

export default muzimatch
