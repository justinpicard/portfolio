<template>
  <div class="marquee-container">
    <div class="loop-wrap">
      <ul class="loop loop--left">
        <li>Justin Picard</li>
        <li>Justin Picard</li>
        <li>Justin Picard</li>
        <li>Justin Picard</li>
      </ul>
    </div>

    <div class="loop-wrap">
      <ul class="loop loop--right">
        <li>Product designer</li>
        <li>Product designer</li>
        <li>Product designer</li>
        <li>Product designer</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function seamlessLoop(items, config = {}) {
  let tl = gsap.timeline({ repeat: -1, paused: true }),
      duration = config.duration || 1,
      totalItems = items.length,
      clones = [],
      position = 0

  items.forEach((item, i) => {
    let clone = item.cloneNode(true)
    item.parentNode.appendChild(clone)
    clones.push(clone)
  })

  const allItems = [...items, ...clones]

  allItems.forEach((item, i) => {
    let distance = i * 100
    tl.to(item, {
      xPercent: `-=${100 * totalItems}`,
      duration: duration * totalItems,
      ease: 'none'
    }, 0)
  })

  return tl
}

onMounted(async () => {
  await nextTick()

  const loopLeftEls = document.querySelectorAll('.loop--left li')
  const loopRightEls = document.querySelectorAll('.loop--right li')

  const loop1 = seamlessLoop([...loopLeftEls], { duration: 1 })
  const loop2 = seamlessLoop([...loopRightEls], { duration: 1 })

  ScrollTrigger.create({
  trigger: ".marquee-container", // of een ID als je wilt
  start: "top top",
  end: "bottom+=10000 top",
  scrub: true,
    onUpdate: (self) => {
      const velocity = self.getVelocity()
      const clamped = gsap.utils.clamp(-3, 3, velocity / 300)
      loop1.timeScale(clamped)
      loop2.timeScale(-clamped)
    }
  })
})
</script>

<style scoped>
.marquee-container {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.loop-wrap {
  overflow: hidden;
  width: 100%;
}

.loop {
  display: flex;
  white-space: nowrap;
  padding: 0;
  margin: 0;
  list-style: none;
  will-change: transform;
}

.loop li {
  font-size: 6vw;
  padding: 0 2vw;
  white-space: nowrap;
}
</style>