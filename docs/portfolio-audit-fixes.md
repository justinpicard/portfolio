# Portfolio audit fixes

## Scope and baseline

- Branch: `fix/portfolio-audit`; started from clean `develop` at `becf150fb3bb914b7e16d119d556c31cc66892a7`.
- Loaded global `/Users/justinpicard/.agents/skills/web-design-guidelines/SKILL.md`; fetched https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md on 2026-10-11.
- Baseline typecheck, build and static SEO verification passed. Image verification passed (53 optimized originals).
- Chrome desktop baseline observed through native UI: intro completes; section navigation updates `#work`; Work title stays pinned while vertical scrolling moves the horizontal card exhibition; coming-soon cards remain informational. Blue background, typography, card proportions and layout captured visually in session.
- Source baseline: snap guards suspend snapping while cases open; close coordinator reconciles the selected project's timeline label, restores scroll and focus; compact layout uses native sticky; reduced motion uses a static vertical exhibition. These mechanisms must remain intact.
- No lint or general test command exists in the starting package. No dependencies will be installed.
- Available browser control: native Chrome UI, no browser DOM automation provider. Physical devices are unavailable.

## Finding registry

The audit contained ten confirmed findings, eight potential table rows, and a separate responsive-typography check. The latter is tracked as P9 so all nine requested potential findings are accounted for.

| ID | Finding | Status |
| --- | --- | --- |
| C1 | Modal focus containment | Fixed; automated and Chrome focus checks; rapid lifecycle checks remain |
| C2 | Persistent focus indicators | Fixed centrally; complete visual sweep remains |
| C3 | Continuous motion pause | Fixed; video control checked in Chrome; footer pause needs manual check |
| C4 | Interaction reduced motion | Fixed; runtime Work branch checked; full interaction sweep remains |
| C5 | Modified section clicks | Fixed; modifier guard tests pass |
| C6 | Case URL synchronization | Fixed; direct entry and Back/Forward checked; switching/reload stress checks remain |
| C7 | Skip navigation | Fixed; source reviewed; visual keyboard check remains |
| C8 | Responsive image consumers | Fixed; production sources and metadata verified |
| C9 | Explicit CSS transitions | Fixed; no remaining `transition: all` in source |
| C10 | Native color scheme | Fixed; production computed scheme is dark; OS preference sweep remains |
| P1 | Keyboard project reachability | Fixed; both published cases reached; reduced-mode activation sweep remains |
| P2 | Runtime motion preference changes | Fixed; runtime static Work branch verified; open-dialog changes remain |
| P3 | Overlay boundaries and safe areas | Targeted containment/inset fixes; physical-device verification unavailable |
| P4 | Image layout stability | Fixed development dimension gap; metadata verified; slow-network sweep remains |
| P5 | Composited contrast | Metadata failure fixed; About minimum opacity verified as passing |
| P6 | Animation performance | Investigated; no >50ms opening frames in local sample; cursor/slow-device profiling unavailable |
| P7 | Scroll indicator semantics | Fixed decorative semantics and finite motion; no action implied to assistive technology |
| P8 | Loading performance and LCP | Measured hero text/intro delay; retained intentional timing; field/throttled verification unavailable |
| P9 | Responsive typography and zoom | Source reviewed; comprehensive 320px/landscape/zoom/text testing unavailable |

## Phase verification

Implementation and executed checks will be recorded here after each phase. Unexecuted checks will remain explicitly marked.

### Phase 1 — Accessibility and keyboard navigation

- C1: `dialogFocus.ts` traps focus using currently visible/enabled controls, provides an opening fallback, and removes both listeners on teardown. `SectionHomeWork.vue` makes `#app` inert before mount, preserving its prior state; Teleport keeps the dialog outside that background. Duplicate open requests are rejected by the lifecycle guard. Existing close focus restoration retained.
- C2/C7: removed universal/card outline suppression, added a centralized focus-visible fallback, and added the first-focusable skip link with a focusable homepage/error content destination.
- C3: shared `MotionControl.vue` adds 48px pause/play controls to the footer and case video. Indicator rotation retains its original angular speed but stops after four seconds.
- C4/P2: shared motion observer resets stagger text, card hover and cursor-follow effects; runtime Work rebuilding waits until the overlay has fully closed. Smoothing changes also wait for scroll locks to release. Life already uses motion-aware matchMedia. Footer/About rebuild affected contexts; hero finishes its intro when reduction is enabled.
- P1: keyboard-only project buttons center the existing exhibition at published projects before opening, using its existing timeline labels and snap cancellation. They appear only on focus, wrap on narrow screens, and stay fixed in view in the tall reduced-motion exhibition. Reduced-motion cards are independently activatable rather than radius-gated. If a focused card leaves the activation radius, focus moves to the Work section without changing scroll; opening a dialog leaves focus to its trap.
- P7: hero indicator is instructional/decorative (desktop pointer-events are disabled); removed its action-like label and hid it from assistive technology.
- Native Chrome executed: MuziMatch opens from the keyboard-project control; initial focus is Close; Shift+Tab wraps to the final preview button; Tab wraps back to Close; video Pause changes to Play. Background content is absent from the accessibility tree while the dialog is active.
- Automated phase checks: typecheck, Node focus-containment test, build and diff whitespace check passed. No lint script available.

