# Temporary mobile scroll diagnostics

This is an isolation tool, not a performance fix. Real iPhone results are still required. Browser smoke checks establish whether the switches and interactions work; they do not establish which group causes phone jank.

## Configuration and activation

Edit the booleans in `src/config/mobileScrollDiagnostics.ts`. All flags initially are `false` (test A). A flag only takes effect when **both** conditions hold:

- The URL contains `?mobileScrollDiagnostics` (or `&mobileScrollDiagnostics` with other parameters).
- The viewport matches the existing compact breakpoint: `max-width: 63.999rem`.

Run `npm run dev -- --host`, then open the **Network** URL printed by Vite on the iPhone, adding `?mobileScrollDiagnostics`. Use the actual printed port: Vite can choose another port if 5173 is occupied. The Mac and phone must be on the same network.

After every configuration edit, **fully reload the page on the phone**. Do not use HMR as the test reset: mounted timelines, font work and initial states need a fresh load. Also reload after changing viewport size across the compact breakpoint. Wait for the normal loading/Hero introduction to finish before scrolling.

Without the query parameter the normal portfolio runs, even with every flag false. At desktop widths the query has no effect. The opt-in works in a production build too; ordinary production URLs are unaffected. For testing a changed production build, upload the complete `dist` output and reload without stale cached assets.

There is no debug UI. To end testing remove the URL parameter; to remove this code later remove the temporary configuration, marked call sites and diagnostic SCSS partial/import. Do not deploy this as a performance fix.

## Flags

| Flag | Behavior omitted when false |
| --- | --- |
| `hero` | Hero indicator velocity ScrollTrigger and its scroll-related pointer-follow setup. The timed loading/Hero intro and normal indicator rotation remain. There is no scrubbed Hero transition in the current implementation. |
| `about` | Both text scrub reveals, SplitText setup and the About navigation-position measurement trigger. Plain copy remains visible. |
| `workTitle` | Work heading SplitText scrub reveal and its navigation-position metadata. The exhibition's heading exit has no split targets when the title reveal is absent. |
| `workPin` | Compact native CSS-sticky Work stage and its exhibition scroll distance. Work becomes a normal vertical list of the same cards. Compact Work does not use GSAP pinning. |
| `projectCards` | Entire coverflow ScrollTrigger/timeline, transforms/shadows, activation updates, snap and card pointer-follow scroll listener. All cards remain actionable in the static gallery. |
| `lifeTitle` | Life copy SplitText/autoSplit and triggered reveal. Plain copy stays visible. |
| `lifePhotos` | Life photo scrub timeline, scroll metadata and CSS-sticky photo composition. The existing figures become a natural-flow gallery rather than an invisible absolute stack. |
| `sectionNavigation` | SectionNavigation position/detection triggers, automatic label changes, SiteNav header-copy scroll reveal and App's scroll-driven scrim class updates/listener/ResizeObserver. Navigation still opens and its links still scroll to sections; the label updates on explicit selection. Compact fine-pointer smoothing is also omitted; touch already uses native scrolling. |
| `footer` | Footer divider reveal trigger and marquee scroll-direction trigger. The divider stays fully visible and the existing time-based marquee keeps running. This extra group keeps the all-off baseline complete without coupling footer behavior to navigation. |

A disabled group does not create its scroll triggers. It is not implemented by pausing initialized timelines. Normal plugin registration, click-triggered navigation, hover interactions, the timed Hero intro and overlay scrolling/open/close are retained. Thus baseline A removes homepage scroll reactions, not all animation/browser work.

## Work dependency and layout limits

The authored coverflow requires the native sticky stage. **`projectCards: true` only takes effect with `workPin: true`.** With `workPin: false`, cards use the usable vertical list even if the card flag is true. The two groups are separated in the useful direction: `workPin: true`, `projectCards: false` tests sticky behavior with no coverflow trigger, scrub, snap or activation callback.

For that sticky-only test the original exhibition scroll range is calculated from its existing rhythm constants, without creating an animation or ScrollTrigger. Cards are static in a horizontally scrollable gallery so every case remains reachable. Its range is recomputed on resize, not on scroll. The normal gallery returns unchanged when both flags are true.

Diagnostic static cards supply their real rectangles to the existing overlay close coordinator. Closing the same case restores its opening position. Closing after project switching targets that project's actual static card; the sticky gallery moves horizontally to it, or the vertical list supplies its document position. No overlay animation or lifecycle code is replaced.

