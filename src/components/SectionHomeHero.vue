<template>
  <div class="home-hero">
    <div class="limits"></div>
    <div class="half"></div>
    <div class="marquee-container">
      <div class="wrapperRollingText">
        <div class="rollingText text">
          <span class=""><span class="star">✦</span> Justin Picard</span>
          <span><span class="star">✦</span> Justin Picard</span>
        </div>
      </div>

      <div class="wrapperRollingText02"l>
        <div class="rollingText02 text">
          <span><span class="star">✦</span> Digital product designer</span>
          <span><span class="star">✦</span> Vibe coder</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

function getImageUrl(name, ext) {
  return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}

gsap.registerPlugin(ScrollTrigger)

onMounted(() => {
  let direction = 1

  const roll1 = roll('.rollingText', { duration: 20 })
  const roll2 = roll('.rollingText02', { duration: 18 }, true)

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
})
</script>
<style>
.marquee-container {
    position: absolute;
    top: 50%;
    line-height: 1.33;
}
.wrapperRollingText {
  white-space: nowrap;
}
.rollingText,
.rollingText02 {
  font-size: 16vw;
  display: inline-block;
}
.rollingText > span,
.rollingText02 > span {
  padding-left: 3rem;
}

.wrapperRollingText02 {
  white-space: nowrap;
  margin-top: 10px;
}
.limits {
  position: fixed;
  top: 20vh;
  height: 50vh;
  width: 1px;
}
.half {
  position: fixed;
  top: 50vh;
  width: 1px;
}
</style>