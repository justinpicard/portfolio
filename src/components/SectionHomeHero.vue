<template>
  <div class="home-hero">
    <div class="limits"></div>
    <div class="half"></div>
    <div class="marquee-container">
      <div class="wrapperRollingText">
        <div class="rollingText text">
          <span><span class="star">✦</span> Justin Picard</span>
		  <span><span class="star">✦</span> Justin Picard</span>
		  <span><span class="star">✦</span> Justin Picard</span>
		  <span><span class="star">✦</span> Justin Picard</span>
        </div>
      </div>

      <div class="wrapperRollingText02">
        <div class="rollingText02 text" style="">
          <span><span class="star">✦</span> Digital product designer</span>
          <span><span class="star">✦</span> Vibe coder</span>
		  <span><span class="star">✦</span> Digital product designer</span>
          <span><span class="star">✦</span> Vibe coder</span>
        </div>
      </div>
    </div>
	<div class="personal-image" ref="personalImage">
      <figure>
        <img :src="getImageUrl('justin-picard','jpg')" alt="">
      </figure>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'

const personalImage = ref(null)

function getImageUrl(name, ext) {
  return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}

gsap.registerPlugin(ScrollTrigger)

onMounted(() => {
  document.fonts.ready.then(() => {
    let direction = 1

    const roll1 = roll('.rollingText', { duration: 40 })
    const roll2 = roll('.rollingText02', { duration: 39 }, true)

    requestAnimationFrame(() => {
      const rollingTextSplit = new SplitType('.rollingText:not(.is-clone)', { types: 'words, chars' })
      const rollingText02Split = new SplitType('.rollingText02:not(.is-clone)', { types: 'words, chars' })

      gsap.from('.rollingText:not(.is-clone) .char', {
        opacity: 0,
        yPercent: 100,
        stagger: 0.015,
        duration: 0.7,
        ease: 'power2.out',
		delay: 2.4
      })

      gsap.from('.rollingText02:not(.is-clone) .char', {
        opacity: 0,
        yPercent: 100,
        stagger: 0.015,
        duration: 0.7,
        ease: 'power2.out',
		delay: 2.4
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
        let skew = clamp(self.getVelocity() / -300)
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

      const elements = gsap.utils.toArray(targets)
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

      window.addEventListener('resize', () => {
        const time = tl.totalTime()
        tl.totalTime(0)
        positionClones()
        tl.totalTime(time)
      }) 

      return tl
    }
  });
})
</script>

<style scoped>
.text {
  overflow: hidden;
  display: inline-block;
  position: relative;
  /*mask-image: linear-gradient(to top, black 60%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, black 60%, transparent 100%);*/
}
</style>