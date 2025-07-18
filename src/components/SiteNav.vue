<template>
	<div class="main-nav position-relative">
		<div class="position-fixed top-0 left-0 ml-2 mt-2">
			<router-link :to="{ name: 'home' }" class="site-logo">
				<figure class="avatar">
					<img :src="getImageUrl('justin-picard-avatar','jpg')" alt="">
				</figure>
				<span class="site-title">
					<h1>Justin Picard</h1>
					<h2>Digital Product Designer</h2>
				</span>
			</router-link>
		</div>
		<div class="position-fixed top-0 right-0 mr-2 mt-3">
			<div class="nav-links">
				<router-link :to="{ name: 'home' }" class="nav-link" @mouseenter="onEnter('work')" @mouseleave="onLeave('work')">
					<div class="slot-machine-text">
						<div class="slot-machine-text-container">
							<span ref="textTopWork">Work</span>
							<span ref="textBottomWork">Work</span>
						</div>
					</div>
				</router-link>
				<span class="star">✦</span>
				<router-link :to="{ name: 'about' }" class="nav-link" @mouseenter="onEnter('about')" @mouseleave="onLeave('about')">
					<div class="slot-machine-text">
						<div class="slot-machine-text-container">
							<span ref="textTopAbout">About</span>
							<span ref="textBottomAbout">About</span>
						</div>
					</div>
				</router-link>
				<span class="star">✦</span>
				<a href="mailto:hallo@justinpicard.nl" class="nav-link" @mouseenter="onEnter('mail')" @mouseleave="onLeave('mail')">
					<div class="slot-machine-text">
						<div class="slot-machine-text-container">
							<span ref="textTopMail">hallo@justinpicard.nl</span>
							<span ref="textBottomMail">hallo@justinpicard.nl</span>
						</div>
					</div>
				</a>
			</div><!-- end .nav-links -->
		</div><!-- end nav container-->
	</div>
</template>

<script>
import { ref, onMounted, getCurrentInstance } from 'vue'
import { SplitText } from 'gsap/SplitText'
import gsap from 'gsap'

export default {
  methods: {
    getImageUrl(name, ext) {
      return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
    },
    copy() {
      try {
        navigator.clipboard.writeText(this.text)
        console.log('Copied ' + this.text)
      } catch (e) {
        console.log('Failed to copy ' + this.text)
        throw e
      }
    },
    onEnter(name) {
      this.timelines[name].play()
    },
    onLeave(name) {
      this.timelines[name].reverse()
    }
  },
  data() {
    return {
      text: 'hallo@justinpicard.nl',
      timelines: {},
    }
  },
  setup() {
    const textTopWork = ref(null)
    const textBottomWork = ref(null)
    const textTopAbout = ref(null)
    const textBottomAbout = ref(null)
    const textTopMail = ref(null)
    const textBottomMail = ref(null)

    onMounted(() => {
      const entries = [
        { key: 'work', top: textTopWork.value, bottom: textBottomWork.value },
        { key: 'about', top: textTopAbout.value, bottom: textBottomAbout.value },
        { key: 'mail', top: textTopMail.value, bottom: textBottomMail.value },
      ]

      entries.forEach(({ key, top, bottom }) => {
        const topSplit = new SplitText(top, { type: 'chars', charsClass: 'chars' })
        const bottomSplit = new SplitText(bottom, { type: 'chars', charsClass: 'chars' })

        const timeline = gsap.timeline({ paused: true })
        timeline
          .to(topSplit.chars, {
            y: -20,
            opacity: 0,
            stagger: 0.02,
            duration: 0.3,
            ease: 'power2.out'
          }, 0)
          .fromTo(bottomSplit.chars,
            { y: 10, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.02,
              duration: 0.3,
              ease: 'power2.out'
            }, 0)

        // Save reference to the timeline for control
        const vm = getCurrentInstance().proxy
        vm.timelines[key] = timeline
      })
    })

    return {
      textTopWork,
      textBottomWork,
      textTopAbout,
      textBottomAbout,
      textTopMail,
      textBottomMail
    }
  }
}
</script>

<style scoped>
.slot-machine-text {
  overflow: hidden;
  display: block;
  height: 2rem;
  position: relative;
}

.slot-machine-text-container {
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
  position: relative;
}

.slot-machine-text-container span:nth-child(2) {
  position: absolute;
  top: 0;
  left: 0;
}

.slot-machine-text-container span {
  display: inline-block;
  white-space: nowrap;
  will-change: transform, opacity;
}

.chars {
  display: inline-block;
}
</style>