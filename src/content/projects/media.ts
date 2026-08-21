import type { ProjectMedia } from '../types'

export const projectMedia = [
	{
		id: '1',
		slug: 'muzimatch',
		thumbnailImage: 'projects/muzimatch/muzimatch-thumb-mobile-vertical@2x',
		landscapeThumbnailImage: 'projects/muzimatch/muzimatch-thumb-mobile-horizontal@2x',
		thumbnailImageFormat: 'jpg',
		landscapeMediaPosition: 'left',
		heroImage: 'projects/muzimatch/muzimatch-hero',
		heroImageFormat: 'jpg',
		heroVideo: {
			webm: 'projects/muzimatch/muzimatch-hero-video.webm',
			mp4: 'projects/muzimatch/muzimatch-hero-video.mp4'
		},
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
		thumbnailImage: 'projects/recranet/recranet-thumb-vertical@2x',
		landscapeThumbnailImage: 'projects/recranet/recranet-thumb-horizontal',
		landscapeThumbnailImagePosition: 'left center',
		landscapeMediaPosition: 'right',
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
		landscapeMediaPosition: 'left',
		heroImage: 'hz-university',
		overlayBackground: '#FFD87F'
	},
	{
		id: '4',
		slug: 'charlie',
		thumbnailImage: 'hz-university',
		landscapeMediaPosition: 'right',
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
