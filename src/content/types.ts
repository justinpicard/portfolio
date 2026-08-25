import type { Locale } from '../i18n'

export type LocaleCode = Locale

export type ProjectSlug =
	| 'muzimatch'
	| 'recranet'
	| 'undrift'
	| 'charlie'
	| 'sfvonline'

export type ProjectCaseStatus = 'published' | 'coming-soon'

export type AboutContent = {
	greeting: string
	introduction: string
	paragraphs: string[]
}

export type HeroContent = {
	name: string
	role: string
	introduction: string
}

export type FooterContent = {
	introduction: string
}

export type PageSeoContent = {
	title: string
	description: string
	ogTitle?: string
	ogDescription?: string
}

export type SeoContent = {
	home: PageSeoContent
}

export type HomeContent = {
	hero: HeroContent
	about: AboutContent
	footer: FooterContent
}

export type CaseBlockWidth = 'full' | 'content' | 'narrow'

export type CaseBlockAlign = 'start' | 'center' | 'end'

export type CaseBlockLayout = {
	width?: CaseBlockWidth
	align?: CaseBlockAlign
}

export type CaseMediaPosition = 'center' | 'top' | 'right' | 'bottom' | 'left'

export type CaseFeatureDirection = 'text-media' | 'media-text'

export type CaseTextBlock = CaseBlockLayout & {
	type: 'text'
	title?: string
	paragraphs: [string, ...string[]]
}

export type CaseMediaBlock = CaseBlockLayout & {
	type: 'media'
	src: string
	alt: string
	caption?: string
	format?: 'jpg' | 'jpeg' | 'png'
	presentation?: 'natural' | 'wide' | 'landscape' | 'portrait' | 'square'
	position?: CaseMediaPosition
}

export type CaseColumnEmphasis = 'equal' | 'narrow' | 'wide'

export type CaseColumn = {
	emphasis?: CaseColumnEmphasis
	blocks: [CaseTextBlock | CaseMediaBlock, ...(CaseTextBlock | CaseMediaBlock)[]]
}

export type CaseColumnsBlock = CaseBlockLayout & {
	type: 'columns'
	columns: [CaseColumn, ...CaseColumn[]]
}

export type CaseFeatureBlock = CaseBlockLayout & {
	type: 'feature'
	direction?: CaseFeatureDirection
	text: CaseTextBlock
	media: CaseMediaBlock
}

export type CaseBlock =
	| CaseTextBlock
	| CaseMediaBlock
	| CaseColumnsBlock
	| CaseFeatureBlock

export type CaseSectionSpacing = 'tight' | 'default' | 'spacious'

export type CaseSectionLayout = {
	spacing?: CaseSectionSpacing
}

export type LegacyProjectSection = CaseSectionLayout & {
	id: string
	title?: string
	paragraphs: [string, ...string[]]
	blocks?: never
}

export type BlockProjectSection = CaseSectionLayout & {
	id: string
	title?: string
	blocks: CaseBlock[]
	paragraphs?: never
}

export type ProjectSection = LegacyProjectSection | BlockProjectSection

export type ProjectCaseStudy = {
	introduction: string[]
	sections: ProjectSection[]
}

export type ProjectContent = {
	slug: ProjectSlug
	title: string
	summary: string
	tags: string[]
	year: string
	job: string
	role: string
	type: string
	caseStudy: ProjectCaseStudy
}

export type ProjectContentOverride = {
	slug: ProjectSlug
} & Partial<Omit<ProjectContent, 'slug'>>

export type ProjectMedia = {
	id: string
	slug: ProjectSlug
	caseStatus?: ProjectCaseStatus
	thumbnailImage: string
	thumbnailImageFormat?: 'jpg' | 'jpeg' | 'png'
	thumbnailImagePosition?: string
	landscapeThumbnailImage?: string
	landscapeThumbnailImageFormat?: 'jpg' | 'jpeg' | 'png'
	landscapeThumbnailImagePosition?: string
	heroImage: string
	heroImageFormat?: 'jpg' | 'jpeg' | 'png'
	heroImagePosition?: string
	heroPosterImage?: string
	heroPosterImageFormat?: 'jpg' | 'jpeg' | 'png'
	heroVideo?: {
		webm: string
		mp4: string
	}
	secondaryImages?: string[]
	overlayBackground?: string
	live?: string
}

export type Project = Omit<ProjectMedia, 'caseStatus'> & ProjectContent & {
	caseStatus: ProjectCaseStatus
}

export type PortfolioContent = {
	home: HomeContent
	projects: Project[]
	seo: SeoContent
}

export type PortfolioContentOverrides = {
	home?: {
		hero?: Partial<HeroContent>
		about?: Partial<AboutContent>
		footer?: Partial<FooterContent>
	}
	projects?: ProjectContentOverride[]
}
