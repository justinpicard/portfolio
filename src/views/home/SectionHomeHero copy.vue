<template>
  <div class="home-hero" ref="root">
    <div class="limits"></div>
    <div class="half"></div>
    <div class="marquee-container heading-font bold">
      <div class="wrapperRollingText">
        <div class="rollingText text">
          <span><span class="star">✦</span> Justin Picard</span>
		  <span><span class="star">✦</span> Justin Picard</span>
        </div>
      </div>

      <div class="wrapperRollingText02">
        <div class="rollingText02 text">
          <span><span class="star">✦</span> Digital product designer</span>
		  <span><span class="star">✦</span> Digital product designer</span>
          <span><span class="star">✦</span> Digital product designer</span>
        </div>
      </div>
	</div>
	<div class="personal-image" ref="personalImage">
      <figure>
        <BaseImage
          src="/images/justin-picard"
          alt="Justin Picard"
        />
      </figure>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap, ScrollTrigger, registerGsapPlugins } from '../../utils/animations/gsap'
import SplitType from 'split-type'
import BaseImage from '../../components/base/BaseImage.vue'

const personalImage = ref(null)
const root = ref(null)
let ctx
const splitInstances = []
const cleanupRolls = []

onMounted(() => {
  registerGsapPlugins()

  document.fonts.ready.then(() => {
    ctx = gsap.context(() => {
      let direction = 1

      const roll1 = roll('.rollingText', { duration: 20 })
      const roll2 = roll('.rollingText02', { duration: 39 }, true)

      requestAnimationFrame(() => {
        const rollingTextSplit = new SplitType(root.value.querySelectorAll('.rollingText:not(.is-clone)'), { types: 'words, chars' })
        const rollingText02Split = new SplitType(root.value.querySelectorAll('.rollingText02:not(.is-clone)'), { types: 'words, chars' })
        splitInstances.push(rollingTextSplit, rollingText02Split)

        gsap.from('.rollingText:not(.is-clone) .char', {
          opacity: 0,
          yPercent: 100,
          stagger: 0.015,
          duration: 0.7,
          ease: 'power2.out',
          delay: 2.5
        })

        gsap.from('.rollingText02:not(.is-clone) .char', {
          opacity: 0,
          yPercent: 100,
          stagger: 0.015,
          duration: 0.7,
          ease: 'power2.out',
          delay: 2.5
        })
      })

      // Animate personal image entrance
      gsap.fromTo(
        personalImage.value,
        {
          yPercent: 100,
          rotate: -12,
          opacity: 0
        },
        {
          yPercent: -50,
          rotate: 0,
          opacity: 1,
          ease: 'power3.inOut',
          duration: 1,
          delay: 2.2
        }
      )

      // Skew on scroll effect
      let proxy = { skew: 0 },
        skewSetter = gsap.quickSetter(personalImage.value, "skewY", "deg"),
        clamp = gsap.utils.clamp(-20, 20)

      ScrollTrigger.create({
        onUpdate: (self) => {
          let skew = clamp(self.getVelocity() / 600)
          if (Math.abs(skew) > Math.abs(proxy.skew)) {
            proxy.skew = skew
            gsap.to(proxy, {
              skew: 0,
              duration: 0.8,
              ease: "power3",
              overwrite: true,
              onUpdate: () => skewSetter(proxy.skew)
            })
          }
        }
      })

      gsap.set(personalImage.value, { transformOrigin: "center center", force3D: true })

      ScrollTrigger.create({
        onUpdate(self) {
          if (self.direction !== direction) {
            direction *= -1
            gsap.to([roll1, roll2], { timeScale: direction, overwrite: true })
          }
        }
      })

      function roll(targets, vars = {}, reverse = false) {
        vars.ease ||= 'none'

        const tl = gsap.timeline({
          repeat: -1,
          onReverseComplete() {
            this.totalTime(this.rawTime() + this.duration() * 10)
          }
        })

        const elements = gsap.utils.toArray(targets, root.value)
        const clones = elements.map(el => {
          const clone = el.cloneNode(true)
          clone.classList.add('is-clone')
          el.parentNode.appendChild(clone)
          return clone
        })

        const positionClones = () => {
          elements.forEach((el, i) => {
            gsap.set(clones[i], {
              position: 'absolute',
              overwrite: false,
              top: el.offsetTop,
              left: el.offsetLeft + (reverse ? -el.offsetWidth : el.offsetWidth)
            })
          })
        }

        positionClones()

        elements.forEach((el, i) => {
          tl.to([el, clones[i]], {
            xPercent: reverse ? 100 : -100,
            ...vars
          }, 0)
        })

        let resizeCall
        const reposition = () => {
          const time = tl.totalTime()
          tl.totalTime(0)
          positionClones()
          tl.totalTime(time)
        }
        const onResize = () => {
          resizeCall?.kill()
          resizeCall = gsap.delayedCall(0.15, reposition)
        }

        window.addEventListener('resize', onResize)
        cleanupRolls.push(() => {
          window.removeEventListener('resize', onResize)
          resizeCall?.kill()
          tl.kill()
          clones.forEach(clone => clone.remove())
        })

        return tl
      }
    }, root.value)
  });
})

onUnmounted(() => {
  ctx?.revert()
  cleanupRolls.forEach(cleanup => cleanup())
  splitInstances.forEach(split => split.revert())
})
</script>
