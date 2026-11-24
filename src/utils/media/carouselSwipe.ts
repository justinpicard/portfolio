type SwipePoint = { x: number; y: number }

export function carouselSwipeDirection(start: SwipePoint, end: SwipePoint, threshold = 48): -1 | 0 | 1 {
	const x = end.x - start.x
	const y = end.y - start.y
	if (Math.abs(x) < threshold || Math.abs(x) <= Math.abs(y) * 1.5) return 0
	return x < 0 ? 1 : -1
}

export function wrapCarouselIndex(index: number, count: number): number {
	return count > 0 ? ((index % count) + count) % count : 0
}
