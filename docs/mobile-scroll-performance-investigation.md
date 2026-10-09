# Mobile scroll animation investigation

Date: 2026-10-08. Investigation only; no production animation changes.

**Status: preliminary.** Implementation inventory and external research are complete; physical iPhone profiling and isolation remain outstanding. The user's desktop experience is smooth. Desktop-hosted Chrome traces cannot establish or exclude the reported iPhone bottleneck, and their GPU stalls must not be presented as its root cause.

Reported device: iPhone 14 Pro, Safari and Chrome. About and Work are the worst sections. The iOS version, power mode and exact gesture phase remain unknown.

## 1. Executive summary

There is no evidence here of a generally overloaded GSAP JavaScript update loop. The available Chrome traces show short JavaScript callbacks, no scroll-period long tasks and no steady-state refresh storm. All nine isolated animation groups completed the compact-layout screening without frame intervals above 25 ms. A later complete, warmed run also had none.

Three separate mechanisms deserve investigation on the actual phone:

1. **Native scrolling versus JavaScript animation cadence/synchronization.** This best fits the report that ordinary scrolling feels smooth while About's scrubbed text feels uneven on a ProMotion iPhone. WebKit maintainers document comparable cadence and synchronization behavior, but this portfolio has not been profiled on that device.
2. **Work's rendering pipeline, especially first exposure of animated image surfaces.** One visible Chrome mobile-layout frame interval of 133.4 ms overlapped 136.5 ms of GPU-thread raster flushing. Main-thread callbacks stayed short. This is a measured local bottleneck, not proof of the same bottleneck on iOS.
3. **Dynamic stage geometry versus cached ScrollTrigger geometry.** A controlled viewport experiment reproduced a mismatch: CSS stage height changed while trigger boundaries stayed fixed. This can cause positional jumps independently of dropped frames.

Do not apply global GSAP configuration or GPU promotion based on these results. The first experiment should isolate About on the physical iPhone, retaining the same DOM/layout while temporarily freezing only its two reveal tweens and recording animation cadence and viewport changes.

## 2. Current animation inventory

Relevant implementation: [Hero](../src/components/sections/SectionHomeHero.vue), [About](../src/components/sections/SectionHomeAbout.vue), [Work](../src/components/sections/SectionHomeWork.vue), [Life](../src/components/sections/HomeLifeStackExperiment.vue), [SectionNavigation](../src/components/navigation/SectionNavigation.vue), [SiteNav](../src/components/SiteNav.vue), [Footer](../src/components/AppFooter.vue), [ScrollSmoother utility](../src/utils/animations/portfolioScrollSmoother.ts).

