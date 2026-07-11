export type Project = {
	id: string
	name: string
	image: string
	secondaryImages?: string[]
	overlayBackground?: string
	link: string
	job: string
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
