import { resolveLocale } from '../i18n'
import aboutEn from './en/about'
import footerEn from './en/footer'
import heroEn from './en/hero'
import { projects as projectsEn } from './en/projects'
import nlOverrides from './nl'
import { projectMedia } from './projects/media'
import type {
	LocaleCode,
	PortfolioContent,
	PortfolioContentOverrides,
	Project,
	ProjectContent,
	ProjectContentOverride,
	ProjectSlug
} from './types'

const englishHome = {
	hero: heroEn,
	about: aboutEn,
	footer: footerEn
}

function getEnglishProject(slug: ProjectSlug): ProjectContent {
	return projectsEn[slug]
}

function getProjectOverride(
	overrides: ProjectContentOverride[] | undefined,
	slug: ProjectSlug
) {
	return overrides?.find((project) => project.slug === slug)
}

function buildContent(overrides: PortfolioContentOverrides = {}): PortfolioContent {
	const projects = projectMedia.map((media): Project => {
		const englishProject = getEnglishProject(media.slug)
		const override = getProjectOverride(overrides.projects, media.slug)

		return {
			...media,
			...englishProject,
			...override
		}
	})

	return {
		home: {
			hero: {
				...englishHome.hero,
				...overrides.home?.hero
			},
			about: {
				...englishHome.about,
				...overrides.home?.about
			},
			footer: {
				...englishHome.footer,
				...overrides.home?.footer
			}
		},
		projects
	}
}

const content = {
	en: buildContent(),
	nl: buildContent(nlOverrides)
} satisfies Record<LocaleCode, PortfolioContent>

function validateProjectRegistry() {
	const slugs = projectMedia.map((project) => project.slug)
	const uniqueSlugs = new Set(slugs)

	if (uniqueSlugs.size !== slugs.length) {
		throw new Error('Duplicate project slugs found in the project media registry.')
	}

	for (const locale of Object.keys(content) as LocaleCode[]) {
		if (content[locale].projects.length !== projectMedia.length) {
			throw new Error(`Project registry is incomplete for locale "${locale}".`)
		}
	}
}

if (import.meta.env.DEV) {
	validateProjectRegistry()
}

export const missingEditorialTranslations = {
	nl: {
		hero: !nlOverrides.home?.hero,
		about: !nlOverrides.home?.about,
		footer: !nlOverrides.home?.footer,
		projectSlugs: projectMedia
			.map((project) => project.slug)
			.filter((slug) => !getProjectOverride(nlOverrides.projects, slug))
	}
} as const

export const placeholderEditorialTranslations = {
	nl: ['hero', 'about']
} as const

export function getContent(locale: unknown): PortfolioContent {
	return content[resolveLocale(locale)]
}

export function getProjectBySlug(locale: unknown, slug: string) {
	return getContent(locale).projects.find((project) => project.slug === slug)
}

export type {
	AboutContent,
	HeroContent,
	LocaleCode,
	PortfolioContent,
	Project,
	ProjectCaseStudy,
	ProjectContent,
	ProjectSection,
	ProjectSlug
} from './types'
