import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../../src/utils/animations/faqHeading.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText

function harness({ reduced = false, fail = false } = {}) {
	let reverted = 0, restored = 0, refreshed = 0, reveal
	let resolveFonts
	const fonts = new Promise(resolve => { resolveFonts = resolve })
	const dependencies = {
		prefersReducedMotion: () => reduced,
		gsap: {
			context: () => ({ add: callback => callback(), revert: () => reverted++ }),
			set: () => { if (fail) throw new Error('initialization failed') },
			to: (_chars, options) => { reveal = options }
		},
		SplitText: class {
			constructor() {
				this.words = [6, 3, 6].map(count => ({ children: Array.from({ length: count }, () => ({})) }))
				this.chars = this.words.flatMap(word => word.children)
			}
			revert() { restored++ }
		},
		ScrollTrigger: { refresh: () => refreshed++ }
	}
	const exports = {}
	new Function('require', 'exports', 'document', 'console', code)(
		() => dependencies, exports, { fonts: { ready: fonts } }, { warn() {} }
	)
	const cleanup = exports.initFaqHeading({})
	return { cleanup, resolveFonts, get reveal() { return reveal }, counts: () => ({ reverted, restored, refreshed }) }
}

test('FAQ heading remains unsplit for reduced motion and restores text on initialization failure', () => {
	const reduced = harness({ reduced: true })
	assert.equal(reduced.reveal, undefined)
	reduced.cleanup()
	assert.deepEqual(reduced.counts(), { reverted: 0, restored: 0, refreshed: 0 })
	const failed = harness({ fail: true })
	assert.equal(failed.reveal, undefined)
	assert.deepEqual(failed.counts(), { reverted: 1, restored: 1, refreshed: 0 })
})

test('FAQ heading retains letter layout after playback and cleans up on unmount', async () => {
	const heading = harness()
	assert.equal(heading.reveal.duration, 1)
	assert.equal(heading.reveal.stagger, 0.045)
	assert.equal(heading.reveal.ease, 'power2.out')
	assert.equal(heading.reveal.scrollTrigger.once, true)
	assert.equal(heading.reveal.scrollTrigger.scrub, false)
	let killed = 0
	heading.reveal.onComplete.call({ scrollTrigger: { kill: (revert, allowAnimation) => {
		assert.equal(revert, false)
		assert.equal(allowAnimation, true)
		killed++
	} } })
	assert.equal(killed, 1)
	assert.equal(heading.counts().restored, 0)
	heading.cleanup()
	heading.resolveFonts()
	await Promise.resolve()
	assert.equal(heading.counts().reverted, 1)
	assert.equal(heading.counts().restored, 1)
	assert.equal(heading.counts().refreshed, 0)
})
