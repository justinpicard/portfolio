import type { Locale } from '../i18n'

export type LocaleCode = Locale

export type ProjectSlug =
	| 'muzimatch'
	| 'recranet'
	| 'undrift'
	| 'charlie'
	| 'sfvonline'

export type ProjectCaseStatus = 'published' | 'coming-soon' | 'experiment'

export type AboutContent = {
	greeting: string
	introduction: string
	paragraphs: string[]
}

export type HeroContent = {
	name: string
	role: string
	availability: string
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
	eyebrow?: string
	title?: string
	paragraphs: [string, ...string[]]
}

export type CaseMediaSpacing = 'none' | 'small' | 'medium' | 'large'

export type CaseMediaAppearance = {
	radius?: 'none' | 'default' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
	background?: string
	padding?: CaseMediaSpacing
	maxWidth?: string
	align?: CaseBlockAlign
	/** A frame is opt-in; fitting never changes the source aspect ratio. */
	crop?: { ratio: string; fit?: 'cover' | 'contain'; position?: string } | null
}

export type CaseResponsiveMediaAppearance = CaseMediaAppearance & {
	belowMd?: CaseMediaAppearance
}

export type CaseMediaCaption = string | {
	text?: string
	link: {
		label: string
		href: string
		target?: string
		rel?: string
	}
}

export type CaseMediaBlock = CaseBlockLayout & {
	type: 'media'
	src: string
	alt: string
	caption?: CaseMediaCaption
	format?: 'jpg' | 'jpeg' | 'png'
	appearance?: CaseResponsiveMediaAppearance
	presentation?: 'natural' | 'wide' | 'landscape' | 'portrait' | 'square'
	position?: CaseMediaPosition
	/** Removes the page gutter and rounded corners from full-width case media. */
	fullBleed?: boolean
}

export type CaseMediaGroupItem = Omit<CaseMediaBlock, 'width' | 'align' | 'fullBleed'> & {
	/** Percentage of the composition; row widths are normalized as weights. */
	width?: number
	align?: CaseBlockAlign
	offsetBlock?: CaseMediaSpacing
	belowMd?: { width?: number; align?: CaseBlockAlign; offsetBlock?: CaseMediaSpacing }
}

type CaseMediaGroupLayout =
	| { layout: 'three-up'; items: [CaseMediaGroupItem, CaseMediaGroupItem, CaseMediaGroupItem] }
	| { layout: 'overlap'; items: [CaseMediaGroupItem, CaseMediaGroupItem] }
	| { layout: 'row' | 'stack' | 'grid'; items: [CaseMediaGroupItem, ...CaseMediaGroupItem[]] }

export type CaseMediaGroupBlock = CaseBlockLayout & CaseMediaGroupLayout & {
	type: 'media-group'
	caption?: CaseMediaCaption
	gap?: CaseMediaSpacing
	verticalAlign?: 'start' | 'center' | 'end'
	appearance?: Pick<CaseResponsiveMediaAppearance, 'radius' | 'background' | 'padding'> & {
		belowMd?: Pick<CaseMediaAppearance, 'radius' | 'background' | 'padding'>
	}
}

export type CaseMediaCarouselSlide = CaseMediaBlock | CaseMediaGroupBlock

export type CaseMediaCarouselBlock = CaseBlockLayout & {
	type: 'media-carousel'
	label: string
	slides: [CaseMediaCarouselSlide, ...CaseMediaCarouselSlide[]]
}

export type CaseColumnEmphasis = 'equal' | 'narrow' | 'wide'

export type CaseColumn = {
	emphasis?: CaseColumnEmphasis
	blocks: [CaseTextBlock | CaseMediaBlock, ...(CaseTextBlock | CaseMediaBlock)[]]
}

export type CaseColumnsBlock = CaseBlockLayout & {
	type: 'columns'
	caption?: CaseMediaCaption
	columns: [CaseColumn, ...CaseColumn[]]
}

export type CaseFeatureBlock = CaseBlockLayout & {
	type: 'feature'
	direction?: CaseFeatureDirection
	text: CaseTextBlock
	media: CaseMediaBlock
}

export type CaseBlock = (
	| CaseTextBlock
	| CaseMediaBlock
	| CaseColumnsBlock
	| CaseMediaGroupBlock
	| CaseMediaCarouselBlock
	| CaseFeatureBlock
) & {
	/** Gap to the next block; the final block retains section spacing. */
	spacingAfter?: 'compact' | 'default' | 'spacious'
}

export type CaseSectionSpacing = 'tight' | 'default' | 'spacious'

export type CaseSectionLayout = {
	spacing?: CaseSectionSpacing
}

export type LegacyProjectSection = CaseSectionLayout & {
	id: string
	eyebrow?: string
	title?: string
	paragraphs: [string, ...string[]]
	blocks?: never
}

export type BlockProjectSection = CaseSectionLayout & {
	id: string
	eyebrow?: string
	title?: string
	blocks: CaseBlock[]
	paragraphs?: never
}

export type ProjectSection = LegacyProjectSection | BlockProjectSection

export type CaseStandaloneMedia = (CaseMediaBlock | CaseMediaGroupBlock | CaseMediaCarouselBlock) & CaseSectionLayout & {
	id: string
}

export type ProjectCaseStudy = {
	introduction: string[]
	sections: (ProjectSection | CaseStandaloneMedia)[]
}

export type ProjectContent = {
	slug: ProjectSlug
	title: string
	summary: string
	tags: string[]
	year: string
	job: string
	jobLabel?: string
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
	heroLogo?: string
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