| Component/group | ScrollTrigger configuration | Animated properties and rendering considerations |
|---|---|---|
| Hero intro | Loading timeline; **not scrubbed or pinned** | SplitText title characters and role/intro lines; translation, rotation, scale, opacity, divider width; fullscreen loading `clip-path` inset. Startup-only layout/paint work, not a Hero-to-About scroll morph. Responsive line splitting can request a refresh. |
| Hero scroll indicator | Hero `top top` → `bottom top`; velocity `onUpdate`, leave callbacks | Updates CSS animation playback rate through short GSAP tweens; creates/kills a rate tween and delayed settle call on updates. SVG rotation and shadowed portrait coexist with About's first reveal. No scrub/pin/snap. |
| About navigation anchor | Text `top 20%`; `onRefresh` writes navigation position | Measurement only. Font readiness, Vue tick and a frame precede splitting; setup finishes with refresh. |
| About label + body | Each `top 72%` → `bottom 60%`; `scrub: true`, `invalidateOnRefresh` | Compact/coarse touch: **words**, opacity 0→1 and `yPercent` 24→0. Runtime: 63 words total, 62 body targets, zero character nodes and zero blur filters. Desktop: characters, scale 2→1 and blur 15→0 px. The desktop blur hypothesis does not apply to this phone path. |
| Work heading entry | Root `top bottom` → `+= innerHeight × 1.6`; `scrub: true`; toggle class, refresh callback | Five SplitText characters; viewport-sized `y` translation, stagger 0.06. Full-stage overflow mask, not animated clip-path. Title geometry uses `innerHeight`; mobile characters deliberately lack permanent promotion hints. |
| Work exhibition | Root `top top` → duration × cached viewport height × CSS scroll ratio; `scrub: true`; update/refresh callbacks, active class | Desktop pins root with spacing and `anticipatePin: 1`. Compact uses **CSS sticky**, no GSAP pin, `anticipatePin: 0`, rotationY 0 and no perspective. Five cards translate (`x`, `xPercent`), center with `yPercent`, scale and change `zIndex`. Ten full-card gradient shadow surfaces animate opacity. Rounded overflow clips contain images and text. |
| Work snap | Nearest project labels within 240 px equivalent range; delay 0.04 s; duration 0.1–0.22 s; `power1.inOut` | Changes scroll position after settling. Interaction/active index reads cached widths and GSAP transforms, not card DOM rectangles on every update. Vue changes active/interactive classes when values change. Could produce a correction perceived as jitter; native momentum was not reproduced. |
| Work exit → Life | Exhibition timeline's final segment | Cards move off left; title characters move up by cached viewport height; shadow opacity changes. On compact the sticky stage releases natively. Desktop Life overlaps by one dynamic viewport; compact does not use that negative margin. |
| Life heading/copy | Desktop `top top`, compact `top 75%`; `play none none reverse`; invalidate on refresh | SplitText **lines**, `autoSplit: true`; masked `yPercent` 110→0, stagger; opacity remains 1. Time-based reveal, no scrub/pin/snap. Automatic re-split is width/font-sensitive, not a per-scroll operation. Four runtime lines. |
| Life photo stack | Compact track `top top` → `bottom bottom`; desktop viewport-based distance; `scrub: 0.8`; refresh callback | Eleven overlapping figures translate and rotate, including captions. Desktop pins layout; compact has a sticky photo stage and, below md, sticky copy. Shadows, overflow clipping and permanent `will-change: transform, opacity` on every figure. Opacity is initialized, not scrubbed in the photo sequence. |
| SiteNav copy | Starts at `innerHeight × 0.7`; `play none none reverse`; invalidate on refresh | Name and role characters, masked translation and autoAlpha. Boundary-triggered burst, not per-frame re-splitting. Fixed header shares the scene with SectionNavigation. |
| SectionNavigation | Per-section starts at `top 40%`, end `max`; refresh priorities −1; global update/refresh trigger at −2 | Cached section positions on normal scroll. Section changes measure label widths, create two SplitText instances, animate panel/label width and panel height, move characters, then revert splits. Fixed 10 px backdrop-blurred pill. Real layout/paint work occurs at label changes, not at every scroll update. |
| App/global surface | Passive scroll listener; resize listener and body ResizeObserver | Scroll flags use cached document bounds. Fixed patterned background and top/bottom gradient scrims; opacity/translation CSS transitions at thresholds. Root also has a fixed background. These overlap section content. |
| Footer | Divider `top 70%` reveal; global direction update | Divider width 0→100% causes layout; continuous 15 s `xPercent` marquee runs independently, even outside its visible section. Direction changes create a timeScale tween. |

Homepage project thumbnails and Life figures use lazy, asynchronously decoded BaseImage assets. They omit `sizes`; BaseImage therefore uses full-size optimized WebP rather than selecting responsive variants. Current thumbnails are mostly 900×750; one is 1312×1000. Most Life images are already small; one observed source is 1886×1658. “All images are oversized” is not supported, especially at DPR 3. There is no homepage video. Project-overlay media and its performant inset clip transition are outside this scroll-only investigation.

### Interactions

At 393×852, About's body reveal spans approximately scrollY 668–1756. Hero's velocity trigger runs to 1061, and header copy starts at 596. These overlap during Hero → About.

