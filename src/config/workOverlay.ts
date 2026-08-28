export type WorkOverlayLifecycle =
	| 'closed'
	| 'opening'
	| 'open'
	| 'switching'
	| 'closing'

export type WorkCloseTarget = {
	card: HTMLElement
	homepageScrollY: number
	rect: {
		top: number
		left: number
		right: number
		bottom: number
		width: number
		height: number
	}
	borderRadius: string
}
