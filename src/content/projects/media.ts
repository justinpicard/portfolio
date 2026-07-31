import type { ProjectMedia } from '../types'

export const projectMedia = [
	{
		id: '1',
		slug: 'muzimatch',
		image: 'projects/muzimatch/muzimatch-thumb',
		imageFormat: 'png',
		secondaryImages: [
			'hz-university',
			'dot3'
		],
		overlayBackground: '#efff90',
		link: 'https://muzimatch.nl'
	},
	{
		id: '2',
		slug: 'recranet',
		image: 'hz-university',
		secondaryImages: [
			'projects/recranet/vodatent',
			'dehoop'
		],
		overlayBackground: '#aae8f7',
		link: 'https://recranet.com'
	},
	{
		id: '3',
		slug: 'undrift',
		image: 'hz-university',
		overlayBackground: '#FFD87F',
		link: '#'
	},
	{
		id: '4',
		slug: 'charlie',
		image: 'hz-university',
		overlayBackground: '#c3c7ff',
		link: '#'
	},
	{
		id: '5',
		slug: 'sfvonline',
		image: 'projects/sfvonline/sfvonline',
		secondaryImages: [
			'dot3',
			'hz-university'
		],
		overlayBackground: '#C9EFD8',
		link: 'https://sfvonline.nl'
	}
] as const satisfies readonly ProjectMedia[]
