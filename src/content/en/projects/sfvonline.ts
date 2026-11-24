import type { ProjectContent } from '../../types'

const sfvonline = {
	slug: 'sfvonline',
	title: 'SFVonline',
	summary: 'Transforming complex safety and compliance workflows into a clear, approachable SaaS experience.',
	tags: [
		'Product Design',
		'UX/UI',
		'SaaS',
		'Early work'
	],
	year: '2020',
	job: 'Dondr ⚡ Web & design',
	role: 'UX/UI designer',
	type: 'SaaS for insolvency management',
	caseStudy: {
		introduction: [
			'SFVonline helps insolvency professionals manage the financial settlement of bankruptcies and other insolvency proceedings. The application processes creditor information and bank transactions, performs the required calculations and generates financial reports and creditor lists.'
		],
		sections: [
			{
				id: 'introvisual',
				type: 'media-group',
				width: 'narrow',
				layout: 'three-up',
				gap: 'none',
				verticalAlign: 'start',
				items: [
					{
						type: 'media',
						src: 'projects/sfvonline/sfv-online-desktop-2@2x-1',
						format: 'png',
						alt: 'SFVonline distribution overview with financial report export options',
						appearance: { radius: 'none' }
					},
					{
						type: 'media',
						src: 'projects/sfvonline/sfv-online-desktop-2@2x',
						format: 'png',
						alt: 'SFVonline financial overview showing assets and their values',
						appearance: { radius: 'none' }
					},
					{
						type: 'media',
						src: 'projects/sfvonline/sfv-online-desktop-3@2x',
						format: 'png',
						alt: 'SFVonline form for adding a creditor and correspondence details',
						appearance: { radius: 'none' }
					}
				],
				spacing: 'spacious',
				caption: 'Complex financial workflows, organised into a clear and consistent interface.',
			},
			{
				id: 'overview',
				title: 'Designing for a complex financial process',
				spacing: 'spacious',
				blocks: [
					{
						type: 'text',
						width: 'narrow',
						align: 'center',
						paragraphs: [
							'I designed new and existing parts of the application based on requirements from the client, translating complex domain logic into clear and consistent interfaces. New functionality was tested with people who use SFVonline in their daily work, and their feedback was used to refine the experience before release.',
							'It reinforced the importance of understanding the logic behind a complex product before trying to simplify its interface.'
						]
					},
				],
			}
		]
	}
} satisfies ProjectContent

export default sfvonline
