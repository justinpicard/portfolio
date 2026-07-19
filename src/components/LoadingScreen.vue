<template>
	<div
		ref="intro"
		class="intro-screen"
		aria-hidden="true"
	>
		<svg
			class="intro-screen__overlay"
			width="100%"
			height="100%"
			aria-hidden="true"
		>
			<defs>
				<path id="intro-monogram-outline" d="M40.05,729.15c-2.42,0-4.88-.22-7.35-.68-21.71-4.03-36.05-24.9-32.03-46.61,1.2-6.45,30.05-159.69,98.17-319.68,40.64-95.46,86.97-173.45,137.69-231.78C303.31,53.59,378.21,10.14,459.16,1.24c71.63-7.87,110.53,23.09,130.55,50.45,30.77,42.05,36.87,102.35,28.66,166.21,46.11-18.03,91.34-29.06,136.9-33.45,59.61-5.75,139.46,7.77,184.82,62.95,17.62,21.44,35.05,55.72,30.73,105.24,29.65,7.57,59.15,17.84,88.09,30.75,20.17,9,29.24,32.65,20.24,52.83-9,20.17-32.65,29.24-52.83,20.24-27.04-12.06-52.9-20.72-77.15-26.8-8.99,19-20.47,37.04-34.33,53.94-19.6,23.89-43.5,44.98-71.06,62.69-49.91,32.07-109.7,50.78-159.89,50.04-56.85-.84-97.62-26.85-109.05-69.59-10.72-40.06,6.72-83.16,47.85-118.25,43.06-36.74,108.88-61.99,180.57-69.27,28.96-2.94,58.52-3.02,88.27-.31.23-16.22-4.16-29.68-13.22-40.7-20.61-25.07-66.96-38.79-115.34-34.12-54.43,5.25-109.01,22.08-166.63,51.42-8.21,26.13-17.94,51.59-28.48,75.41-54.37,122.82-154.81,258.55-273.69,271.14-24.71,2.62-46.12-11.48-53.26-35.08-8.14-26.91,4.98-60.04,15.56-82.62,13.9-29.68,34.71-62.88,60.17-96,34.36-44.7,105.88-125.71,212.05-187.13,5.46-21.43,9.3-42.13,11.33-61.4,4.78-45.41-.49-81.23-14.87-100.87-7.12-9.72-20.78-22.18-57.26-18.18-60.17,6.61-117.57,40.82-170.61,101.67-45.16,51.81-87,122.43-124.34,209.89-64.89,151.99-93.34,302.62-93.62,304.12-3.58,19.25-20.39,32.7-39.28,32.7ZM476.84,395.73c-32.16,27.33-62.13,58.01-88.53,90.88-24.55,30.57-41.38,57.16-52.37,77.79,19.55-11.59,39.7-28.46,59.84-50.23,29.33-31.7,57.41-72.85,81.05-118.43ZM848.52,416.95c-13.73,0-26.18.73-37.19,1.85-79.39,8.06-122.07,38.03-136.73,50.54-18.17,15.51-24.39,29.61-22.49,36.72,1.28,4.76,13.26,9.99,32.95,10.28.58,0,1.17.01,1.76.01,53.04,0,134.88-34.51,177.67-99.07-5.49-.22-10.82-.33-15.97-.33Z" />
				<circle id="intro-monogram-dot" cx="1013.42" cy="556.39" r="39.96" />
				<clipPath
					id="intro-monogram-outline-clip"
					clipPathUnits="userSpaceOnUse"
				>
					<use href="#intro-monogram-outline" />
				</clipPath>

				<mask
					id="intro-overlay-mask"
					maskUnits="userSpaceOnUse"
					x="0"
					y="0"
					width="100%"
					height="100%"
					style="mask-type: luminance"
				>
					<rect width="100%" height="100%" fill="white" />
					<svg
						ref="monogramMask"
						class="intro-screen__monogram-mask"
						x="0"
						y="0"
						width="200"
						height="134.7"
						viewBox="0 0 1082.63 729.15"
					>
						<path
							ref="monogramLine"
							d="M40,689.14S153.87,75.03,463.52,40.99c257.82-28.34,45.01,558.1-173.58,581.27-49.7,5.27,63.1-224.68,281.4-338.9,55.97-29.28,118.72-52.45,187.76-59.11,90.02-8.68,202.15,35.28,165.05,159.23-48.81,163.05-287.8,218.5-310.7,132.91s187.5-204.27,429.14-96.48"
							fill="none"
							stroke="black"
							stroke-width="80"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-dasharray="10000"
							stroke-dashoffset="10000"
							clip-path="url(#intro-monogram-outline-clip)"
						/>
						<use
							ref="monogramDot"
							href="#intro-monogram-dot"
							fill="black"
							opacity="0"
						/>
					</svg>
				</mask>
			</defs>

			<rect
				class="intro-screen__background"
				width="100%"
				height="100%"
				mask="url(#intro-overlay-mask)"
			/>
		</svg>
		<slot />
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap, prefersReducedMotion } from '../utils/animations/gsap'

