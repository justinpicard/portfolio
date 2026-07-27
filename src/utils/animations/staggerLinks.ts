import { gsap, SplitText, registerGsapPlugins } from './gsap'
import { staggerLinkPreset } from './presets'

const STAGGER_LINK_SELECTOR = '[data-stagger-link]'
const STAGGER_LINK_CONTAINER_SELECTOR = '[data-stagger-link-container]'

type StaggerLinkInstance = {
	destroy: () => void
}

export type StaggerLinksController = {
	destroy: () => void
}

function findStaggerLinks(root: ParentNode) {
	const links = Array.from(root.querySelectorAll<HTMLElement>(STAGGER_LINK_SELECTOR))

	if (root instanceof HTMLElement && root.matches(STAGGER_LINK_SELECTOR)) {
		links.unshift(root)
	}

	return links
}

function initStaggerLink(link: HTMLElement): StaggerLinkInstance | undefined {
	const container = link.querySelector<HTMLElement>(STAGGER_LINK_CONTAINER_SELECTOR)
	if (!container) return undefined

	const split = new SplitText(container, {
		type: 'chars',
		charsClass: 'stagger-link-char'
	})
	const chars = split.chars

	function animate(isActive: boolean) {
		gsap.to(chars, {
			yPercent: isActive ? -100 : 0,
			...staggerLinkPreset,
			overwrite: true
		})
	}

	function handlePointerEnter() {
		animate(true)
	}

	function handlePointerLeave() {
		animate(false)
	}

	function handleFocusIn() {
		animate(true)
	}

	function handleFocusOut() {
		animate(false)
	}

	link.addEventListener('pointerenter', handlePointerEnter)
	link.addEventListener('pointerleave', handlePointerLeave)
	link.addEventListener('focusin', handleFocusIn)
	link.addEventListener('focusout', handleFocusOut)

	return {
		destroy() {
			link.removeEventListener('pointerenter', handlePointerEnter)
			link.removeEventListener('pointerleave', handlePointerLeave)
			link.removeEventListener('focusin', handleFocusIn)
			link.removeEventListener('focusout', handleFocusOut)
			gsap.killTweensOf(chars)
			split.revert()
		}
	}
}

export function initStaggerLinks(root: ParentNode = document): StaggerLinksController {
	registerGsapPlugins()

	const instances = findStaggerLinks(root)
		.map(initStaggerLink)
		.filter((instance): instance is StaggerLinkInstance => Boolean(instance))

	return {
		destroy() {
			instances.forEach((instance) => instance.destroy())
		}
	}
}
