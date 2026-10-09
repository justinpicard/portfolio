# Mobile scroll follow-up: text reveals and toolbar geometry

Status: changes implemented and functionally checked; physical-iPhone verification of these changes is pending. The user's real iPhone/Chrome isolation results are the starting evidence, not the desktop timing measurements from the earlier audit.

## 1. About: confirmed finding versus cause

The user confirmed that enabling the About scroll animation introduces choppiness and disabling it restores smooth scrolling. This implicates that animation path, but does not establish a SplitText bug or distinguish scripting, paint/compositing cost and native-scroll/JavaScript update cadence.

Previously, compact About animated 63 words with opacity 0→1 and yPercent 24→0. Desktop animated characters with opacity, scale 2→1 and blur 15→0. Two scrub:true reveals use different elements; their scroll ranges can overlap. The navigation measurement trigger only writes its dataset on refresh. There is no About pin, snap, per-scroll SplitText creation or per-scroll geometry measurement. The font wait, one-frame setup wait and locale cleanup remain.

The strongest implementation hypothesis is the combination of scroll-driven visual updates and text transforms, rather than SplitText creation itself. Mobile already omitted blur/scale. More character DOM is not automatically cheaper: the new version has 333 character targets (5 eyebrow, 328 body), rather than 63 word targets on compact.

## 2. New About interaction

The same implementation now runs on desktop and compact: existing word/character splitting, body characters explicitly initialized at opacity 0.5 and the small eyebrow at 0.75, then sequential opacity-only tweens to 1 with ease:none and scrub:true. Duration and stagger both equal 1 in virtual tween time, making each character fade continuously before the next; ScrollTrigger maps the sequence onto the existing section range. No blur, scale or translation is written. The copy is never hidden while fonts or splits initialize.

This follows the opacity/stagger pattern in the supplied [GSAP reference](https://codepen.io/GreenSock/pen/jOdzPjV), applied to characters as requested. Explicit initialization of every character is needed so characters awaiting their stagger remain dimmed, rather than at their default full opacity.

Reduced motion leaves ordinary unsplit text at full opacity, with no reveal tween. The existing refresh-only navigation-position trigger remains. Diagnostic `about:false` still creates no About triggers or splits. Text, typography, markup and responsive spacing were retained.

The initial body opacity was raised slightly from the requested starting point around 0.4 after checking readability. With the existing white/primary colors, 0.4 yields approximately 2.42:1 contrast and 0.5 yields 3.14:1; the small secondary-colored label needs approximately 0.75 for 4.54:1. These are baseline color calculations, not a claim of full accessibility certification. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) distinguishes large text from small text.

## 3. Work heading

Work has only five SplitText characters. It animates y to zero, stagger 0.06, ease:power2.inOut, scrub:true; it does not animate opacity or filter. The title mask clips the viewport-sized travel. The separate exhibition timeline later animates those same characters out; there is no new competing entry tween. About can overlap the beginning of the heading reveal, but the user's independent heading test means overlap is not a complete explanation.

A shared native-scroll/JavaScript cadence or text rendering issue is plausible; a shared large SplitText count is not. No real-device trace establishes the rendering bottleneck. Timings, easing, scrub, split structure and exit choreography were retained. The smallest implemented correction is consistent compact geometry: heading travel and its end distance now measure the same CSS-sized title mask as the Work stage. Desktop retains innerHeight.