const intro = ref<HTMLElement | null>(null)
const monogramMask = ref<SVGSVGElement | null>(null)
const monogramLine = ref<SVGPathElement | null>(null)
const monogramDot = ref<SVGUseElement | null>(null)
const SIGNATURE_DRAW_DURATION = 2.4
const SIGNATURE_DOT_OVERLAP = 0.125
const SIGNATURE_ZOOM_DELAY = 0.15
const SIGNATURE_ZOOM_BOUNCE_SCALE = 0.75
const SIGNATURE_ZOOM_BOUNCE_DURATION = 0.32
const SIGNATURE_ZOOM_DURATION = 0.45
const SIGNATURE_ZOOM_OVERSCAN = 20
const SIGNATURE_MONOGRAM_WIDTH = 200
const SIGNATURE_MONOGRAM_HEIGHT = 134.7
let signatureDrawTimeline: gsap.core.Timeline | undefined

onMounted(() => {
	const introElement = intro.value
	const mask = monogramMask.value
	const line = monogramLine.value
	const dot = monogramDot.value
	if (!introElement || !mask || !line || !dot) return

	const layout = getSignatureLayout()

	gsap.set(mask, {
		attr: {
			x: layout.x,
			y: layout.y
		},
		scale: 1,
		svgOrigin: `${layout.centerX} ${layout.centerY}`
	})

	if (prefersReducedMotion()) {
		gsap.set(line, { strokeDashoffset: 0 })
		gsap.set(dot, { opacity: 1 })
		gsap.set(mask, {
			attr: {
				x: layout.x,
				y: layout.y
			},
			scale: layout.zoomScale,
			svgOrigin: `${layout.centerX} ${layout.centerY}`
		})
		return
	}

	const lineLength = line.getTotalLength()

	gsap.set(line, {
		strokeDasharray: lineLength,
		strokeDashoffset: lineLength
	})

	signatureDrawTimeline = gsap.timeline()
		.to(line, {
			strokeDashoffset: 0,
			duration: SIGNATURE_DRAW_DURATION,
			ease: 'power2.inOut'
		})
		.set(dot, {
			opacity: 1
		}, `-=${SIGNATURE_DOT_OVERLAP}`)
		.to(mask, {
			scale: SIGNATURE_ZOOM_BOUNCE_SCALE,
			svgOrigin: `${layout.centerX} ${layout.centerY}`,
			duration: SIGNATURE_ZOOM_BOUNCE_DURATION,
			ease: 'sine.inOut'
		}, `+=${SIGNATURE_ZOOM_DELAY}`)
		.to(mask, {
			scale: layout.zoomScale,
			svgOrigin: `${layout.centerX} ${layout.centerY}`,
			duration: SIGNATURE_ZOOM_DURATION,
			ease: 'expo.in'
		})
		.set(introElement, {
			autoAlpha: 0,
			pointerEvents: 'none'
		})
	})

onUnmounted(() => {
	signatureDrawTimeline?.kill()
})

function getSignatureDrawTimeline() {
	return signatureDrawTimeline
}

function getSignatureLayout() {
	const bounds = intro.value?.getBoundingClientRect()
	const width = bounds?.width ?? 0
	const height = bounds?.height ?? 0
	const viewportDiagonal = Math.hypot(width, height)
	const centerX = width / 2
	const centerY = height / 2

	return {
		x: centerX - SIGNATURE_MONOGRAM_WIDTH / 2,
		y: centerY - SIGNATURE_MONOGRAM_HEIGHT / 2,
		centerX,
		centerY,
		zoomScale: (viewportDiagonal / SIGNATURE_MONOGRAM_WIDTH) * SIGNATURE_ZOOM_OVERSCAN
	}
}

defineExpose({
	element: intro,
	monogramMask,
	getSignatureDrawTimeline
})
</script>
