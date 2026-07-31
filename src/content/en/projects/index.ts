import type { ProjectContent, ProjectSlug } from '../../types'
import charlie from './charlie'
import muzimatch from './muzimatch'
import recranet from './recranet'
import sfvonline from './sfvonline'
import undrift from './undrift'

export const projects = {
	muzimatch,
	recranet,
	undrift,
	charlie,
	sfvonline
} satisfies Record<ProjectSlug, ProjectContent>
