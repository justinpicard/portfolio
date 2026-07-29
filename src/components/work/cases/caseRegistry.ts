import type { Component } from 'vue'
import type { ProjectCaseKey } from '../../../types/project'
import MuziMatchCase from './MuziMatchCase.vue'
import RecranetCase from './RecranetCase.vue'
import SFVOnlineCase from './SFVOnlineCase.vue'
import UndriftCase from './UndriftCase.vue'

const caseComponents = {
	muzimatch: MuziMatchCase,
	undrift: UndriftCase,
	recranet: RecranetCase,
	sfvonline: SFVOnlineCase
} satisfies Record<ProjectCaseKey, Component>

export function getCaseComponent(caseKey: ProjectCaseKey) {
	return caseComponents[caseKey]
}
