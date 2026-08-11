import type { Locale } from '../i18n'

export type LocaleCode = Locale

export type ProjectSlug =
	| 'muzimatch'
	| 'recranet'
	| 'undrift'
	| 'charlie'
	| 'sfvonline'

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
	thumbnailImage: string
	thumbnailImageFormat?: 'jpg' | 'jpeg' | 'png'
	heroImage: string
	heroImageFormat?: 'jpg' | 'jpeg' | 'png'
	secondaryImages?: string[]
	overlayBackground?: string
	live?: string
}

export type Project = ProjectMedia & ProjectContent

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
