import type { Component } from 'vue'
import type { ProjectSlug } from '../../../content'
import CharlieCase from './CharlieCase.vue'
import MuziMatchCase from './MuziMatchCase.vue'
import RecranetCase from './RecranetCase.vue'
import SFVOnlineCase from './SFVOnlineCase.vue'
import UndriftCase from './UndriftCase.vue'

const caseComponents = {
	muzimatch: MuziMatchCase,
	recranet: RecranetCase,
	undrift: UndriftCase,
	charlie: CharlieCase,
	sfvonline: SFVOnlineCase
} satisfies Record<ProjectSlug, Component>

export function getCaseComponent(slug: ProjectSlug) {
	return caseComponents[slug]
}
