<template>
	<div class="main-nav position-relative">
		<div class="position-fixed top-0 left-0 ml-8 mt-8">
			<router-link :to="{ name: 'home' }" class="site-logo">
				<figure class="avatar">
					<BaseImage
						src="/images/justin-picard-avatar"
						alt="Justin Picard"
					/>
				</figure>
				<span class="site-title">
					<span class="name heading-font bold text-md">Justin Picard</span>
					<span class="role body-font">Digital Product Designer</span>
				</span>
			</router-link>
		</div>
		<div class="position-fixed top-0 right-0 mr-8 mt-12">
			<div class="nav-links">
				<a href="mailto:hallo@justinpicard.nl" class="nav-link" @mouseenter="onEnter('mail')" @mouseleave="onLeave('mail')" @click.prevent="copy">
					<div class="slot-machine-text">
						<div class="slot-machine-text-container">
							<span ref="textTopMail">hallo@justinpicard.nl</span>
							<span class="bottom-text" ref="textBottomMail">Copy email adress</span>
						</div>
					</div>
				</a>
			</div><!-- end .nav-links -->
		</div><!-- end nav container-->
	</div>
</template>

<script>
import { ref, onMounted, onUnmounted, getCurrentInstance, computed } from 'vue'
import { useRouter } from 'vue-router'
import { gsap, SplitText, registerGsapPlugins } from '../utils/animations/gsap'
import BaseImage from './base/BaseImage.vue'

export default {
  components: {
    BaseImage
  },
  methods: {
    copy() {
      try {
        navigator.clipboard.writeText(this.text)
        const originalText = 'Copy email address'

        gsap.to(this.textBottomMail, {
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            this.textBottomMail.innerHTML = '<span>Copied ✨</span>'
            const copiedSplit = new SplitText(this.textBottomMail.querySelector('span'), { type: 'chars', charsClass: 'chars' })
            this.splitInstances.push(copiedSplit)
            gsap.fromTo(copiedSplit.chars,
              { y: 10, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                stagger: 0.02,
                duration: 0.3,
                ease: 'power2.out'
              }
            )
            gsap.to(this.textBottomMail, {
              opacity: 1,
              duration: 0.2
            })
          }
        })

        clearTimeout(this.copyResetTimeout)
        this.copyResetTimeout = setTimeout(() => {
          gsap.to(this.textBottomMail, {
            opacity: 0,
            duration: 0.2,
            onComplete: () => {
              this.textBottomMail.innerHTML = '<span>' + originalText + '</span>'
              const resetSplit = new SplitText(this.textBottomMail.querySelector('span'), { type: 'chars', charsClass: 'chars' })
              this.splitInstances.push(resetSplit)
              
              // Nieuwe timeline aanmaken
              const newTimeline = gsap.timeline({ paused: true })
              newTimeline
                .to(this.textTopMail.querySelectorAll('.chars'), {
                  y: -20,
                  opacity: 0,
                  stagger: 0.02,
                  duration: 0.3,
                  ease: 'power2.out'
                }, 0)
                .fromTo(resetSplit.chars,
                  { y: 10, opacity: 0 },
                  {
                    y: 0,
                    opacity: 1,
                    stagger: 0.02,
                    duration: 0.3,
                    ease: 'power2.out'
                  }, 0)

              this.timelines.mail = newTimeline

              gsap.to(this.textBottomMail, {
                opacity: 1,
                duration: 0.2
              })

              // Trigger reverse hover animation to bring text back down
              this.timelines.mail.reverse()
            }
          })
        }, 5000)
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
      splitInstances: [],
      copyResetTimeout: null,
    }
  },
  setup() {
    const vm = getCurrentInstance()?.proxy
    const router = useRouter()

    const aboutTitle = computed(() => {
      const route = router.getRoutes().find(r => r.name === 'about')
      return route?.meta?.title || 'About'
    })

    const workTitle = computed(() => {
      const route = router.getRoutes().find(r => r.name === 'work')
      return route?.meta?.title || 'Work'
    })

    const textTopWork = ref(null)
    const textBottomWork = ref(null)
    const textTopAbout = ref(null)
    const textBottomAbout = ref(null)
    const textTopMail = ref(null)
    const textBottomMail = ref(null)

    onMounted(() => {
      registerGsapPlugins()

      document.fonts.ready.then(() => {
        const entries = [
          { key: 'work', top: textTopWork.value, bottom: textBottomWork.value },
          { key: 'about', top: textTopAbout.value, bottom: textBottomAbout.value },
          { key: 'mail', top: textTopMail.value, bottom: textBottomMail.value },
        ].filter(({ top, bottom }) => top && bottom)

        entries.forEach(({ key, top, bottom }) => {
          const topSplit = new SplitText(top, { type: 'chars', charsClass: 'chars' })
          const bottomSplit = new SplitText(bottom, { type: 'chars', charsClass: 'chars' })
          vm?.splitInstances.push(topSplit, bottomSplit)

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
          if (vm) {
            vm.timelines[key] = timeline
            if (key === 'mail') {
              vm.textBottomMail = bottom
            }
          }
        })
      })
    })

    onUnmounted(() => {
      if (!vm) {
        return
      }

      clearTimeout(vm.copyResetTimeout)
      Object.values(vm.timelines).forEach((timeline) => timeline.kill())
      vm.splitInstances.forEach((split) => split.revert())
      vm.splitInstances = []
    })

    return {
      textTopWork,
      textBottomWork,
      textTopAbout,
      textBottomAbout,
      textTopMail,
      textBottomMail,
      aboutTitle,
      workTitle
    }
  }
}
</script>
