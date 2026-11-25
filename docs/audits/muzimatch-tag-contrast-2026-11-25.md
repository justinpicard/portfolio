# MuziMatch tag contrast follow-up — 25 November 2026

## Confirmed issue and scoped fix

The preceding mobile Lighthouse audit reported four MuziMatch tags at approximately **4.16:1** contrast: Side project, Product Design, Nuxt and Redesign coming. Blue text (`#0a15df`) on the purple project surface (`#b0b0fe`) already has sufficient contrast, but the default tag fill darkens that surface with 7% black, reducing contrast to about 4.15:1 mathematically.

A reusable `.tag--light` appearance modifier now uses **15% white** instead. It is applied only when the project slug is `muzimatch`, in the existing homepage card and project navigator renderers. Text color, purple project surface, font size/weight, spacing, radius, layout and interaction behavior are unchanged. Other projects retain the default 7% dark fill. No content flags, runtime color engine, additional performance changes or security-policy changes were introduced.

Changed implementation files:

- `src/assets/styles/components/_tags.scss`: light fill modifier.
- `src/components/work/ProjectCard.vue`: select the modifier for MuziMatch.
- `src/components/work/ProjectStackNavigator.vue`: select the same modifier for MuziMatch previews.

## Contrast measurements

[WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) requires at least **4.5:1** for normal text, including hover/focus presentation. These labels are evaluated against that threshold, without rounding a failing result up to a pass.

Chromium measurements on the clean production build resolve the CSS colors, composite the semi-transparent fill over ancestor backgrounds and apply the WCAG sRGB relative-luminance formula. The measured lower bound is **5.3709:1** (about 5.37:1); direct calculation using the unquantized 15% CSS alpha yields about 5.37:1. The margin is deliberate rather than targeting 4.5 exactly.

| Context | Widths | States | Minimum |
| --- | --- | --- | ---: |
| Homepage card, reduced motion | 390, 412, 767, 768, 1024, 1440px | Default, hover, focus, pressed | 5.37:1 |
| Homepage card, normal motion | 390, 1440px | Default, hover, focus, pressed | 5.37:1 |
| Active navigator preview on the Recranet case background | 390, 1440px | Default, hover, focus | 5.37:1 |

All four tags passed every sampled state. A separate keyboard/pointer probe confirmed actual `:hover`, `:focus-visible` and `:active` states at 390/1440px. The navigator was shuffled until MuziMatch became the active front preview; its opaque project surface preserves the same contrast over the surrounding case background. Existing disabled/rear preview treatment and accessibility attributes were not changed to evade contrast checking.

Other project tags were verified not to receive the new modifier. Mobile and desktop card screenshots were visually inspected: only the pill fill becomes subtly lighter, preserving the blue/purple identity. Measurements are preserved in [muzimatch-tag-contrast-2026-11-25.json](muzimatch-tag-contrast-2026-11-25.json).

## Regression verification

- Typecheck and all **71 existing regression tests** passed.
- A clean full production build passed, including image and static SEO verification.
- `git diff --check` passed.
- Fresh desktop/mobile Lighthouse accessibility checks use headless Chrome without extensions, against the production build served by the isolated local Apache setup from the preceding audit. **Desktop: 100 accessibility; mobile: 100 accessibility (previously 97).** The color-contrast audit passes on both with zero offending nodes. These final audits use the 15% white fill. Raw JSON/HTML reports are available at `/tmp/muzimatch-contrast-{desktop,mobile}.report.{json,html}`.

Verification is local Chromium testing. Firefox/WebKit engines are unavailable in this environment, and these changes have not been deployed. No commits or pushes were made.