Static Work/Life modes intentionally change their flow and therefore later section positions. Do not compare raw page scrollY or total-page averages between those modes as if geometry were identical. Compare the same visible section/gesture. About can be tested with the complete normal Work/Life composition to avoid this confound.

## Real-device sequence

All rows are cumulative: keep the earlier enabled groups true and all other flags false.

| Test | Enable |
| --- | --- |
| A | Nothing: all flags false |
| B | `hero` |
| C | Add `about` |
| D | Add `workTitle` |
| E | Add `workPin` (native sticky, static horizontal cards) |
| F | Add `projectCards` (normal coverflow, activation and snap) |
| G | Add `lifeTitle` |
| H | Add `lifePhotos` |
| I | Add `sectionNavigation` |
| J | Add `footer`: every flag true |

Also compare J with the same URL **without** the query parameter. Both should feel and behave the same. Run A → J, then repeat the first boundary that becomes worse in alternating order. Test that group alone where possible; for cards alone enable only `workPin` and `projectCards`. To check interactions, start from J and disable one suspected group at a time (except the stated Work dependency).

On the iPhone 14 Pro, use Safari first, then Chrome. Record iOS version, browser, orientation, whether the address bar is changing, gesture phase (drag/momentum), section, enabled flags and perceived difference. Repeat at the same scroll positions and with similarly warm assets. Wait for intro/initial loading each time; do not conclude from one first-load pass.

Check in A, E and J that MuziMatch opens/closes, MuziMatch → SFVonline switching closes toward SFVonline, and section links still work. Capture Safari Web Inspector timelines on the physical phone for the first reproducible regression. Desktop/Chrome emulation is only a functional sanity check.

## Functional verification

Browser smoke checks used the real Vite modules at compact and desktop widths; flag variants were injected only in the temporary test browser. The checked-in flags remain all false. These results are not iPhone performance evidence.

- Compact A: **0 ScrollTriggers**, no smoother, plain About copy, static Work/Life galleries. The per-group checks created only the expected triggers (Hero 1, About 3, Work title 1, Work native sticky 0, cards with sticky 1, Life title 1, Life photos 1, global navigation/header 7).
- Cumulative A–J: **0, 1, 4, 5, 5, 6, 7, 8, 15, 17** triggers. Compact normal mode also has 17.
- Desktop with and without the query retained identical trigger configurations, the Work/Life GSAP pins and ScrollSmoother.
- A, sticky/static-card E and full-animation J: MuziMatch → SFVonline → close completed, document scroll locking was released and focus returned to SFVonline. A's navigation link reached About and retained the explicitly selected label without automatic tracking.
- No runtime exceptions were observed in those checks. `npm run typecheck`, `npm run build` (including image generation and SSG), and `git diff --check` passed.

**Separate existing limitation:** emulating `prefers-reduced-motion: reduce` stalled the timed Hero introduction on both the normal URL and the diagnostic URL: the loading screen was hidden, but the header stayed at opacity 0 and the body retained `overflow: hidden`. This is not caused by a diagnostic-only trigger and has not been changed here. The A–J animated isolation sequence requires the existing no-preference animation path; reduced-motion startup needs separate investigation before testing that path. No physical iPhone reduced-motion behavior has been verified.

## Changed files

Added:

- `src/config/mobileScrollDiagnostics.ts` — one opt-in configuration and group predicate.
- `src/assets/styles/sections/_mobile-scroll-diagnostics.scss` — static diagnostic Work/Life layouts.
- `docs/mobile-scroll-diagnostics.md` — activation, flags, dependency, test sequence and verification.

Diagnostic guards/limited static-card support:

- `src/components/sections/SectionHomeHero.vue`
- `src/components/sections/SectionHomeAbout.vue`
- `src/components/sections/SectionHomeWork.vue`
- `src/components/sections/HomeLifeStackExperiment.vue`
- `src/components/work/ProjectCard.vue`
- `src/components/navigation/SectionNavigation.vue`
- `src/components/SiteNav.vue`
- `src/components/AppFooter.vue`
- `src/App.vue`
- `src/utils/animations/portfolioScrollSmoother.ts`
- `src/assets/styles/sections/_index.scss` — imports the temporary stylesheet.

The already-uncommitted `_global.scss` overlay/sticky correction was left untouched. The existing investigation report/measurements were not changed by this task.
