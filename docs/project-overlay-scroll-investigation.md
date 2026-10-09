# Production project-overlay scroll investigation

2026-10-09 — production build from commit `93fb660`, asset `app-haPxdHCJ.js`.

Sections 1–7 record the pre-fix investigation. The implemented correction and subsequent validation are recorded in section 8 below.

## Result

Confirmed desktop failure: the homepage scroll position remains correct, but a global refresh removes the disabled Work pin and its spacing. Life is then measured and animated against the shortened document. Closing restores the scroll number without restoring the pin or downstream geometry.

The reproduction shows Life appearing at the Work scroll position; in this captured variant Work leaves the viewport rather than all three layers remaining visible together. The exact three-layer screenshot variant has not been independently reproduced. No physical iPhone/Safari testing or live-domain testing was performed here.

No production code has been changed. Measurements are in [project-overlay-scroll-measurements.json](./project-overlay-scroll-measurements.json).

## 1. Reproduction

Serve the existing production `dist` using `npm run preview -- --host --port 4175`; use the normal homepage without diagnostic flags.

1. Open a fresh document in desktop Chrome at 1440 × 900.
2. Scroll to the settled MuziMatch card, homepage `scrollY = 4476` in this build.
3. Open MuziMatch. The italic font must not already have been used/loaded in this document.
4. Wait for the overlay to finish opening. Scrolling inside it is optional; the failure already occurs during opening.
5. Close the case. Life is visible at the preserved Work scroll position.

Read-only instrumentation exposed the existing bundled GSAP instances in the browser, recorded rects and trigger state, and forwarded the original `ScrollTrigger.refresh()` while recording its call stack. Source and generated build files were not edited. Temporary scripts/screenshots stayed outside the repository.

## 2. Exact causal chain

1. `SectionHomeWork.vue` captures the portfolio scroll position and project index before mounting the overlay.
2. `suspendExhibitionTracking()` calls `exhibitionTrigger.disable(false, false)`. Initially this preserves the existing pin/spacer and card transforms while stopping snap tracking.
3. ScrollSmoother is paused on desktop and `html.style.overflow` becomes `hidden`. The case is teleported to `body`; its absolute-positioned content has its own `overflow-y: auto` scroller. Its divider ScrollTrigger explicitly uses that element as `scroller`.
4. First use of the case loads the `Mg¹²`, weight 400, italic face. A recorded `document.fonts.loadingdone` event precedes the damaging refresh by about 8 ms. This can occur even when font bytes are cached: the important condition is first use in this document.
5. GSAP SplitText's existing `autoSplit` subscribes to `document.fonts.loadingdone`. Hero's responsive line splits run `onSplit`, which calls `scheduleSplitRefresh()` and then global `ScrollTrigger.refresh()`.
6. The recorded call stack points to that Hero refresh callback at production asset line 102, column 86117. No window resize event occurred; viewport stayed 1440 × 900.
7. In installed GSAP 3.15.0, global `_refreshAll()` calls `_revertAll()` on all triggers, including disabled ones. Work's pin is swapped out. The subsequent instance `refresh()` skips disabled triggers, so Work's pin spacing is not rebuilt. Life remains enabled and is refreshed against the document without Work's spacer.
8. Close reconciliation uses `enable(false, false)`, restores the saved scroll position, and calls `ScrollTrigger.update()`. Enabling without refresh does not rebuild the reverted pin; update does not recalculate Life's corrupted boundaries. The same sequence occurs after unlock, leaving the mismatch visible.

Local source references: `SectionHomeWork.vue:202–225`, `:377–383`; `SectionHomeHero.vue:112–134`; installed `ScrollTrigger.js` functions `_revertAll`, `_refreshAll`, `self.refresh`, `self.enable`; `SplitText.js` font `loadingdone` subscription.

