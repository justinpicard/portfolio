<template>
  <div class="marquee marquee-container" ref="container">
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
        <li>{{ t('navigation.role') }}</li>
        <li>{{ t('navigation.role') }}</li>
        <li>{{ t('navigation.role') }}</li>
        <li>{{ t('navigation.role') }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap, ScrollTrigger, registerGsapPlugins } from '../utils/animations/gsap'
import { animationEases } from '../utils/animations/presets'

const { t } = useI18n()
const container = ref(null)
let ctx
let cleanupClones = () => {}

function seamlessLoop(items, config = {}) {
  let tl = gsap.timeline({ repeat: -1, paused: true }),
      duration = config.duration || 1,
      totalItems = items.length,
      clones = []

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
      ease: animationEases.none
    }, 0)
  })

  return { tl, clones }
}

onMounted(async () => {
  await nextTick()
  registerGsapPlugins()

  ctx = gsap.context(() => {
    const root = container.value
    const loopLeftEls = root.querySelectorAll('.loop--left li')
    const loopRightEls = root.querySelectorAll('.loop--right li')

    const loop1 = seamlessLoop([...loopLeftEls], { duration: 1 })
    const loop2 = seamlessLoop([...loopRightEls], { duration: 1 })

    cleanupClones = () => {
      loop1.clones.forEach(clone => clone.remove())
      loop2.clones.forEach(clone => clone.remove())
    }

    ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom+=10000 top",
      scrub: true,
      onUpdate: (self) => {
        const velocity = self.getVelocity()
        const clamped = gsap.utils.clamp(-3, 3, velocity / 300)
        loop1.tl.timeScale(clamped)
        loop2.tl.timeScale(-clamped)
      }
    })
  }, container.value)
})

onUnmounted(() => {
  ctx?.revert()
  cleanupClones()
})
</script>
