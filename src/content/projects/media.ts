import type { ProjectMedia } from '../types'

export const projectMedia = [
	{
		id: '1',
		slug: 'muzimatch',
		thumbnailImage: 'projects/muzimatch/muzimatch-thumb-vertical@2x',
		landscapeThumbnailImage: 'projects/muzimatch/muzimatch-thumb-horizontal@2x',
		thumbnailImageFormat: 'jpg',
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
		heroImage: 'projects/recranet/recranet-hero',
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
		caseStatus: 'coming-soon',
		thumbnailImage: 'projects/undrift/undrift-thumb-vertical@2x',
		landscapeThumbnailImage: 'projects/undrift/undrift-thumb-horizontal@2x',
		heroImage: 'hz-university',
		overlayBackground: '#FFD87F'
	},
	{
		id: '4',
		slug: 'charlie',
		caseStatus: 'coming-soon',
		thumbnailImage: 'projects/charlie/charlie-thumb-vertical@2x',
		landscapeThumbnailImage: 'projects/charlie/charlie-thumb-horizontal@2x',
		heroImage: 'hz-university',
		overlayBackground: '#FFC29F'
	},
	{
		id: '5',
		slug: 'sfvonline',
		thumbnailImage: 'projects/sfvonline/sfvonline-thumb-vertical@2x',
		heroImage: 'projects/sfvonline/sfvonline',
		secondaryImages: [
			'dot3',
			'hz-university'
		],
		overlayBackground: '#C9EFD8',
		live: 'https://sfvonline.nl'
	}
] as const satisfies readonly ProjectMedia[]
