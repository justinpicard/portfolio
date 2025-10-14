<template>
  <section class="section about">
    <div class="container">
      <div class="row">
        <div class="col-12">
          	<p ref="aboutText" class="about-text text-xl heading-font mb-3">Hi <span class="wave">👋🏼</span> my name is Justin and I'm a digital product designer and vibe coder from The Netherlands. I love designing and building applications and websites <span ref="obviouslyText" class="obviously">(obviously)</span> that look great and are easy to use. 
				
  			</p>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <router-link
            :to="{ name: 'about' }"
            class="btn btn-outlined btn-light btn-md"
            @mouseenter="onEnter"
            @mouseleave="onLeave"
          >
            <span class="btn-text-container">
              <span class="btn-text-wrapper top-text" ref="textTop">More about me</span>
              <span class="btn-text-wrapper bottom-text" ref="textBottom">More about me</span>
            </span>
            <div class="btn-bg rounded-pill"></div>
          </router-link>
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
import { ref, onMounted } from 'vue'
import { SplitText } from 'gsap/SplitText'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getImageUrl } from '../utils/image'

gsap.registerPlugin(ScrollTrigger)

const textTop = ref(null)
const textBottom = ref(null)
const aboutText = ref(null)
const obviouslyText = ref<HTMLElement | null>(null)
const duhGif = ref<HTMLImageElement | null>(null)

let topSplit: any
let bottomSplit: any
let hoverTimeline: gsap.core.Timeline

onMounted(() => {
	topSplit = new SplitText(textTop.value, { type: 'chars', charsClass: 'chars' })
	bottomSplit = new SplitText(textBottom.value, { type: 'chars', charsClass: 'chars' })
	
	hoverTimeline = gsap.timeline(
		{ 
			paused: true 
		}
	)
	hoverTimeline
	.to(
		topSplit.chars, 
		{
			y: -10,
			opacity: 0,
			stagger: 0.015,
			duration: 0.3,
			ease: 'power2.out'
		}, 
	0)
	.fromTo(
		bottomSplit.chars,
		{
			y: 10, 
			opacity: 0
		},
		{
			y: 0,
			opacity: 1,
			stagger: 0.015,
			duration: 0.3,
			ease: 'power2.out'
		},
	0)

  	const aboutSplit = new SplitText(aboutText.value, { type: 'lines', linesClass: 'split-line' })

	aboutSplit.lines.forEach((line: HTMLElement) => {
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
			duration: 0.8,
			stagger: 0.1,
			ease: 'power3.out',
			scrollTrigger: {
				trigger: aboutText.value,
				start: 'top 60%',
				toggleActions: 'play reverse play reverse'
			}
		}
	)

  obviouslyText.value?.addEventListener('mouseenter', () => {
    duhGif.value!.style.display = 'block'
  })
  obviouslyText.value?.addEventListener('mouseleave', () => {
    duhGif.value!.style.display = 'none'
  })

  let setX: (v: number) => void
  let setY: (v: number) => void

  if (duhGif.value) {
    gsap.set(duhGif.value, { xPercent: -50, yPercent: -50 })
    setX = gsap.quickTo(duhGif.value, "left", { duration: 0.3, ease: "power3.out" })
    setY = gsap.quickTo(duhGif.value, "top", { duration: 0.3, ease: "power3.out" })
  }

  document.addEventListener("mousemove", (e) => {
    if (duhGif.value?.style.display === "block") {
      setX(e.clientX)
      setY(e.clientY)
    }
  })
})

function onEnter() {
  	hoverTimeline.play()
}

function onLeave() {
  	hoverTimeline.reverse()
}
</script>