Work heading entry spans 1540–2903, overlapping About until 1756. The exhibition starts at 2392; its card entrance starts during the heading's final portion. Work's navigation label threshold is around 2051. Thus heading transforms, card entrance and occasional pill resizing should be profiled together.

Work exhibition finishes around 8778; compact Life copy triggers near 8991, and its stack starts near 10482. At this viewport there is no sustained overlap of the two scrubbed card sequences. Life's sticky copy remains behind the photo stage. Fixed scrims, navigation blur, CSS loops and the offscreen footer marquee are shared costs throughout.

## 3. Profiling findings

### Method and limits

Built a temporary minified Vite client bundle in `/private/tmp/portfolio-perf-dist`, using the real configuration plus a diagnostic GSAP reference. Production source and the SSG `dist` were not modified. Tests exercise the mounted homepage runtime, not SSG startup/hydration performance.

Used Chrome 155 via CDP: desktop 1440×900/DPR 1 and compact 393×852/DPR 3/coarse touch. Compact traces used 4× CPU throttling; desktop used 1×. Native synthetic scroll gestures traversed the homepage at 2500 px/s with fling prevention, followed by a settling interval. Collected DevTools timeline/raster/GPU/GC events, rAF intervals, long-task observations and refresh events. CPU throttling does not emulate an iPhone GPU, thermal behavior or native momentum.

Both headless screening and a visible Chrome comparison were attempted. Visible runs with background-tab throttling, a remaining intro scroll lock, no actual traversal or an abrupt restoration jump were excluded. rAF intervals are a diagnostic signal; they are **not a measurement of physically presented display frames**. Trace event totals below are category totals, not additive exclusive CPU time.

Safari 27 is installed, but WebDriver rejected a session because “Allow remote automation” is disabled. No settings were changed. No iPhone or iOS simulator was available through these tools (`simctl` is unavailable). Physical Safari/Chrome touch momentum, browser chrome and 120 Hz presentation remain untested. LayerTree did not provide a usable layer inventory; no exact layer count or GPU memory claim is made.

### Measurements

| Valid run | rAF samples | p95 interval | Intervals >25 / >50 ms | Long tasks | Refreshes during sample |
|---|---:|---:|---:|---:|---:|
| Initial compact headless, lazy image arrival | 450 | 16.8 ms | 11 / 9 | 0 | 0 |
| Visible desktop Chrome, loaded images | 473 | 17.6 ms | 10 / 9 | 0 | 0 |
| Visible compact Chrome, loaded images | 498 | 17.6 ms | 3 / 3 | 0 | 0 |
| Later complete compact headless, loaded images | 508 | 16.8 ms | 0 / 0 | 0 | 0 |

The visible compact run had a 133.4 ms interval at scrollY ≈3207.5, during card entry. A 136.5 ms `RasterDecoderImpl::DoEndRasterCHROMIUM::Flush` on **CrGpuMain** overlapped it; a renderer FunctionCall in that interval was only 1.23 ms. Two other gaps near the Hero did not have a similarly identified expensive operation. The GPU event includes driver/flush/wait time: it does not prove which individual card, blur or texture caused the wait.

That run recorded approximately 365.5 ms FunctionCall, 175.5 ms UpdateLayoutTree, 25.0 ms Layout, 62.2 ms Paint and 56.7 ms RasterTask across the entire traversal. Its GPU raster-flush total was 173.9 ms. The original lazy-arrival run additionally recorded 22 ImageDecodeTask events totaling 116.4 ms, maximum 21.2 ms. GC occurred, but no evidence ties it to the leading Work stall.

A warmed complete rerun had no >25 ms intervals and no image decode events. This prevents attributing the improvement of an isolated or property-disabled run solely to the disabled animation: image readiness, first rasterization and GPU cache warm-up are confounders. No persistent Chrome failure comparable to the reported phone behavior was established.

### Viewport geometry experiment

Held the captured position at scrollY 6250 and changed only the diagnostic CSS dynamic-height variable from 852 to 780 px, leaving `svh`, viewport width and JavaScript viewport dimensions unchanged:

| Geometry | Before | CSS-height-only change |
|---|---:|---:|
| Work stage height | 852 px | 780 px |
| Work root height | 7238 px | 7166 px |
| Active card top | 119.65 px | 83.65 px |
| Active card height | 612.70 px | 612.70 px |
| Life document top | 9630.16 px | 9558.16 px |
| Exhibition trigger end | 8778 | 8778 |
| Life stack trigger start | 10482 | 10482 |

The card moved 36 px and Life moved 72 px without a refresh. This is a controlled geometry sensitivity test, not a reproduction of Safari's exact toolbar sequence.

A subsequent actual emulated resize to 780 px also left cached trigger boundaries intact. After explicit refresh, exhibition end changed to ≈8238 and Life stack start to ≈9798. Snap then moved scrollY from 6250 to 6401 while settling. This illustrates how resize reconciliation and snap can combine into visible corrections. Emulated resize also changes `svh`, unlike a real toolbar-only change, so its numeric shifts must not be treated as physical-iPhone predictions.

Installed GSAP 3.15.0 already initializes `ignoreMobileResize` for touch-only devices (`Observer.isTouch === 1`). Its resize handler ignores small height-only changes below its threshold. The application does not explicitly override this setting. Adding `ignoreMobileResize: true` blindly could therefore be redundant while CSS `dvh` continues changing.

## 4. Isolation-test results

Animations were disabled/frozen only in the diagnostic browser. Existing DOM and section scroll-distance styling were retained. Nonselected trigger animations were paused; compact sticky stages remained native. Cards were parked visibly when their animation was disabled. This is a screening test with comparable document ranges, not an identical pixel/compositing workload. CSS loops, App scroll flags and the independent marquee remained shared background costs.

| Compact headless isolation | Samples | p95 | >25 ms intervals | Interpretation |
|---|---:|---:|---:|---|
| All ScrollTriggers disabled | 509 | 16.8 ms | 0 | Native sticky/ordinary scroll remains smooth in this environment. |
| Hero only | 508 | 16.8 ms | 0 | Velocity/rate callbacks did not reproduce a bottleneck. Startup is excluded. |
| About only | 509 | 16.7 ms | 0 | No Chrome overload from the 63-word reveal. |
| Work heading only | 508 | 16.7 ms | 0 | More style/update work than the stationary baseline, but no frame-gap failure. |
| Work sticky without decoration | 508 | 16.7 ms | 0 | No compact GSAP pin exists to disable; native sticky alone is stable here. |
| Project cards only, heading animation removed | 508 | 16.8 ms | 0 | Raster work increases; warmed cards are not persistently choppy in Chrome. |
| Life heading only | 508 | 16.7 ms | 0 | Small line reveal, no observed bottleneck. |
| Life photo stack only | 508 | 16.7 ms | 0 | No observed warmed frame problem; mobile GPU/memory cost remains unmeasured. |
| Global trigger/navigation UI only | 508 | 16.7 ms | 0 | Layout bursts occur, but no observed frame-gap failure. |
| About + Work heading | 506 | 16.8 ms | 1 (>25, <50 ms) | One sample is insufficient to establish an interaction regression. |

Additional valid property probes:

| Probe | Result | Evidence-based conclusion |
|---|---|---|
| About transform suppressed; opacity retained, all other animations active | Visible compact: 508 samples, p95 17.6 ms, zero >25 ms | No proven improvement over a warmed complete run. Good small physical-device experiment. |
| About opacity fixed at 1; transform retained | Visible compact: 509 samples, p95 17.5 ms, zero >25 ms | Does not establish opacity as the problem. |
| Backdrop blur removed | Visible compact: 511 samples, p95 17.6 ms, zero >25 ms | Initial GPU-flush total dropped to 41.3 ms, but later unchanged baseline was also smooth. Blur is not confirmed causal. |
| Work scale components removed | Headless: 508 samples, p95 16.7 ms, zero >25 ms | RasterTask total 32.8 vs warmed baseline 40.3 ms; scripting/style totals increased. Not a demonstrated overall improvement. |
| Work gradient shadows hidden + Life box shadows removed | Headless: 508 samples, p95 16.8 ms, zero >25 ms | Paint total 51.9 vs baseline 68.0 ms; raster approximately unchanged (41.2 vs 40.3). A measurable paint reduction, no frame improvement. |
| CSS clip-path removed | Headless: 508 samples, p95 16.7 ms, zero >25 ms | Paint total 48.6 ms, raster 40.5 ms. The homepage's remaining clips are mostly static; no evidence against the overlay inset transition. |

