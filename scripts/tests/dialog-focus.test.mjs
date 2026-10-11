import assert from 'node:assert/strict'
import test from 'node:test'
import { containDialogFocus } from '../../src/utils/dom/dialogFocus.ts'

// Exercise the event contract without adding a DOM dependency. Chrome covers native focus.
test('dialog contains focus as controls become unavailable and cleans up listeners', () => {
	const listeners = new Map()
	const originalDocument = globalThis.document
	const originalNode = globalThis.Node
	const originalStyle = globalThis.getComputedStyle
	class Element {
		constructor(tabIndex = 0) {
			this.tabIndex = tabIndex
			this.disabled = false
			this.hidden = false
			this.visibility = 'visible'
			this.listeners = new Map()
		}
		matches() { return this.disabled }
		closest() { return this.hidden }
		getClientRects() { return [1] }
		focus(options) {
			assert.equal(options.preventScroll, true)
			globalThis.document.activeElement = this
		}
		addEventListener(name, handler) { this.listeners.set(name, handler) }
		removeEventListener(name, handler) {
			if (this.listeners.get(name) === handler) this.listeners.delete(name)
		}
	}
	const first = new Element()
	const last = new Element()
	const dialog = new Element(-1)
	dialog.querySelectorAll = () => [first, last]
	dialog.contains = target => [dialog, first, last].includes(target)
	globalThis.Node = Element
	globalThis.getComputedStyle = element => ({ visibility: element.visibility })
	globalThis.document = {
		activeElement: null,
		addEventListener: (name, handler) => listeners.set(name, handler),
		removeEventListener: (name, handler) => {
			if (listeners.get(name) === handler) listeners.delete(name)
		}
	}
	try {
		const release = containDialogFocus(dialog)
		assert.equal(document.activeElement, dialog)
		const keydown = (shiftKey = false) => {
			let prevented = false
			dialog.listeners.get('keydown')({ key: 'Tab', shiftKey, preventDefault() { prevented = true } })
			return prevented
		}
		assert(keydown())
		assert.equal(document.activeElement, first)
		assert(keydown(true))
		assert.equal(document.activeElement, last)
		assert(keydown())
		assert.equal(document.activeElement, first)
		last.disabled = true
		assert(keydown(true))
		assert.equal(document.activeElement, first)
		first.hidden = true
		assert(keydown())
		assert.equal(document.activeElement, dialog)
		first.hidden = false
		listeners.get('focusin')({ target: new Element() })
		assert.equal(document.activeElement, first)
		release()
		assert.equal(listeners.size, 0)
		assert.equal(dialog.listeners.size, 0)
	} finally {
		globalThis.document = originalDocument
		globalThis.Node = originalNode
		globalThis.getComputedStyle = originalStyle
	}
})
