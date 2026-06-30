<template>
  <section class="section about">
    <div class="container">
      <div class="row">
        <div class="col-12 col-lg-10 offset-lg-1 mb-3" ref="aboutText">
          	<p  class="about-text text-xl heading-font narrow-bold mb-1">Hi <span class="wave">👋🏼</span> my name is Justin and I'm a digital product designer from The Netherlands. I love designing and building applications that look great and are easy to use.
  			</p>
			<p>I am currently focussing on building scalable design systems and improving the user experience of SaaS products. In my free time, I love exploring side projects that combine design and development, usually something with too many ideas and too little time.</p>
		</div>
		<div class="col-12 col-lg-10 offset-lg-1 mt-8">
			<Button
				label="More about me"
				:to="{ name: 'about' }"
				variant="outlined"
				color="light"
				size="md"
			/>
        </div>
		
      </div>
    </div>
	<img 
		ref="duhGif"
		:src="getImageUrl('duh','gif')"
		alt="duh gif"
		class="duh-gif"
	/>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap, SplitText, registerGsapPlugins } from '../../utils/animations/gsap'
import { animationDurations, animationEases, animationStaggers } from '../../utils/animations/presets'
import { getImageUrl } from '../../utils/image'
import Button from '../../components/Button.vue'

const aboutText = ref<HTMLElement | null>(null)
const duhGif = ref<HTMLImageElement | null>(null)
let aboutSplit: any
let ctx: gsap.Context | undefined
let onMouseMove: ((event: MouseEvent) => void) | undefined

onMounted(() => {
	registerGsapPlugins()

	ctx = gsap.context(() => {
		aboutSplit = new SplitText(aboutText.value, { type: 'lines', linesClass: 'split-line' })

		aboutSplit.lines.forEach((line: Element) => {
			const wrapper = document.createElement('div')
			wrapper.classList.add('split-line-wrapper')
			line.parentNode?.insertBefore(wrapper, line)
			wrapper.appendChild(line)
		})

		gsap.fromTo(
			aboutSplit.lines,
			{ 
				y: 90, 
				opacity: 1 
			},
			{
				y: 0,
				opacity: 1,
				duration: animationDurations.reveal,
				stagger: animationStaggers.lines,
				ease: animationEases.strongOut,
				scrollTrigger: {
					trigger: aboutText.value,
					start: 'top 60%',
					toggleActions: 'play reverse play reverse'
				}
			}
		)
	}, aboutText.value ?? undefined)

  let setX: (v: number) => void
  let setY: (v: number) => void

  if (duhGif.value) {
    gsap.set(duhGif.value, { xPercent: -50, yPercent: -50 })
    setX = gsap.quickTo(duhGif.value, "left", { duration: 0.3, ease: "power3.out" })
    setY = gsap.quickTo(duhGif.value, "top", { duration: 0.3, ease: "power3.out" })
  }

  onMouseMove = (e) => {
    if (duhGif.value?.style.display === "block") {
      setX(e.clientX)
      setY(e.clientY)
    }
  }

  document.addEventListener("mousemove", onMouseMove)
})

onUnmounted(() => {
	ctx?.revert()
	aboutSplit?.revert()

	if (onMouseMove) {
		document.removeEventListener("mousemove", onMouseMove)
	}
})
</script>
