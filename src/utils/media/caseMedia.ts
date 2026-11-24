import type { CSSProperties } from 'vue'
import type { CaseMediaAppearance, CaseResponsiveMediaAppearance } from '../../content/types'

export const mediaSpacing = { none: '0px', small: 'var(--space-4)', medium: 'var(--space-8)', large: 'var(--space-12)' } as const
export const mediaSpacingLengths = { none: '0rem', small: '1rem', medium: '2rem', large: '3rem' } as const

export function mediaAppearanceStyles(appearance?: CaseResponsiveMediaAppearance): CSSProperties {
	const styles: Record<string, string> = {}
	function assign(value: CaseMediaAppearance | undefined, suffix: string) {
		if (!value) return
		const values = {
			radius: value.radius === 'none' ? '0px' : value.radius === 'default' ? 'clamp(1rem, 2.5vw, 2rem)' : value.radius ? `var(--radius-${value.radius})` : undefined,
			background: value.background,
			padding: value.padding ? mediaSpacing[value.padding] : undefined,
			max: value.maxWidth,
			align: value.align === 'start' ? '0 auto' : value.align === 'end' ? 'auto 0' : value.align === 'center' ? 'auto' : undefined,
			ratio: value.crop === null ? 'auto' : value.crop?.ratio,
			fit: value.crop?.fit ?? (value.crop ? 'cover' : undefined),
			position: value.crop?.position,
			height: value.crop === null ? 'auto' : value.crop ? '100%' : undefined
		}
		for (const [key, entry] of Object.entries(values)) {
			if (entry !== undefined) styles[`--case-media-${key}${suffix}`] = entry
		}
	}
	assign(appearance, '')
	assign(appearance?.belowMd, '-mobile')
	return styles as CSSProperties
}

/** Keep the existing slot hints, including nested calc/clamp expressions. */
export function mapMediaSizes(sizes: string, transform: (length: string, mobile: boolean) => string): string {
	const slots: string[] = []
	let depth = 0
	let start = 0
	for (let index = 0; index < sizes.length; index++) {
		if (sizes[index] === '(') depth++
		if (sizes[index] === ')') depth--
		if (sizes[index] === ',' && depth === 0) {
			slots.push(sizes.slice(start, index).trim())
			start = index + 1
		}
	}
	slots.push(sizes.slice(start).trim())
	if (slots.length === 1 && !slots[0]!.startsWith('(min-width:')) {
		return `(min-width: 48rem) ${transform(slots[0]!, false)}, ${transform(slots[0]!, true)}`
	}
	return slots.map(slot => {
		const match = slot.match(/^(\(min-width: [^)]+\)\s+)?(.*)$/)
		if (!match) return slot
		return `${match[1] ?? ''}${transform(match[2]!, !match[1])}`
	}).join(', ')
}

export function mediaImageSizes(sizes: string, appearance?: CaseResponsiveMediaAppearance): string {
	if (!appearance) return sizes
	return mapMediaSizes(sizes, (slot, mobile) => {
		const settings = mobile ? { ...appearance, ...appearance.belowMd } : appearance
		let length = slot
		if (settings.padding && settings.padding !== 'none') length = `calc(${length} - 2 * ${mediaSpacingLengths[settings.padding]})`
		if (settings.maxWidth && settings.maxWidth !== 'none') {
			const percentage = settings.maxWidth.match(/^(\d+(?:\.\d+)?)%$/)
			const cap = percentage ? `calc(${length} * ${Number(percentage[1]) / 100})` : settings.maxWidth
			length = `min(${cap}, ${length})`
		}
		return length
	})
}