### Phase 2 — Navigation and overlays

- C5: moved the logo's existing modifier guard into `linkClick.ts`; both logo and section links preserve modified clicks.
- C6: `?case=<published-slug>` uses the existing homepage route and static-host entry. Opening, switching and closing push history entries; route-driven Back/Forward reuses the existing coordinator without pushing duplicates. Invalid, repeated or unpublished slugs are removed using replace, preserving unrelated parameters. Initial URL handling waits until intro scroll locking finishes. Router scroll restoration yields to the overlay coordinator for case-query changes.
- P3: added nested-scroller overscroll containment and safe-area minimums to fixed case controls without changing zero-inset desktop layout. Physical notches, toolbar changes and native rubber-banding remain device checks.
- Automated phase checks: typecheck and three Node tests passed; production build and diff whitespace check passed. No lint script exists.

- Phase 2 native Chrome: direct SFVonline entry opened after intro; Close removed the query; Back reopened it; Forward closed it. Console measurement after closing: scrollY 7702, `#app.inert=false`, no dialog, focus on SFVonline's active card, Work parent still `pin-spacer`.

### Phase 3 — Images, rendering and performance

- C8/P4: dimension generation now covers every original, including unoptimized assets. `predev` generates only inexpensive metadata; development and production use the same intrinsic dimensions. Responsive variants now include portrait/photo/thumbnail consumers, with `sizes` mirroring existing SCSS. No aspect ratios or crops changed.
- P5: calculated sRGB compositing using the actual palette. About white at 50% over #0a15df: 3.14:1 (large text passes); mint eyebrow at 75%: 4.56:1 (small text passes). Blue metadata at 50%: 2.35:1 on MuziMatch and 2.89:1 on SFVonline (fails). Increased only metadata label opacity to 95%; final ratios are 4.60:1 and 7.33:1. A 75% intermediate value failed on MuziMatch and was corrected before final verification.
- P6: production Chrome `PerformanceObserver` sampled long-animation-frame duration and script forced-style/layout duration while opening MuziMatch. No frames over 50ms were recorded. This does not establish 60fps or prove the absence of shorter reflows. Preserved the existing geometry-based opening/closing animation and cursor positioning rather than rewriting without a reproduced bottleneck. Cursor movement, switching, closing and low-end device profiling remain unverified.
- P8: buffered production LCP entries before opening a case: intro caption 1864ms, a hero title character 4984ms, hero copy `SPAN.split-line` 8032ms. This is one local, unthrottled run, with DevTools open, not a field metric. The largest initial visible element was text delayed by the authored intro, not the portrait. Fonts already use WOFF2 and `font-display: swap`; intro waits for fonts to make SplitText measurement stable. Preserved intro timing and font measurement rather than add unsupported image priority/preloads. Fast content exposure would require a deliberate intro timing decision; slow-network and field measurement remain necessary.
- Production image check: viewport 1163×952 CSS px, hero rendered 349px wide; Chrome selected the 720px WebP (100070 bytes), suitable for high DPR. Added 320px portrait candidate is 28782 bytes. Avatar now has 96/144px candidates (3292/5904 bytes) instead of always using 419px (25790 bytes). These are generated asset sizes, not measured transfer savings on every device.
- P4: initial buffered layout-shift observer returned no loading shift entries before opening. Geometry-based overlay animation subsequently generated shift entries; these must not be attributed to image loading. Metadata checks cover all 54 originals and all optimized variants. No arbitrary aspect ratios were introduced; existing authored art direction remains.
- Automated phase checks: typecheck, three Node tests, production build, static SEO, image verification and diff whitespace checks passed. Image verification additionally validates development metadata against originals, including EXIF rotation.

### Phase 4 — CSS and browser consistency

