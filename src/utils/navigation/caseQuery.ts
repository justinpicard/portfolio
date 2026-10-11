import type { LocationQuery, LocationQueryRaw } from 'vue-router'

export function resolveCaseProjectIndex(
	projects: readonly { slug: string; caseStatus: string }[],
	value: unknown
) {
	if (typeof value !== 'string') return -1
	return projects.findIndex(project => project.slug === value && project.caseStatus === 'published')
}

export function withCaseQuery(query: LocationQuery, slug?: string): LocationQueryRaw {
	const nextQuery: LocationQueryRaw = { ...query }
	delete nextQuery.case
	if (slug) nextQuery.case = slug
	return nextQuery
}
