import type { ProjectMedia } from '../types'

export const projectMedia = [
	{
		id: '1',
		slug: 'muzimatch',
		thumbnailImage: 'projects/muzimatch/muzimatch-thumb',
		thumbnailImageFormat: 'jpg',
		heroImage: 'projects/muzimatch/muzimatch-hero',
		heroImageFormat: 'jpg',
		secondaryImages: [
			'hz-university',
			'dot3'
		],
		overlayBackground: '#B0B0FE',
		live: 'https://muzimatch.nl'
	},
	{
		id: '2',
		slug: 'recranet',
		thumbnailImage: 'projects/recranet/recranet-thumb',
		heroImage: 'hz-university',
		secondaryImages: [
			'projects/recranet/vodatent',
			'dehoop'
		],
		overlayBackground: '#aae8f7',
		live: 'https://recranet.com'
	},
	{
		id: '3',
		slug: 'undrift',
		thumbnailImage: 'hz-university',
		heroImage: 'hz-university',
		overlayBackground: '#FFD87F'
	},
	{
		id: '4',
		slug: 'charlie',
		thumbnailImage: 'hz-university',
		heroImage: 'hz-university',
		overlayBackground: '#c3c7ff'
	},
	{
		id: '5',
		slug: 'sfvonline',
		thumbnailImage: 'projects/sfvonline/sfvonline',
		heroImage: 'projects/sfvonline/sfvonline',
		secondaryImages: [
			'dot3',
			'hz-university'
		],
		overlayBackground: '#C9EFD8',
		live: 'https://sfvonline.nl'
	}
] as const satisfies readonly ProjectMedia[]
