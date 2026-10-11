# Mobile Work card stacking

Branch: `feature/mobile-project-stack`. Implementation starts from clean commit `c16ffb9`, which already contains all portfolio audit fixes. No dependencies were added.

## Reference and boundaries

Reviewed the actual HTML, CSS and JavaScript in [Cards Stacking with GSAP](https://codepen.io/pixelgridui/pen/mybLVxL). It overlays absolutely positioned items, brings each new item up from below while scaling the previous item, pins the section, and uses a linear ScrollTrigger timeline. Its scale is 0.9 and scrub delay is 1 second. This implementation adapts that choreography to the existing cards with scale 0.94 and `scrub: 0.8`, matching the existing photo stack smoothing, without snap or gesture listeners.

- Phone breakpoint: existing `md` range, below 48rem. The existing 48–64rem tablet coverflow/native sticky behavior and desktop coverflow, rotation, pinning, snapping and activation calculations are retained.
- A dedicated mobile setup inside the existing GSAP matchMedia/context infrastructure assigns increasing stacking order, a scroll-driven title reveal followed by the first card entering from below, brief activation intervals and simultaneous previous-card scaling/upward offset plus incoming-card vertical movement. The final rest releases the pin; the section then scrolls naturally toward Life. Reverse scrolling reverses the same timeline.
- Project labels (`project-N`) remain the source for keyboard navigation, direct URLs and case-close targets. There are no automatic scroll calls in the stack setup or its progress callback. Existing explicit keyboard, URL and overlay-close scroll coordination remains necessary. Mobile explicit navigation settles the scrub tween before geometry reads; opening an overlay pauses it at the displayed position.
- Only a settled card is interactive. Moving/obscured cards have no activation/tab stop and are hidden from assistive technology. Existing project navigation exposes both published projects. White focus outlines are retained; phone keyboard controls layer above the cards.
- Reduced motion still uses the existing unpinned vertical layout, with all published cards keyboard-accessible. Existing runtime preference observer and deferred rebuilding during overlay lifecycle transactions are retained.
- Phone Work cards use width `min(88vw, 24rem)` and height capped at `min(82svh, 760px)` and at the available visible height below the measured header. Text occupies an intrinsic-height grid row and the thumbnail occupies the remaining row, preventing the former absolute 40% media boundary from overlapping metadata/tags. Font sizes and image fit/position remain unchanged. Overlay stack-preview dimensions remain unchanged. Card image `sizes` matches the new width.
- The overlay keeps using the actual transformed source/target bounding rectangle. Pin tracking stays installed while the homepage is locked. A phone height/breakpoint change invalidates the remembered opening project identity so close resolves the selected project's current label rather than reusing an obsolete pixel offset. It does not add scrolling during resize.
- MatchMedia owns initial transform reversion. Mobile cleanup kills its trigger/timeline and resets its mode flag; the existing coordinator owns scroll locking, focus restoration, route synchronization and motion changes.

## Affected files

- `src/components/sections/SectionHomeWork.vue`: phone timeline, label-based activation, layout conditions and resize close-target invalidation.
- `src/components/work/ProjectCard.vue`: optional obscured semantics and responsive image width.
- `src/assets/styles/sections/_projects.scss`: phone-only pin/layout and card proportions/grid.
- `scripts/tests/portfolio-regressions.test.mjs`: four focused stack/sequence/scrub regression tests using the actual component functions and installed GSAP.

## Verification

Automated checks: typecheck, all 18 Node tests, production build, static SEO verification, image verification and `git diff --check` pass. The existing bundle-size advisory remains informational. No lint command is configured.

New tests cover first-card state, halfway overlap/scaling, complete incoming-card activation, reverse playback, increasing stacking order, pin configuration without snap, cleanup, all five project-label targets (including floating-point label boundaries), activation ownership while an overlay is mounted, updated scroll distance after a height refresh, and invalidation of obsolete close coordinates. ScrollTrigger/DOM boundaries are controlled in these tests: they do not establish native scroll, pin-spacer dimensions or touch-momentum correctness.

Browser attempt: opened a separate native Chrome window with the production preview, enabled device emulation and selected responsive controls. Clipboard input timed out, and subsequent console/viewport actions did not produce trustworthy updated focus, console results or viewport frames. An AX project action changed the URL to `?case=muzimatch`, but the viewport/DOM did not visibly confirm the completed dialog. No passing stacking, overlay, geometry, console-error or history browser result is inferred from those actions.

Still requiring dependable browser/device verification:

- 320×480, 375×667 and 430px widths, shorter/landscape viewports and enlarged text: thumbnail visibility, metadata/tag wrapping, focus outlines and keyboard controls.
- Slow forward/reverse scroll, fast physical touch flicks, momentum, and continuous Work-to-Life release.
- Opening/tapping both published cards at settled positions; source/target geometry and exact return position; opening between scroll offsets; switching, interrupted close, direct URL refresh and Back/Forward during each lifecycle phase.
- Compare homepage scroll and Work spacer before/during/after cases, height changes, orientation changes and crossing 48rem/64rem. Check that the old trigger/spacer/transforms disappear after layout changes.
- Runtime reduced-motion changes with the page closed and during opening/switching/closing; confirm the existing deferred motion rebuild against immediate media-query CSS changes.
- Desktop horizontal pinning, snapping/cancellation and case behavior. Its animation implementation is unchanged, but browser regression testing is outstanding.

Physical devices are unavailable. Browser emulation cannot establish iOS/Android browser chrome, native touch inertia or safe-area behavior. No merge, deployment, commit or pull request was created.


## Sequence, header clearance and viewport follow-up

Root causes: the first card began at its final position; the compact title ran on an independent toggle-trigger tween; direct scrub followed discrete scroll updates; the incoming offset was measured from the initial small viewport; centering used the full viewport without reserving header space.

- Phone title and all card entrances now share one pinned, reversible timeline. The title retains its line reveal, easing and stagger. All cards start below the visible viewport, including in CSS before GSAP initializes. First-card arrival follows the title. Short 0.12-unit activation intervals replace 0.35-unit pauses. No snap is configured.
- GSAP animates entry, depth and scale custom properties; centralized SCSS composes a single card transform. The entry fraction resolves against dynamic viewport height continuously, avoiding stale pixel offsets, per-frame geometry reads and competition with GSAP transform parsing. The root retains stable small-viewport pin dimensions; viewport changes do not rebuild the timeline just to reposition cards.
- The header's actual identity/utility bounds determine clearance, including its authored margins. ResizeObserver and trigger refresh update this measurement; cleanup disconnects the observer and removes the override. Space above the card reserves the existing maximum three 18px depth offsets, plus the normal spacing/safe-area gap. Height is limited to the remaining visible viewport; horizontal centering is unchanged.
- Rendered timeline updates own activation during scrub catch-up. Opening pauses catch-up without changing the source geometry. Explicit keyboard/direct-case positioning and close restoration settle catch-up immediately before reading target geometry. Desktop scrub/snap behavior is untouched.
- Breakpoint setup recreates the title split with its respective controller; phone splitting avoids automatic replacement of nodes owned by the unified timeline. Locale changes rebuild the coordinated sequence rather than leaving old title targets attached.

Additional automated tests cover the title before any card, first-card midpoint/arrival, full reverse hiding, scrub-driven activation, freezing on open, immediate settling on restoration/keyboard navigation, and the unchanged desktop path through those shared helpers.

Latest browser attempt failed at Chrome acquisition with ScreenCaptureKit error -3811 (audio/video capture failure). No browser pass is claimed for these changes. All browser scenarios listed above remain pending, especially 320/375/430px and short viewports, header clearance, full title-to-Life forward/reverse progression, runtime motion and orientation changes, source geometry/history, and desktop regression checks. Physical iOS/Android toolbar collapse and native flick smoothness cannot be verified in this environment.


## Mobile Life viewport follow-up

Affected files: `src/components/sections/HomeLifeStackExperiment.vue`, `src/assets/styles/sections/_life-stack-experiment.scss`, and `scripts/tests/portfolio-regressions.test.mjs`.

Root cause: compact Life uses native CSS sticky rather than a ScrollTrigger fixed pin. Its stage was deliberately restricted to 100svh (legacy 100vh fallback). GSAP resolved each incoming photo's y offset from that stage's clientHeight during initialization/refresh; neither the stage nor the cached offset followed expanding visible viewport height. There are no visualViewport observers in the existing implementation.

Below the existing 48rem phone breakpoint, with motion enabled, the sticky photo stage now uses the existing `--viewport-height-dynamic` token (100dvh, 100vh fallback). The scroll track, introduction height, photo widths and authored offsets remain unchanged. GSAP animates an entrance fraction and the authored pose through CSS custom properties, as Work does; SCSS resolves the fraction against the current dynamic height. This preserves the established full-viewport offscreen offset while tying it to the live stage, including reverse playback. The photo's entire image/caption figure moves together. No resize/visualViewport listener, refresh loop, new pin, scroll interception or duration change is introduced. Desktop and tablet keep their existing pixel transforms; reduced motion creates no stacking timeline. GSAP matchMedia/context reversion and unmount cleanup remain in place. Work files were not changed for this follow-up.

Verification: typecheck, all 20 automated tests, production build, SEO verification, image verification and `git diff --check` pass. The existing Vite chunk-size warning remains informational. The two additional tests execute the actual Life initialization function with controlled DOM/ScrollTrigger boundaries and installed GSAP; they cover entry progression/reversal, final x/y/rotation, stacking order, duration/rest intervals, scrub, native-sticky configuration, original desktop/tablet transforms and no timeline in reduced motion. They are not viewport/browser tests.

Browser attempt: production preview opened in native Chrome with responsive controls showing 375x667. A console query for stage/viewport geometry remained in the prompt after Return; a subsequent coordinate-focus attempt failed with `noWindowsAvailable`. No successful Life geometry, scroll, console or toolbar verification is claimed. 320px and 430px were not tested; the 375px attempt did not reach a verified Life stack state.

Remaining checks: 320/375/430px including short and landscape viewports; initial visible toolbars, collapse while scrolling down and reappearance scrolling up; forward/reverse photos; no bottom gap; smooth Work-to-Life and Life-to-footer release; orientation/breakpoint changes and desktop/reduced-motion smoke tests. Physical iOS/Android devices are required to establish dvh update behavior during native toolbar animation and any visible movement while the sticky release boundary changes with the visible stage height. Legacy browsers without dvh retain the existing vh fallback limitation.
