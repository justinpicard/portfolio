const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]'

export function containDialogFocus(dialog: HTMLElement) {
	function getFocusableElements() {
		return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
			.filter((element) => element.tabIndex >= 0
				&& !element.matches(':disabled, [aria-disabled="true"]')
				&& !element.closest('[inert], [aria-hidden="true"]')
				&& element.getClientRects().length > 0
				&& getComputedStyle(element).visibility !== 'hidden')
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab') return
		const elements = getFocusableElements()
		const first = elements[0] ?? dialog
		const last = elements[elements.length - 1] ?? dialog
		const active = document.activeElement
		if (!elements.includes(active as HTMLElement)
			|| (event.shiftKey && active === first)
			|| (!event.shiftKey && active === last)) {
			event.preventDefault()
			const target = event.shiftKey ? last : first
			target.focus({ preventScroll: true })
		}
	}

	function handleFocusIn(event: FocusEvent) {
		if (event.target instanceof Node && !dialog.contains(event.target)) {
			(getFocusableElements()[0] ?? dialog).focus({ preventScroll: true })
		}
	}

	dialog.addEventListener('keydown', handleKeydown)
	document.addEventListener('focusin', handleFocusIn)
	dialog.focus({ preventScroll: true })
	return () => {
		dialog.removeEventListener('keydown', handleKeydown)
		document.removeEventListener('focusin', handleFocusIn)
	}
}