- C9: `_typography.scss` now transitions color and decoration color; `_buttons.scss` transitions transform/background/border; the existing `.transition` utility uses an explicit visual-property list. Existing timing/easing retained.
- C10: `_root.scss` declares `color-scheme: dark`; `index.html` declares the established blue `theme-color`. Removed the light-OS generic button background that contradicted this interface. Production computed root scheme confirmed as dark; light/dark emulation and native browser control appearance are not fully verified.
- P9: reviewed card/stack metadata clipping, responsive case block grids, fixed case pills, footer controls, breakpoint rules and type tokens. Existing mobile composition and typography retained. Corrected the new keyboard controls' wrapping and reduced-motion positioning during source review. No broader typography redesign justified without reproducing overlap. Browser 320px, landscape, 200%/400% zoom and enlarged-text sweeps remain unexecuted.
- Final source review includes GSAP observer teardown, focus listener teardown, previous background inert restoration, scroll-lock ownership and case-route failure rollback. A failed case switch replaces the query with the actual case, avoiding automatic retry against an unsuccessful transition.
- Final verification after all code changes: `npm run typecheck`, `npm test` (3 passing tests), `npm run build`, `npm run verify:seo`, `npm run verify:images` and `git diff --check` passed. No lint command exists. Tests ran on Node 24.15.0 and use native TypeScript stripping (requires a compatible modern Node version). Build emits the chunk-size advisory documented below.

## Affected files by finding

| Findings | Files |
| --- | --- |
| C1 | `src/utils/dom/dialogFocus.ts`, `src/components/work/ProjectLayerPrototype.vue`, `src/components/sections/SectionHomeWork.vue`, `scripts/tests/dialog-focus.test.mjs` |
| C2 | `src/assets/styles/base/_reset.scss`, `src/assets/styles/base/_global.scss`, `src/assets/styles/sections/_projects.scss` |
| C3/P7 | `src/components/ui/MotionControl.vue`, `src/components/AppFooter.vue`, `src/components/work/ProjectHeroMedia.vue`, `src/components/sections/SectionHomeHero.vue`, `_buttons.scss`, `_footer.scss`, `_circular-scroll-indicator.scss`, `_projects.scss`, locale files |
| C4/P2 | `src/utils/animations/{gsap,staggerLinks,portfolioScrollSmoother}.ts`, `src/composables/useCursorFollowIndicator.ts`, `ProjectCard.vue`, `ProjectStackNavigator.vue`, `SectionHomeWork.vue`, `SectionHomeAbout.vue`, `SectionHomeHero.vue`, `AppFooter.vue`, `AppHeader.vue` |
| C5 | `src/utils/dom/linkClick.ts`, `SiteNav.vue`, `SectionNavigation.vue`, `scripts/tests/navigation.test.mjs` |
| C6 | `src/utils/navigation/caseQuery.ts`, `SectionHomeWork.vue`, `src/router.js`, `src/views/Index.vue`, navigation tests |
| C7 | `src/App.vue`, `src/views/Index.vue`, `src/components/ErrorState.vue`, `_global.scss`, locale files |
| C8/P4 | `scripts/{generate-images,verify-images}.mjs`, `package.json`, `src/utils/images/{optimizedImages,caseImageSizes}.ts`, `BaseImage.vue`, `SiteNav.vue`, `SectionHomeHero.vue`, `ProjectCard.vue`, `ProjectStackNavigator.vue`, `HomeLifeStackExperiment.vue`, `CaseFeatureBlock.vue` |
| C9 | `src/assets/styles/base/_typography.scss`, `src/assets/styles/components/_buttons.scss`, `src/assets/styles/utilities/_effects.scss` |
| C10 | `src/assets/styles/base/{_root,_color-scheme-light}.scss`, `index.html` |
| P1 | `SectionHomeWork.vue`, `ProjectCard.vue`, `_projects.scss` |
| P3 | `src/assets/styles/components/_navigation.scss`, `_projects.scss` |
| P5 | `src/components/work/ProjectHero.vue`, `_projects.scss`; About source reviewed without color changes |
| P6/P8/P9 | Existing overlay, cursor, hero, font and responsive source inspected; measurement/verification decisions above |

Component-only names in this table refer to their existing paths under `src/components`; style-only names refer to their existing centralized SCSS layer. No dependencies, architectural migrations or new page layouts were introduced.

## Executed browser checks and limits

