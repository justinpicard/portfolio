export function isModifiedClick(event: Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>) {
	return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}
