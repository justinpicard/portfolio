# Homepage FAQ

Implemented on `feature/faq-section`, directly after Life and before the footer. No commits or pushes.

## Content and rendering

`src/content/en/faq.ts` contains the heading, introduction and five provisional questions/answers. Each question has a stable descriptive ID; editing or reordering content does not change its control/answer IDs. The FAQ follows the existing `HomeContent`, locale override and `usePortfolioContent()` patterns, including English fallback. The section-navigation menu includes `05 Questions` between Life and `06 Say hi`, targeting the existing `#faq` section.

`SectionHomeFaq.vue` renders one independent native button per question. All answers start closed, and a reactive set allows multiple answers to remain open. The entire row is clickable. Numbering and plus/minus strokes are decorative and hidden from assistive technology. Native h2/h3 headings, `aria-expanded`, `aria-controls`, stable IDs, `v-show`, `aria-hidden` and `inert` preserve keyboard and accessibility-tree behavior.

## Presentation and animation

Central styling lives in `src/assets/styles/sections/_faq.scss`, using existing typography, colors, spacing tokens and the editorial section layout. Heading and introduction are centered, with a naturally wrapping 15ch heading using the same responsive size and leading as the Life title, with automatic word breaking on narrow screens and 42ch introduction. The accordion occupies two thirds of the content width at 64rem and above and the full content width below that breakpoint. Questions and answers remain left-aligned; shared number-column and gap tokens align answer text exactly with the question text. There are only subtle dividers, with no cards or backgrounds.

Existing GSAP utilities animate panel height/opacity for 250ms and clear fixed heights after completion, retaining natural responsive heights. Cancelled animations preserve their current height for smooth reversal. Reduced motion skips panel animation, removes icon transitions and settles any active panel tween when the preference changes. GSAP context and motion listeners are cleaned up on unmount. Existing scroll measurements refresh once after completed reflow so footer navigation follows the updated document height; the FAQ does not add scrolling, sticky positioning or pinning.

## Verification

- Typecheck, 73 tests (including two FAQ regression tests), full production build, image verification and SEO verification passed.
- Chromium matrix: 390, 768 and 1440px with normal/reduced motion. Initial closed state, Enter/Space activation, multiple open answers, closing, rapid toggles and a temporarily lengthened question passed. No page errors, duplicate IDs or horizontal overflow were observed.
- The original heading measured two lines and was centered within one pixel; its subsequent size adjustment matches the Life title at 72/128/144px on the tested widths. Answers aligned with question text exactly (0px difference).
- Production accessibility snapshots omitted all collapsed answers and exposed the expanded answer once as a complete paragraph.
- A normal-motion intermediate sample measured 27px against a 104px natural panel height, confirming an actual expansion rather than an instant jump. Reversing mid-animation settled at natural height with no fixed inline height. Switching to reduced motion during collapse settled immediately to a hidden, inert panel.
- Desktop/tablet/mobile screenshots were checked. Browser-only mutations for long-question testing do not affect source content.

These are local Chromium checks, not deployment or manual screenreader listening tests. Firefox/WebKit engine binaries are unavailable in this environment.

A fresh mobile Lighthouse accessibility run on the local production build scored **100**, with no failing binary accessibility audits. The raw report is `/tmp/faq-accessibility.json`. No performance or security changes were made for this section.


## Multiple paragraphs

An answer accepts either a string (existing content remains valid) or an array of strings. Each array entry renders as its own semantic paragraph with `--space-4` between paragraphs; alignment and the body font remain unchanged.

```ts
answer: [
    'First paragraph.',
    'Second paragraph.'
]
```
