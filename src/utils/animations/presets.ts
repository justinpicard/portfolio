export const animationDurations = {
	fast: 0.3,
	base: 0.7,
	reveal: 0.8,
	intro: 1
} as const

export const animationEases = {
	out: 'power2.out',
	strongOut: 'power3.out',
	inOut: 'power2.inOut',
	strongInOut: 'power3.inOut',
	none: 'none'
} as const

export const animationStaggers = {
	chars: 0.015,
	charsLoose: 0.02,
	lines: 0.1
} as const

export const slotTextPreset = {
	duration: animationDurations.fast,
	ease: animationEases.out,
	stagger: animationStaggers.chars
} as const
