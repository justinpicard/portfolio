export type ProjectCaseKey =
	| 'muzimatch'
	| 'undrift'
	| 'recranet'
	| 'sfvonline'

export type Project = {
	id: string
	case: ProjectCaseKey
	name: string
	description: string
	tags: string[]
	image: string
	imageFormat?: 'jpg' | 'jpeg' | 'png'
	secondaryImages?: string[]
	overlayBackground?: string
	link: string
	job: string
	role: string
	type: string
	year: string
}

export type IndexedProject = Project & {
	index: number
}

export type ProjectOpenPayload = {
	projectIndex: number
	sourceMediaElement: HTMLElement | null
}
