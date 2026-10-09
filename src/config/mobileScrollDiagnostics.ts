// TEMPORARY: opt in with ?mobileScrollDiagnostics, edit these flags, then reload.
// Remove this module and its call sites after physical-device isolation testing.
export const mobileScrollDiagnostics = {
	hero: true,
	about: true,
	workTitle: true,
	workPin: true,
	projectCards: true,
	lifeTitle: true,
	lifePhotos: true,
	sectionNavigation: true,
	// Separate from navigation so test J can restore the footer's scroll reactions.
	footer: true
}

type DiagnosticGroup = keyof typeof mobileScrollDiagnostics

export function isMobileScrollDiagnosticMode() {
	return typeof window !== 'undefined'
		&& window.matchMedia('(max-width: 63.999rem)').matches
		&& new URLSearchParams(window.location.search).has('mobileScrollDiagnostics')
}

export function isScrollDiagnosticGroupEnabled(group: DiagnosticGroup) {
	if (!isMobileScrollDiagnosticMode()) return true
	// Coverflow needs the native sticky stage. Without it, show usable static cards.
	if (group === 'projectCards' && !mobileScrollDiagnostics.workPin) return false
	return mobileScrollDiagnostics[group]
}