SplitText animation was isolated by freezing associated tweens, not by destroying the split DOM. Therefore DOM-construction/re-splitting cost was not independently benchmarked. Normal scroll does not repeatedly split About or Work. Animated properties overridden with diagnostic CSS still incur GSAP writes; these probes isolate visible rendering more than pure scripting cost.

No perceptible improvement was verified on a physical device. Removing sticky positioning would radically change which content stays visible and is not a fair raster-cost comparison. Native momentum/snap interference still needs its own touch test; changing `vars.snap` after trigger creation was not accepted as a valid way to disable its internal snap behavior.

## 5. External research and comparable cases

| Source/case | Symptoms and established behavior | Solution/status and applicability |
|---|---|---|
| [GSAP normalizeScroll documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.normalizeScroll()/) | Native scroll and JavaScript can update separately; mobile toolbar changes affect trigger geometry. GSAP documents iOS position-reporting issues. | Normalization synchronizes scrolling on JS and changes native momentum/bounce behavior. Documented mechanism; not evidence that this portfolio needs normalization. Reserve for a minimal phone reproduction. |
| [GSAP maintainer: custom scroller pinning](https://gsap.com/community/forums/topic/25034-scrolltrigger-pinning-in-different-scroller-than-body/) | Mobile transform-based pins lag native scrolling. GreenSock identifies asynchronous scrolling and ancestor transform contexts. | Fixed pinning addressed that custom-scroller case. Our compact Work/Life already use native sticky and no transformed smoother: copying its pinType/scrollerProxy fix is inappropriate. |
| [WebKit 288402: jittery scroll animations](https://bugs.webkit.org/show_bug.cgi?id=288402) | iOS 18.4 beta examples updated differently from native scrolling. Maintainer separates page cadence/ProMotion from off-main-thread eligibility. | Resolved configuration changed; higher rendering cadence improved the reported demos. CSS timeline examples, not a GSAP bug. Relevant cadence hypothesis for the iPhone 14 Pro; current device settings must be measured. |
| [WebKit 272165: iPhone Pro 120 Hz rAF](https://bugs.webkit.org/show_bug.cgi?id=272165) | Historical iPhone Pro high-refresh support failure. | Resolved fixed, with reports of fixes in iOS 18 betas. Do not claim modern Safari cannot run at 120 Hz or prescribe browser flags as a product fix. |
| [GSAP config documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.config()/) | Ignoring small mobile resize events can prevent refresh jumps, at the cost of stale boundaries. | Relevant to the geometry experiment. Installed source already enables this on touch-only devices; CSS/JS geometry consistency matters more than an additional global setting. |
| [MDN viewport lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length) | Dynamic viewport units can resize content during scroll and incur a performance cost. | Stable small viewport units are a possible section-scoped alternative; visual trade-off is unused space with retracted browser chrome. Supports a targeted test, not replacing every `dvh`. |
| [Chrome re-rastering on scale changes](https://developer.chrome.com/blog/re-rastering-composite) | Scripted scale changes can require re-rasterization; layer hints alter the trade-off between fidelity and speed. | Explains why transform-only does not guarantee cheap card animation. Chrome-specific and historical documentation; no Safari guarantee. Compare scale removal before promotion. |
| [Chrome compositing architecture](https://developer.chrome.com/blog/inside-browser-part3), [MDN will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change) | Excess layers can increase compositing and memory costs. | Measure before promotion. Eleven permanently hinted Life figures and overlapping card surfaces deserve device profiling, not another blanket hint. |
| [GSAP SplitText documentation](https://gsap.com/docs/v3/Plugins/SplitText/) | Splitting increases DOM; autoSplit responds to fonts and element width when lines are split. | Split only required units. Already followed by About words and Life lines. A repeated height-only re-split storm is not demonstrated here. Reverting scrubbed text immediately would break reverse behavior. |
| [WebKit 247130: sticky under overflow-x clip](https://bugs.webkit.org/show_bug.cgi?id=247130) | Safari 16 sticky elements jittered 1–2 px; a huge ancestor clipping layer was identified. | Fixed in 2022. The ancestor shape resembles `.page-surface`, but this is not proof of a present bug. Check actual iOS version before considering an overflow experiment. |
| [WebKit 304741: repeated transform updates during a CSS transition](https://bugs.webkit.org/show_bug.cgi?id=304741) | Safari 26/macOS transform transitions flicker when retargeted; WebKit reproduced the transition behavior. | Still NEW when reviewed. No corresponding CSS transform transition was found on the scrubbed About words/Work card surfaces. Do not apply its workaround indiscriminately. |
| [WebKit 316769: severe blur regression](https://bugs.webkit.org/show_bug.cgi?id=316769) | Safari 26 reports initially blamed all blur; detailed reproduction implicated very large 200 px blur and the page color sampler. | Duplicate of a fixed issue; the report says smaller blur values were fast. Our navigation uses 10 px and About touch uses none. This does not establish our blur as the bottleneck. |
| [GSAP ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | Numeric scrub smooths playhead catch-up; anticipatePin addresses initial pin flashes; snap acts after scrolling settles. | Scrub changes motion response, not rendering throughput. AnticipatePin/pinType do not address a native sticky stage. The existing snap timing warrants a phone test, not speculative replacement. |

Forum/code snippets and anecdotal translateZ/force3D fixes were not treated as validated solutions. No matching reproducible current GSAP issue established that this application's remaining symptoms are a GSAP regression.

## 6. Mobile Safari-specific findings

The report occurring in both phone browsers is compatible with a shared WebKit issue: Chrome's iOS implementation wraps WKWebView, whereas desktop Chrome runs a different engine. [Current Chromium iOS architecture](https://chromium.googlesource.com/chromium/src/+/main/ios/web/).

Native/compositor scrolling can remain responsive while JS-driven transforms are updated at a different cadence or phase. Touch momentum, browser UI animation and rendering limits can make that difference much more apparent on the phone than a 60 Hz desktop test. WebKit's comparable discussion explicitly separates cadence and acceleration. This remains a hypothesis until the actual device's rAF cadence, render timeline and viewport are recorded. [WebKit discussion](https://bugs.webkit.org/show_bug.cgi?id=288402).

Record slow drag, release/deceleration and browser-toolbar expansion separately. Also record low-power mode, thermal state, orientation, tab visibility, zoom, iOS version, `innerHeight`, document client height, visual viewport height/offset, actual stage rectangles, scrollY and refresh times. A smooth 16.7 ms JS cadence on a high-refresh device is different from irregular long frames; an animation-position jump with normal cadence is different again.

Classification: **D (browser scheduling) + A/C (geometry/configuration interaction)** are plausible explanations for About and Work; **B (rendering cost)** is locally demonstrated at Work's first exposure. An A/B/C/D combination is more defensible than naming a single confirmed iOS cause.

## 7. Ranked root-cause candidates

“Confidence” refers to relevance to the reported phone regression, not merely whether the browser mechanism exists.

| Rank / finding | Impact | Confidence | Evidence | Smallest intervention | Trade-off | Implementation risk |
|---|---|---|---|---|---|---|
| 1. Native scroll versus JS cadence/phase | High | Medium | User's iPhone Pro symptom; primary WebKit comparisons; About remains smooth in Chrome screening without long tasks. No phone trace yet. | Physical A/B with About frozen; if confirmed, compact opacity-only or a short non-scrubbed text reveal. | Less float/stagger choreography. | Low if compact About only; keep accessibility, reverse/reduced-motion expectations explicit. |
| 2. Work surface raster/upload/flush | High | Low | Chrome-only 133.4 ms interval overlaps GPU raster flush; later warm run smooth. Exact surface not isolated; no iPhone rendering evidence. | Compare first/repeat Work pass on the phone; temporarily remove only card scale or decorative shadows. | Slightly flatter cover-flow depth. | Low–Medium; verify hit geometry, active-card detection and overlay open/close targets. |
| 3. Dynamic stage/cached trigger mismatch | High | Medium | Controlled 36 px card and 72 px section shift without trigger refresh; resize/refresh changes ranges and snap settlement. | Scoped stable-height Work experiment, with consistent timeline distance basis if needed. | Stage may leave extra space when chrome retracts. | Medium: ranges, SectionNavigation anchors, snap and overlay restoration require validation. Do not change global viewport policy. |
| 4. Navigation boundary layout/compositing burst | Medium | Low–Medium | Label changes create splits/read widths and animate dimensions on a fixed blurred surface. Individual run smooth. | Isolate label resizing at About/Work boundaries; compare fixed pill width only if implicated. | Less tailored width animation. | Low–Medium; label fit, localization, focus and expanded menu need checks. |
| 5. Lazy decode / first image exposure | Medium | Low–Medium | 22 decode tasks in initial run; none when loaded. Most images already modest. | Profile first pass and actual selected image resolution; prepare just the next required image if decode is causal. | Earlier network/memory use; lower image resolution can lose DPR-3 sharpness. | Low with existing BaseImage pipeline; do not make all images eager. |
| 6. Snap/native momentum correction | Medium | Low | Short snap delay; viewport experiment's post-refresh scroll correction. No real momentum test. | Diagnostic build with snap genuinely disabled at creation. | Less reliable centered landing. | Medium: interactive radius and selected overlay card rely on centered positions. |
| 7. Life layer retention/background loops | Medium | Low | Eleven hinted overlapping figures, shadows, sticky copy and independent marquee. No frame failure in isolated Life. | Check layers/memory and offscreen work on phone; simplify only if measured. | Shallower stack or static editorial photos. | Medium for stack distances/navigation; low for independently pausing an offscreen loop. |

## 8. Recommended fixes in priority order

These are conditional proposals, not approved implementation changes.

1. Establish the physical About A/B and cadence/viewport trace. If freezing restores perceived smoothness without fixing expensive frames, prefer compact opacity-only or a concise time-based reveal. Preserve the desktop character/blur path.
2. Test Work's first versus repeat pass on the phone. If raster cost is confirmed, remove compact scale/decorative shadow motion before changing layer promotion. Optimize the particular image only when resolution/decode evidence warrants it.
3. If jumps align with browser chrome, make only the relevant compact stage and its scroll-distance basis stable/consistent. Do not add repeated refreshes during touch momentum. A CSS-only trial is diagnostic; a durable change must reconcile JS ranges too.
4. If boundary traces implicate navigation, simplify compact pill resizing or replace its blur with a visually suitable solid/translucent surface. Retain the existing navigation architecture.
5. Alter snap only after native gesture tests demonstrate correction conflicts. Treat Life simplification as lower priority than About/Work.

## 9. Animations potentially worth simplifying on mobile

| Animation | Optimize existing | Simplify compact | Remove compact | Preferred decision |
|---|---|---|---|---|
| About words | Already no blur/character scale; preserve small targets | Opacity-only words or short block/line reveal | Fully visible static copy in native flow | Try simplification if the phone A/B supports it. Static copy is a polished fallback. |
| Work heading | Keep only existing five transforms; verify stable geometry | One heading/block reveal, shorter travel | Static heading | Do not sacrifice it solely on the Chrome screening: no proven bottleneck. |
| Work cards | Keep native sticky, zero perspective, cached geometry | Flat translation, fixed scale, fewer shadow surfaces | Static/swipe/grid presentation | Simplify decoration first. Removing the gallery changes product interaction and needs separate review. |
| Life stack | Improve selected oversized asset; measure layer residency | Fewer simultaneous visible figures, lighter shadows | Existing editorial/reduced-motion-style photo layout | Lower priority; no current evidence it causes the user's worst sections. |
| Global pill/indicator | Keep cached section comparisons; pause unnecessary offscreen work if measured | Fixed-width pill, simpler label transition or static indicator rate | Remove purely decorative velocity response | Target demonstrated boundary/loop cost; retain useful navigation. |

## 10. Changes not recommended

- Blanket `will-change`, `force3D` or translateZ: no proven insufficient promotion; can increase memory, alter containing blocks and revive earlier mobile card costs.
- Global `normalizeScroll()`/touch ScrollSmoother: changes native interaction and nested-scroll/overlay assumptions without a phone reproduction.
- Arbitrary scrub values: can conceal unevenness with lag while leaving rendering cost and viewport mismatch intact; Life already uses numeric scrub.
- Global `ignoreMobileResize`, disabling all resize refreshes or frequent forced refreshes: current touch-only defaults already suppress small resizes; wholesale changes trade jumps for stale navigation/geometry.
- `anticipatePin`/forced pinType on compact: Work and Life already use native sticky. Desktop is currently working.
- Another rAF wrapper around ScrollTrigger: installed GSAP source already contains Safari-specific immediate-update handling; another scheduling layer is unsupported by the measurements.
- Removing all clip-path/blur effects: touch About has no blur, homepage clips are largely static, and the performant overlay transition was not implicated.
- Rewriting SplitText, Work layout, navigation, scroll restoration or overlay lifecycle: no evidence supports that scope. Do not revert the prior overlay/sticky geometry fix.
- Migrating to CSS scroll timelines solely on historical Safari claims: browser eligibility/version behavior needs its own evaluation; this is not a minimal repair.

## 11. Proposed implementation plan

1. Review this report. Keep production animation code unchanged.
2. On the iPhone 14 Pro, record the precise iOS/browser versions and baseline About/Work behavior with slow drag, fast drag and deceleration. Capture both cold and repeated image passes, with toolbar stable and changing.
3. Temporarily freeze About's label/body reveal at their final state while retaining split DOM, layout, navigation and all other animation groups. Capture the same gestures and cadence. Then try opacity-only if the difference is clear.
4. Separately test Work at fixed versus changing viewport geometry and with/without scale/shadow decoration. Repeat each A/B several times in alternating order to avoid cache and thermal confounders.
5. Implement only the smallest intervention supported by those results, using existing compact media queries and animation helpers. Preserve reduced motion and desktop choreography.
6. Validate About → Work, Work → Life, short/tall portrait, landscape, toolbar expansion, reverse scroll and snap. Verify MuziMatch open/close and overlay MuziMatch → SFVonline → close; homepage scroll position and SectionNavigation must remain correct.
7. Run typecheck, production build, SEO verification and diff check for the eventual code change. Compare phone traces before/after; a smooth Chrome result alone is not acceptance.

**Smallest first experiment:** the runtime-only About freeze A/B on the actual iPhone, accompanied by rAF interval and viewport/refresh recording. It removes one suspected JS-linked motion group without changing layout or production architecture and can distinguish cadence-sensitive motion from a demonstrable rendering stall. It is recommended for review; it has not been implemented in production.

### Evidence artifacts

The companion [measurement summary](mobile-scroll-performance-measurements.json) preserves accepted screening/property results and viewport geometry. Raw Chrome traces and temporary runners remain in `/private/tmp/portfolio-perf-results`, `/private/tmp/portfolio-perf-headed-results`, `/private/tmp/portfolio-perf-property-results` and `/private/tmp/portfolio-perf*.mjs`; those temporary paths are not durable repository assets. Trace files can be imported into Chrome's Performance panel. Background/locked/nontraversing visible runs are deliberately excluded from the companion summary.