This matches the documented global refresh process, which temporarily reverts pins to measure document flow. The disabled-instance skip and failure to restore this pin are confirmed by the installed library source and measured state, rather than inferred solely from documentation. See [GSAP refresh](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.refresh()/) and [GSAP disable](https://gsap.com/docs/v3/Plugins/ScrollTrigger/disable()/).

## 3. Scroll and geometry evidence

Desktop MuziMatch, no case scrolling:

| Measurement | Before opening | Overlay open | After closing |
| --- | ---: | ---: | ---: |
| Window scrollY | 4476 | 4476 | 4476 |
| ScrollSmoother scrollTop | 4476 | 4476 | 4476 |
| Work pin spacer height | 9353 | absent | absent |
| Work section viewport top | −0.45 | −1730.45 | −1730.45 |
| Life section viewport top | 6722.55 | −1730.45 | −1730.45 |
| Life photo trigger start | 11199 | 2746 | 2746 |
| Life photo trigger progress | 0 | 0.2563 | 0.2563 |
| Work pin `enabled` | true | false | true |
| Work pin `isReverted` | false | true | true |

Life moves upward by **8453 px**, exactly Work's pin scroll distance (`11199 − 2746`). Work's coverflow animation progress remains around 0.2047 even after its pin geometry has disappeared. Navigation's triggers also remain reverted after enable-without-refresh, although their pins are not the source of the lost document spacing.

These are settled lifecycle measurements; GSAP itself temporarily writes/restores scroller positions within a refresh. No persistent background movement from case scrolling was observed in these runs.

## 4. Scenario results and controls

| Production-preview scenario | Result |
| --- | --- |
| Desktop MuziMatch, no case scroll | Pin/layout failure; homepage Y remains 4476 |
| Desktop MuziMatch, ~180 px case scroll | Y unchanged; already broken geometry persists |
| Desktop MuziMatch, ~1800 px case scroll | Y unchanged; already broken geometry persists |
| Desktop repeated open/close | Does not repair the previously lost spacer |
| Desktop MuziMatch → SFVonline | Background remains frozen during switch; closes at SFV target ~7159; broken pin geometry persists |
| Desktop SFVonline opened directly at 7159 | Same first-use italic-font refresh removes Work spacing; Y remains 7159 |
| Desktop MuziMatch with italic face loaded before opening, browser-only control | No overlay-time global refresh; pin remains unreverted and Life top stays 6722.55; Y remains 4476 |
| Compact 393 × 852 MuziMatch, no/~180/~1800 px case scroll | Y remains 3781; Work sticky and Life rects remain stable |
| Compact MuziMatch → SFVonline | Y remains 3781 while open/switching; closes at 5774 with consistent geometry |
| Compact SFVonline opened directly, ~100 px case scroll | Y remains 5774; Work/Life geometry stays stable |

The font-preload control is an isolation experiment, not a proposed production fix. It confirms that the overlay-time refresh is the trigger. A separate browser pin-override probe failed to complete and is not used as validation of a fix. Attempts to open coming-soon cards were discarded; the completed direct SFV test uses published card index 2.

Compact uses CSS-native sticky and retains its document height without a GSAP Work pin spacer. The same font-related refresh was observed there without the desktop spacer failure. Emulation does not establish physical iPhone/Safari correctness.

Recent compact `svh` sizing and the compact Work heading reveal are not implicated in this reproduced desktop failure: neither runs on this desktop path, viewport dimensions are stable, and the lost height equals the pin distance exactly. This does not rule out a separate physical-browser issue.

## 5. Recommended minimal correction — not implemented

Keep the desktop **pinned** Work trigger enabled while the overlay is active; suspend its ownership of snapping instead of disabling the trigger that owns document spacing.

- Kill an in-flight Work snap when opening.
- Make the existing snap callback decline scroll correction whenever the existing overlay lifecycle owns the page, including closing/reconciliation.
- Preserve the existing background scroll lock, ScrollSmoother pause and close-target coordinator.
- Retain compact's existing suspension path where no GSAP Work pin is involved.
- Reuse the current activation guard, which already ignores covered-gallery updates outside reconciliation.

This allows legitimate font/resize refreshes to rebuild Work spacing before measuring Life. It avoids adding global refreshes, deferring all refreshes, changing animation/layout choreography, or adding persistence. Exact snap cancellation and the close/unlock ordering still need implementation validation; the recommendation is not a tested patch.

Do not fix this by preloading one font or removing Hero's refresh: those address one trigger but leave the disabled pin vulnerable to other legitimate refreshes. Do not merely restore scrollY again: it is already correct.

## 6. Risks and existing close behavior

The main regression risk is a delayed snap reclaiming the homepage during opening, switching, reconciliation or unlock. The snap gate must cover every overlay-owned phase and permit ordinary snapping only after close completes. Verify that live refreshes do not override the selected overlay project or disrupt collapse-to-card geometry.

Current behavior deliberately restores the exact opening Y for the same case and reconciles to the current case's card after navigation. For example, MuziMatch → SFVonline closes at 5774 on compact, rather than original 3781. This predates the regression and satisfies the earlier active-card close requirement. Returning to the original Y after switching would be a separate product change and is not part of the proposed correction.

## 7. Validation plan

After review and a focused patch:

1. Repeat production-preview and deployed-build tests with first-use and already-loaded fonts. Test immediate close, short/deep case scrolling, repeated cycles and both published cards at different gallery positions.
2. During an open overlay, exercise a legitimate refresh (font loading and resize). Assert Work spacer remains present, Work pin is not left reverted, downstream Life boundaries remain correct and logical background Y is unchanged.
3. Switch cases and verify the active-card collapse, intended target scroll position, keyboard focus and SectionNavigation. Verify no delayed snap changes Y after close.
4. Test compact normal/diagnostic modes and reduced motion; preserve native sticky, stable svh sizing, About, Life and the new compact heading.
5. Test on the physical iPhone 14 Pro in Safari and Chrome, including toolbar show/hide, momentum, rotation and case scroll at its boundaries. Check rects/sticky state as well as Y. Desktop emulation is insufficient for these checks.
6. Run typecheck, production build, static SEO verification and diff check after implementation. Compare deployed assets with the tested build.

The unchanged production preview is available at `http://192.168.68.56:4175/` for physical-device reproduction. No fix has been applied or deployed.

## 8. Implemented correction

Runtime changes are confined to `src/components/sections/SectionHomeWork.vue` and the existing lock in `src/utils/animations/portfolioScrollSmoother.ts`.

- Desktop's pinned exhibition trigger remains enabled throughout opening, open, switching and closing. Compact's unpinned trigger retains its existing suspension/resume path.
- Opening enters the overlay lifecycle before cancelling any current snap. While the overlay owns the page, `snapTo` returns actual scroller progress rather than GSAP's inertia-predicted progress.
- A guarded `onStart` cancels a queued snap that would still move fractional scroller coordinates after rounding. Cancellation removes the interruption retry callback, kills the tween and clears its matching creator reference. These are the snap-specific cleanup operations needed instead of disabling the pin.
- The matching `tweenTo.tween` reference is GSAP 3.15 implementation state, accessed with an explicit type. Clearing it is necessary: killing alone left keyboard scrolling unable to snap again in the production-preview test. This small compatibility point should be rechecked on GSAP upgrades.
- After the existing close coordinator restores the final target, queued snaps cannot change that restored position. Normal snapping resumes once the homepage scroll position changes again. No timeout or new input listener is used.
- Same-case restoration and close-to-current-card after navigation remain intact. No production refresh calls, layout changes or animation changes are added.

### Focus-scroll edge case found during validation

An additional desktop test shuffled the overlay navigator while its cards were outside the visible case viewport. `focusActiveCard()` already uses `preventScroll: true`, but ScrollSmoother's own focus handler still called `scrollTo()` for that teleported card while `paused() === true`. The trace recorded the card at viewport top ~3519 px and background Y 4476 before the call; the homepage subsequently moved to ~7721. Work's pin remained intact, confirming a separate scroll-lock bypass rather than another spacing failure.

The existing smoother now uses its documented `onFocusIn` callback to return `false` only while the existing `smoothingLockCount` is positive. This prevents automatic homepage focus-scroll while locked and restores the original focus behavior when unlocked. It introduces no new state or scroll-restoration mechanism and does not alter native mobile scrolling. Source: [GSAP ScrollSmoother configuration](https://gsap.com/docs/v3/Plugins/ScrollSmoother/#config-object).

### Production-preview validation results

The final production build (`app-CiQXEwUK.js`) was tested through Vite preview on port 4175, using headless Chrome with native mouse/touch scroll input. Browser-only instrumentation exposed existing GSAP instances and recorded geometry, fonts, refreshes, snap starts and runtime errors; no diagnostic code was added to production assets. Desktop was 1440 × 900; compact emulation was 393 × 852 at DPR 3. This is not physical iPhone/Safari validation.

| Scenario | Result after correction |
| --- | --- |
| Desktop first-use italic font, immediate close | Font-triggered refresh observed; Y stays 4476, spacer stays 9353 px, Life viewport top stays 6722.55 px |
| Desktop cached font, short/deep case scrolling and repeated cycles | Same-case Y and Work/Life geometry remain stable |
| Desktop MuziMatch → SFVonline, then direct SFVonline | Background stays at 4476 during switching; closes at current-card target 7158.78; subsequent SFV cycle preserves that position |
| Explicit global refresh while desktop case is open | Work pin stays enabled and unreverted; spacer and Life document coordinates remain stable |
| Open before a pending snap, close at an unsettled position | Restored position remains stable; no delayed correction or repeated cancellation loop |
| Open from an actual active snap with cached font | Active tween cancelled; Y 4555.999356 preserved through close; subsequent ArrowDown snaps normally to 4476 |
| Compact short/deep scrolling, explicit refresh, case switching and direct SFVonline | Native sticky geometry remains stable; same-case Y stays 3781, switching closes at SFV target 5774 |
| Normal desktop mouse and compact touch scrolling after close | Existing snapping resumes on fresh homepage scrolling |

Every completed lifecycle scenario checked Work/Life geometry before opening, while open, after case scrolling, after refresh/switching and after closing. Post-close samples covered 2.5 seconds and showed no active/stale snap or retry loop. No runtime/console errors were recorded. Unlike the pre-fix result, Work's spacer never disappeared and Life did not move upward into Work.

`npm run typecheck`, `npm run build`, `npm run verify:seo` and `git diff --check` passed. The build ran the existing image optimization pipeline (53 optimized, one skipped). No deployment or commit was performed; the original measurements JSON remains unchanged as pre-fix evidence.

Physical iPhone 14 Pro Safari/Chrome checks, dynamic browser toolbar changes, rotation and deployed-build verification remain outstanding. No mobile performance improvement is claimed. No remaining failure was found in the tested lifecycle scenarios; GSAP upgrades should revalidate the snap-creator cleanup noted above. The modified production preview remains available at `http://192.168.68.56:4175/` for real-device testing.