Life photos use numeric scrub 0.8 whereas About/Work use direct scrub:true. That difference makes update cadence another plausible explanation, not proof of the cause. [GSAP's scrub documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) describes numeric scrub as catch-up smoothing. Only if a phone trace shows uneven update cadence without significant rendering/main-thread work would a local numeric-scrub A/B be warranted; it adds tracking lag and does not improve rendering throughput. No scrub values were changed.

Next: test `workTitle:true` alone at a stable viewport after the sizing correction. If still choppy, capture a physical-device rendering timeline before changing its scrub or visuals. Simplifying the heading would lose its staged entry; there is not enough evidence to justify that trade-off yet.

## 4. Viewport jitter: evidence

The user observed Work/Life movement while the browser toolbar toggles, including with animations disabled. Source inspection found several independent geometry mechanisms:

- Global `--viewport-height-dynamic` resolves to 100dvh. Compact Work used it for its stage and root height; the root also adds a cached JavaScript exhibition scroll distance.
- Compact Life used it for the sticky copy, sticky photo stage and the base of the scroll track. Its track increments and photo sizes already use svh.
- Cards/photo centers are tied to 50% of their stages: changing stage height moves the figures even with no animated transforms.
- Work cached innerHeight for its timeline/range and remeasured on ScrollTrigger refresh. The temporary sticky/static diagnostic also recomputed its distance on window resize. Life already reads its actual CSS stage height. Neither section installs a visualViewport resize handler.
- Installed GSAP 3.15.0 ignores small height-only mobile resizes by default on touch-only devices; CSS can resize without the cached trigger geometry refreshing. An explicit/global refresh can then reconcile the different ranges. No global configuration was changed.

The [MDN viewport-unit documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length) establishes that dvh follows dynamic browser UI while svh remains stable through toolbar expansion/collapse. The [GSAP resize documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.config()/) describes the trade-off between ignoring small mobile resizes and keeping trigger positions current.

Targeted browser geometry isolation held innerHeight and svh fixed at 852 px and changed only the global dynamic CSS height to 780 px. It did not simulate an actual iPhone toolbar or measure device FPS. Measurements waited for the Hero body scroll lock to finish; scrollY stayed 2392.

| Geometry | Before correction, 852→780 dynamic height | After correction, identical test |
| --- | --- | --- |
| Static Work list height | 4159.19→4087.19 px | 4159.19→4159.19 px |
| Static first card relative to stage | 892→820 px | 892→892 px |
| Sticky Work stage | 852→780 px | 852→852 px |
| Sticky first card relative to stage | 119.28→83.28 px | 119.28→119.28 px |
| Life photo stage / sticky intro | 852→780 px | 852→852 px |
| Life photo track | 7242→7170 px | 7242→7242 px |

Both static Work tests had zero ScrollTriggers. Life's stage was measured separately with its normal photo composition enabled. Thus CSS resizing is an established mechanism independent of animation updates. Its exact share of physical-phone jitter remains unmeasured.

Hero has a normal-flow, content-constrained composition with a dynamic min-height; About has content-driven height and no sticky stage. In this isolated height change, their upstream composition did not move the Work start. In other viewport sizes upstream sections can still contribute, so the local fix is not a claim that every browser-induced movement is eliminated. With Life photos disabled its diagnostic flow is static; upstream Work movement can explain movement of Life without its own timeline running.

## 5. Sizing correction

Added section-local `--work-stage-height` and `--home-life-stage-height`. Compact uses 100svh with a 100vh fallback; desktop continues using the existing dynamic viewport property. Work stage/root/title-mask geometry and Life stage/intro/track/min-height consistently consume their section height. Temporary static Work styling uses the same property.

Work reads the existing title-mask clientHeight only at setup/refresh to align its title travel, exhibition scroll distance and diagnostic sticky distance with CSS. This adds no viewport tracker or per-scroll measurement. Reduced-motion card activation and overlay close centering retain their actual visible-viewport measurements.

The trade-off is intentional: after the toolbar retracts, the stage continues to occupy the small viewport height, exposing more surrounding content instead of expanding to fill the new visible height. Rotation and genuine viewport resizing still update svh. Card sizes/visuals, coverflow, snap, Life timelines, overlays and scroll-restoration code were not changed. No global GSAP settings, normalizeScroll, force3D, will-change or new animation libraries were added.

## 6. Verification

- About, compact normal and diagnostic mode: at 0%, 25%, 50%, 75%, 100% progress, 0/82/164/246/328 body characters reached full opacity. At approximately 33.3%, 109 were full, 218 remained dim and one had intermediate opacity. Minimum body opacity stayed at least 0.5; computed character transform/filter were none and copy stayed visible.
- Desktop showed the same progression; normal/diagnostic reduced-motion About had zero split characters, full opacity and no reveal tween.
- Normal compact/desktop MuziMatch opening, SFVonline switching and closing completed with focus returning to SFVonline and scroll locking released. Closing MuziMatch without switching restored exactly 3781 px on compact and 4476 px on desktop, matching the opening positions. Static diagnostic Work modes also opened/switched/closed; baseline navigation reached About and retained its selected label. No runtime exceptions were observed in these checks.
- Geometry isolation results above passed without modifying global ScrollTrigger settings.
- `npm run typecheck`, `npm run build` including images/SSG, `npm run verify:seo`, and `git diff --check` passed.

## 7. Physical-device follow-up and unresolved issues

Keep the existing diagnostic mode. Current user-selected flags are preserved; set `about:true` to test the replacement. Alternate About on/off, then isolate Work title with a stable toolbar, then test toolbar toggles in all-off, sticky-only, normal coverflow and Life-photo modes. Finally check the complete normal page, portrait/landscape and Chrome/Safari, including MuziMatch → SFVonline → close and section navigation.

No claim of improved physical-mobile performance is made. The remaining Work heading and mild coverflow choppiness need real-device verification/profiling. The previously identified reduced-motion Hero startup block remains outside this change: About's reduced-motion component state was verified independently because the existing page intro can retain body scroll locking. That startup issue was not silently fixed as part of this animation task.

## Files changed in this follow-up

- `src/components/sections/SectionHomeAbout.vue` — shared opacity-only character reveal.
- `src/components/sections/SectionHomeWork.vue` — mask ref and CSS-aligned compact height reads.
- `src/assets/styles/sections/_projects.scss` — local stable compact Work height.
- `src/assets/styles/sections/_life-stack-experiment.scss` — local stable compact Life height.
- `src/assets/styles/sections/_mobile-scroll-diagnostics.scss` — static Work uses the same height.
- `docs/mobile-scroll-follow-up.md` — findings, evidence, trade-offs and verification.

Other already-pending diagnostic/overlay changes were preserved. User-selected diagnostic flags were not reset.