- Development Chrome: baseline Work pinning/horizontal progression; dialog initial Close focus; reverse/forward Tab wrapping; video Pause label; background inert exclusion; direct SFVonline query entry; Close/Back/Forward; restored focus on SFVonline and existing pin spacer after close.
- Production Chrome: MuziMatch keyboard control opens; Shift+Tab wraps to final preview; Tab returns to Close; Escape removes query and eventually restores MuziMatch card focus. Shift+Tab from that card reaches the SFVonline keyboard control; Enter opens SFVonline and focuses Close. Thus both published cases were activated through the keyboard path in normal motion.
- Runtime motion emulation: changing to reduce removes pin spacers and exposes card tab indices `[0,-1,0,-1,0]` (published cases and existing experiment); footer motion control disappears when its animation stops. Closing DevTools cleared emulation, and normal-mode opening remained functional. Subsequent overlay checks must not be described as reduced-motion activation tests.
- Work spacer measured 9895px before and during MuziMatch opening at unchanged viewport; homepage scroll measured 4864px while inert. Earlier development close measurement had `scrollY=7702`, `inert=false`, no dialog and SFVonline card focus. These are separate checks, not an exhaustive scroll-position matrix.
- Production console showed no application exception or GSAP null-target warning during the successful opening sample. A diagnostic paste produced a console SyntaxError; this was test-input error, not application code. Development HMR had GSAP null-target warnings and duplicate retained DOM during ongoing edits; full refresh was used for production sampling.
- Later native control became unreliable: coordinate actions returned `noWindowsAvailable`, clipboard input timed out, and AX actions stopped producing trustworthy live viewport state. Reconnection/session reset did not restore dependable mobile interaction. No DOM-capable browser provider was available. Consequently the remaining interaction tests below are explicitly unverified; no passing result is inferred from clicks sent without an observable outcome.

## Remaining manual verification

1. Desktop Work: sample every project stop, snap activation near stops, cancellation on resumed input, opening from several homepage offsets, case switching via stack, close to the current/originating card, spacer dimensions before/after each transaction, and homepage position throughout. Stress rapid open/close, Back/Forward during opening/switching/closing, and resize during a case. Reload direct published URLs; check unknown/unpublished/array slugs in the browser (their resolver is covered automatically).
2. Motion/keyboard: enable reduction before initial load and activate both cases with Tab/Enter/Space; toggle it during opening, switching and closing; confirm video/hover/cursor/stack/footer motion stops and observers/triggers do not accumulate. Check skip-link focus and visible destination, all focus rings after animations, departing-card focus, and footer pause/resume.
3. Responsive and physical devices: 320px portrait, landscape mobile, 200%/400% browser zoom and enlarged OS text; inspect card metadata, case headings, pills, pause controls and modal actions. Test iOS/Android notches, toolbar collapse, safe areas and boundary rubber-banding. Safe-area CSS is targeted but no physical-device result is claimed.
4. Loading/rendering: cold/throttled production versus development image loading, portrait/life/stack/currentSrc at common widths/DPR, natural-height case media, CLS attribution, font loading and measured LCP. Field data and a slow device are needed before changing authored intro timing. Capture a full Performance trace for overlay and cursor interactions if frame loss is seen.
5. Browser consistency: native controls under light/dark OS preferences, Safari/Firefox focus containment, keyboard scrolling and reduced motion; screen-reader dialog announcement and reading order.

## Regression risks

- URL/history and runtime motion rebuilding touch the existing Work/overlay lifecycle. Original pinning, snapping, close reconciliation and scroll-lock coordinator remain; the transaction matrix above is the main release risk.
- Generated responsive variants increase manifest size. Production app chunk is approximately 507kB minified / 178kB gzip, producing Vite's >500kB advisory. Build succeeds. No speculative code-splitting or dependencies added; measured slow-network profiling should guide any follow-up.
- Focus-only keyboard controls, pause buttons and 95% metadata labels are intentional accessibility changes. Other colors, type tokens, crops, page composition and animation timing remain.
- Local Chrome performance samples are narrow and unthrottled; they cannot certify mobile performance, complete CLS behavior or physical safe areas.

All ten confirmed findings have code fixes. All nine potential findings have an explicit investigation outcome; unresolved verification is documented rather than labelled a nonissue. Changes remain on `fix/portfolio-audit`; nothing is merged, deployed or submitted as a PR.


## Pre-merge review follow-up — three findings

These fixes extend the existing audit changes on `fix/portfolio-audit`; previously uncommitted changes, including the English caption correction and bassist crop, are preserved. No dependency, architectural, pinning, snapping, or animation-timing changes were introduced.

