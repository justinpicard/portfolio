import type { FaqContent } from '../types'

const faq = {
	heading: 'Before you ask...',
	introduction: 'A few answers to save us both some time.',
	items: [
		{
			id: 'role',
			question: 'What are you looking for right now?',
			answer: [
				'I’d love to get stuck into a digital product, work on interesting problems and build something I can be proud of. Preferably with a nice bunch of people who enjoy what they do.',
				'I’m also open to freelance projects, interim roles and building something new together. Have an interesting idea or need someone to help bring it to life? Feel free to reach out!'
			]
		},
		{
			id: 'location',
			question: 'Where are you based, and are you open to remote work?',
			answer: [
				'I live in Middelburg, in the southwest of the Netherlands, but I’m not limiting my search to this part of the country. I’m open to hybrid and fully remote work, including international opportunities.',
				'I like the flexibility of working from home, but I certainly don’t want to spend every working day talking to my cats. I enjoy working with people in person too, so I’m happy to commute to the office a few days a week if needed.'
			]
		},
		{
			id: 'ai',
			question: 'How does AI fit into your workflow?',
			answer: [
				'AI has become a pretty natural part of my day-to-day work, both as a designer and a developer. I use it to bounce ideas around, challenge my own assumptions, support research and speed things up.',
				'I’m genuinely excited about what AI makes possible, but I’m not interested in using it just for the sake of it. It should make my work better, not just faster. And I still like doing some of the thinking myself.'
			]
		},
		{
			id: 'software',
			question: 'What’s in your toolkit?',
			answer: [
				'Figma is my go-to for product design, with Photoshop and Illustrator thrown into the mix whenever needed. On the development side, I mostly work with Vue, Nuxt, SCSS and GSAP.',
				'I’m always up for trying something new, but I’d rather get really good at a few tools than collect them like Pokémon.'
			]
		},
		{
			id: 'personality',
			question: 'What are you like as a person?',
			answer: [
				'I’m pretty down to earth, naturally curious and a little stubborn at times. I like to understand why things are the way they are, and I appreciate people who are honest and straightforward. No need to beat around the bush.',
				'You could call me an extroverted introvert. I’m caring by nature and genuinely enjoy spending time with others, but I also value my own space. Not the loudest person in the room, but certainly not afraid to speak my mind.',
				'Dry humour, a healthy dose of sarcasm and people who don’t take themselves too seriously are right up my alley. Life’s serious enough as it is.'
			]
		},
		{
			id: 'hidden-talents',
			question: 'Do you have any hidden talents?',
			answer: 'If I do, they’re very well hidden.'
		},
		{
			id: 'office-sharing',
			question: 'Anything we should know before sharing an office with you?',
			answer: [
				'When my AirPods go in, the rest of the world ceases to exist. Tap me on the shoulder at your own risk.',
				'Also, leaving chocolate unattended around me is generally a bad idea. Especially around Sinterklaas and Easter.'
			]
		},
	]
} satisfies FaqContent

export default faq