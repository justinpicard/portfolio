import type { CaseBlockWidth } from '../../content'

// Mirrors the page gutter, 64rem content breakpoint and 48rem column breakpoint.
export function caseImageSizes(width: CaseBlockWidth = 'content', columnShare = 1, columnGaps = 0) {
	const fraction = width === 'full' ? 1 : width === 'narrow' ? 0.5 : 2 / 3
	const gutter = 'clamp(1.5rem, 2vw, 2rem)'
	const size = (outerFraction: number, share: number, gaps: number) =>
		`calc(${100 * outerFraction * share}vw - ${2 * share} * ${gutter} - ${2 * gaps * share}rem)`
	return `(min-width: 64rem) ${size(fraction, columnShare, columnGaps)}, (min-width: 48rem) ${size(1, columnShare, columnGaps)}, ${size(1, 1, 0)}`
}
