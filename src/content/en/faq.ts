import type { FaqContent } from '../types'

const faq = {
	heading: 'Before you ask...',
	introduction: "A few answers to save us both some time.",
	items: [
		{
			id: 'role',
			question: 'What are you looking for right now?',
			answer: [
				'Basically: a new opportunity where I can focus on digital product design, tackle interesting challenges and contribute to a product as it evolves. I’d love to work with people who value thoughtful design, collaboration and continuous improvement.',
				'I’m also open to freelance projects, interim roles and building something new together. Have an interesting idea or looking for someone to help bring it to life? Feel free to reach out!'
			]
		},
		{
			id: 'location',
			question: 'Where are you based, and are you open to remote work?',
			answer: [
				'I’m based in a cute little town called Middelburg, in the southwest of The Netherlands. I’m open to both hybrid and fully remote opportunities, including working with international teams.',
				'I enjoy working independently, but also value spending time with colleagues in person. For me, it’s about finding the right balance rather than being tied to a particular location.'
			]
		},
		{
			id: 'ai',
			question: 'How does AI fit into your workflow?',
			answer: [
				'AI has become a natural part of my daily workflow, both as a designer and a developer. I use it as a sparring partner to explore ideas, challenge assumptions, support research and speed up design and development.',
				'For me, it’s not about replacing creativity or critical thinking, but about making more room for both. I enjoy exploring what AI can add to my workflow without compromising the quality of the end result.'
			],
		},
		{
			id: 'software',
			question: 'What software do you use, and are you open to trying new tools?',
			answer: [
				'Figma is my go-to for product design, alongside Adobe Photoshop and Illustrator when needed. For development I mostly work with Vue, Nuxt, SCSS and GSAP.',
				'I’m always curious about new tools, but I prefer having a few that I know well over collecting them like Pokémon.'
			],
		},
		{
			id: 'hidden-talents',
			question: 'Do you have any hidden talents?',
			answer: 'If I do, they’re very well hidden.'
		},
		{
			id: 'personality',
			question: 'What are you like as a person?',
			answer: [
				'Look, I’m not gonna sugarcoat it: I’m fairly down to earth, naturally curious and occasionally a little stubborn. I tend to question things rather than accept them at face value, and when something interests me, I can get completely absorbed in it.',
				'I’m not the loudest person in the room, but I’m certainly not afraid to speak my mind. I appreciate honesty, dry humour and people who don’t take themselves too seriously.'
			],
		},
				{
			id: 'resist',
			question: 'Anything you can’t resist?',
			answer: 'Easy: Cheese and chocolate. You could wake me up for either. But please don’t. Ever.'
		},
	]
} satisfies FaqContent

export default faq
