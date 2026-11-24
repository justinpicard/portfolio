import assert from 'node:assert/strict'
import test from 'node:test'
import { mediaAppearanceStyles, mediaImageSizes, mapMediaSizes } from '../../src/utils/media/caseMedia.ts'

test('media appearance leaves legacy defaults alone and keeps mobile overrides separate', () => {
	assert.deepEqual(mediaAppearanceStyles(), {})
	const styles = mediaAppearanceStyles({ radius: 'none', crop: { ratio: '2 / 1', fit: 'contain' }, belowMd: { crop: null, padding: 'small' } })
	assert.equal(styles['--case-media-radius'], '0px')
	assert.equal(styles['--case-media-height'], '100%')
	assert.equal(styles['--case-media-ratio-mobile'], 'auto')
	assert.equal(styles['--case-media-height-mobile'], 'auto')
	assert.equal(styles['--case-media-padding-mobile'], 'var(--space-4)')
})

test('slot adjustments preserve commas within clamp and apply mobile settings only below md', () => {
	const slots = '(min-width: 48rem) calc(50vw - clamp(1.5rem, 2vw, 2rem)), calc(100vw - clamp(1.5rem, 2vw, 2rem))'
	assert.equal(mediaImageSizes(slots), slots)
	const result = mediaImageSizes(slots, { maxWidth: '40rem', padding: 'medium', belowMd: { maxWidth: '20rem', padding: 'none' } })
	assert.equal(result, '(min-width: 48rem) min(40rem, calc(calc(50vw - clamp(1.5rem, 2vw, 2rem)) - 2 * 2rem)), min(20rem, calc(100vw - clamp(1.5rem, 2vw, 2rem)))')
	assert.equal(mapMediaSizes(slots, (length, mobile) => mobile ? `min(24rem, ${length})` : length), '(min-width: 48rem) calc(50vw - clamp(1.5rem, 2vw, 2rem)), min(24rem, calc(100vw - clamp(1.5rem, 2vw, 2rem)))')
})

test('full-bleed hints still distinguish desktop and mobile appearance', () => {
	assert.equal(mediaImageSizes('100vw', { maxWidth: '60rem', belowMd: { maxWidth: '24rem' } }), '(min-width: 48rem) min(60rem, 100vw), min(24rem, 100vw)')
})

test('percentage caps use slot-relative lengths and none removes an inherited mobile cap', () => {
	assert.equal(mediaImageSizes('100vw', { maxWidth: '50%', belowMd: { maxWidth: 'none' } }), '(min-width: 48rem) min(calc(100vw * 0.5), 100vw), 100vw')
})
