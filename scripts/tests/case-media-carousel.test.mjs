import assert from 'node:assert/strict'
import test from 'node:test'
import { carouselSwipeDirection, wrapCarouselIndex } from '../../src/utils/media/carouselSwipe.ts'

const start = { x: 200, y: 200 }
test('carousel swipe follows deliberate horizontal gestures and ignores scrolling and taps', () => {
	assert.equal(carouselSwipeDirection(start, { x: 100, y: 210 }), 1)
	assert.equal(carouselSwipeDirection(start, { x: 300, y: 190 }), -1)
	assert.equal(carouselSwipeDirection(start, { x: 153, y: 200 }), 0)
	assert.equal(carouselSwipeDirection(start, { x: 152, y: 200 }), 1)
	assert.equal(carouselSwipeDirection(start, { x: 100, y: 300 }), 0)
	assert.equal(carouselSwipeDirection(start, { x: 150, y: 240 }), 0)
	assert.equal(carouselSwipeDirection(start, start), 0)
})

test('carousel indices loop in both directions, including small collections', () => {
	assert.equal(wrapCarouselIndex(-1, 3), 2)
	assert.equal(wrapCarouselIndex(3, 3), 0)
	assert.equal(wrapCarouselIndex(7, 3), 1)
	assert.equal(wrapCarouselIndex(-4, 3), 2)
	assert.equal(wrapCarouselIndex(1, 1), 0)
	assert.equal(wrapCarouselIndex(0, 0), 0)
})

test('mouse dragging snaps with a shorter deliberate distance while rejecting small or vertical movement', () => {
	assert.equal(carouselSwipeDirection(start, { x: 176, y: 200 }, 24), 1)
	assert.equal(carouselSwipeDirection(start, { x: 224, y: 200 }, 24), -1)
	assert.equal(carouselSwipeDirection(start, { x: 177, y: 200 }, 24), 0)
	assert.equal(carouselSwipeDirection(start, { x: 170, y: 250 }, 24), 0)
})
