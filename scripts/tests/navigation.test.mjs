import assert from 'node:assert/strict'
import test from 'node:test'
import { isModifiedClick } from '../../src/utils/dom/linkClick.ts'
import { resolveCaseProjectIndex, withCaseQuery } from '../../src/utils/navigation/caseQuery.ts'

test('modified links retain browser actions', () => {
	const plain = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }
	assert.equal(isModifiedClick(plain), false)
	for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
		assert.equal(isModifiedClick({ ...plain, [modifier]: true }), true)
	}
	assert.equal(isModifiedClick({ ...plain, button: 1 }), true)
})

test('case URLs accept only single published slugs and preserve unrelated query state', () => {
	const projects = [
		{ slug: 'muzimatch', caseStatus: 'published' },
		{ slug: 'recranet', caseStatus: 'coming-soon' },
		{ slug: 'sfvonline', caseStatus: 'published' }
	]
	assert.equal(resolveCaseProjectIndex(projects, 'muzimatch'), 0)
	assert.equal(resolveCaseProjectIndex(projects, 'sfvonline'), 2)
	for (const value of ['unknown', 'recranet', '', undefined, null, ['muzimatch', 'sfvonline']]) {
		assert.equal(resolveCaseProjectIndex(projects, value), -1)
	}
	const initial = { case: 'muzimatch', campaign: 'portfolio' }
	assert.deepEqual(withCaseQuery(initial, 'sfvonline'), { case: 'sfvonline', campaign: 'portfolio' })
	assert.deepEqual(withCaseQuery(initial), { campaign: 'portfolio' })
	assert.deepEqual(initial, { case: 'muzimatch', campaign: 'portfolio' })
})
