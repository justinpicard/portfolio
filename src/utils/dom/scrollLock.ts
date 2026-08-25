import { lockPortfolioScrollSmoothing } from '../animations/portfolioScrollSmoother'

type ScrollLockState = {
	bodyOverflow: string
	scrollX: number
	scrollY: number
	count: number
	unlockSmoothing: () => void
}

let scrollLockState: ScrollLockState | undefined

export function lockPageScroll() {
	if (typeof window === 'undefined') {
		return () => {}
	}

	if (scrollLockState) {
		scrollLockState.count += 1
		return createUnlock()
	}

	const body = document.body
	const unlockSmoothing = lockPortfolioScrollSmoothing()

	scrollLockState = {
		bodyOverflow: body.style.overflow,
		scrollX: window.scrollX,
		scrollY: window.scrollY,
		count: 1,
		unlockSmoothing
	}

	body.style.overflow = 'hidden'

	return createUnlock()
}

function createUnlock() {
	let hasUnlocked = false

	return () => {
		if (hasUnlocked || !scrollLockState) return

		hasUnlocked = true
		scrollLockState.count -= 1

		if (scrollLockState.count > 0) return

		const {
			bodyOverflow,
			scrollX,
			scrollY,
			unlockSmoothing
		} = scrollLockState

		document.body.style.overflow = bodyOverflow
		window.scrollTo(scrollX, scrollY)
		unlockSmoothing()
		scrollLockState = undefined
	}
}
