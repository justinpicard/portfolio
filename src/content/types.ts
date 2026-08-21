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
	title: string
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

export type ProjectSection = {
	id: string
	title?: string
	paragraphs: string[]
}

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
	landscapeMediaPosition?: 'left' | 'right'
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