| Review finding | Resolution | Affected files |
| --- | --- | --- |
| R1 — Delayed-font reduced-motion scroll lock (High) | Fixed. A reduced-motion hero restarts independently when the loading timeline is complete. `restart(true, false)` executes zero-duration callbacks after `pause(0)`; `play(0)` alone does not. Scroll release clears its handle before emitting a guarded, single `intro-complete`. Preference changes before initialization cannot signal completion prematurely. Unmount prevents late font continuations from acquiring a scroll lock and removes the motion observer. Normal loading overlap remains 0.14 seconds. | `SectionHomeHero.vue`, `scripts/tests/portfolio-regressions.test.mjs` |
| R2 — Project-card focus contrast (High) | Fixed. The existing 2px outline/4px offset uses `--color-white`, with 9.61:1 contrast against primary blue, instead of inherited primary blue. The rule applies to all cards in both motion modes. Card hover transforms, activation, focus transfer, and layout are unchanged. Visual clipping/overlap and hover-transition checks remain manual. | `src/assets/styles/sections/_projects.scss` |
| R3 — Unlimited synchronization retries (Medium) | Fixed. Layer switches return explicit success/interruption outcomes and propagate exceptions after presentation cleanup. The coordinator reconciles a failed switch once, only if its requested slug remains current and its layer is still mounted. Synchronization remembers attempted requests and follows up only for a changed query; explicit controls invalidate that record so Back to an earlier URL still reconciles the overlay. Failed close rollback also preserves newer history requests, and unmounted transactions cannot restore lifecycle/history. Existing geometry and successful close/scroll-restoration code remain intact. | `SectionHomeWork.vue`, `ProjectLayerPrototype.vue`, `scripts/tests/portfolio-regressions.test.mjs` |

### Follow-up verification

- Automated: typecheck, all 14 Node tests, production build, SEO verification, image verification, and `git diff --check` pass. No lint command exists. The existing approximately 508 kB bundle warning remains informational.
- New regression tests execute the actual component functions extracted with the already installed TypeScript compiler, with controlled lifecycle/DOM/router boundaries. The hero tests use installed GSAP, deliberately defer font readiness, change motion preference before releasing fonts, and verify exactly one completion/release plus observer cleanup. Unmount-before-font-ready and normal loading overlap are also covered.
- Transaction tests cover exception/interruption rollback once, newer Back requests, rapid URL changes, Back to the previously synchronized URL during a control-initiated switch, unmount, and propagation of layer errors after cleanup. These tests are not browser interaction tests and do not measure DOM geometry or native history behavior.
- Source verification: normal hero timing/animation definitions, Work pin/snap calculations, successful close geometry, scroll restoration, card activation/tab order, and existing hover transforms are unchanged. White focus contrast was calculated from existing palette tokens; visibility during overlapping cards/hover transforms has not been visually verified.
- Browser attempt: the dedicated Chrome provider returned `Browser is not available: chrome`. Native Chrome was readable, but rejected the first separate-window input with `The user changed '/Applications/Google Chrome.app'`. No local-page browser assertion completed; no browser pass is claimed for this follow-up.
- Remaining browser checks: delay fonts and toggle motion during initialization; direct-case reload after the intro; rapid opening/switching/closing and Back/Forward during each transition; focus outlines on both published cards in both motion modes during/after hover; homepage scroll and Work-spacer dimensions before/during/after overlays. Physical mobile safe-area and resize checks from the original audit remain outstanding.

All three review findings have code fixes and focused regression coverage for the two transaction/lifecycle issues. Browser visual/geometry verification remains a release check. Nothing was merged, deployed, or submitted as a pull request.


## Intentional decorative-marquee playback decision

On `feature/mobile-project-stack`, the footer marquee pause/play button, its pause state, toggle handler, retained tween reference and footer-only control positioning were removed at the owner's explicit request. The footer again loops continuously with the existing 15-second duration, linear easing and scroll-direction reversal. Other decorative CSS marquees already have no playback controls and require no changes. Runtime `prefers-reduced-motion` support and GSAP context cleanup are retained. Video controls and the shared MotionControl component/styles remain unchanged because case videos still use them.

Accessibility trade-off: users who have not enabled reduced motion no longer have an in-page mechanism to pause the decorative footer animation. Consequently, the original continuous-motion finding is intentionally accepted rather than fully resolved for the marquee; reduced-motion support alone does not provide a pause mechanism to everyone affected by moving content (WCAG 2.2.2). No alternative pause or automatic-stop mechanism was introduced.

Verification for this removal: typecheck, all 20 automated tests, production build, static SEO verification, image verification and `git diff --check` pass. Source review confirms the original loop timing/direction, motion observer and video controls are retained. No browser verification was performed for this removal. The existing Vite chunk-size advisory remains informational.
