# Overlay regression and Lighthouse follow-up — 25 November 2026

The mobile tag-contrast finding recorded in this audit was subsequently resolved; see [MuziMatch tag contrast follow-up](muzimatch-tag-contrast-2026-11-25.md). The measurements below remain the historical pre-fix results.

No commits, pushes or deployment were performed. Overlay investigation and its first verification ran on `chore/cleanup-image-assets`; after that verification the working changes were carried into the new `fix/lighthouse-audit` branch. No temporary third-party dependency was added to the project.

## Overlay: confirmed pre-existing bug, fixed

The production build reproduced the reduced-motion/Escape failure: the URL cleared and the surface became invisible, but the dialog stayed mounted, the app remained inert and root scrolling stayed locked. This is not an image-cleanup regression or merely a flaky test. `playTimeline()` already had the same callback-only implementation at commit `9a61e35`, before image distribution changes.

A real GSAP timeline with duration zero rendered its final values without firing the callback installed by `playTimeline()`. `finishClose()` awaited it indefinitely. The existing helper now renders zero-duration timelines to completion and explicitly settles its Promise; ordinary timing and interruption handling are unchanged. No animation duration, easing, transition design or global scroll architecture changed.

Two regression tests execute the component's actual helper with real GSAP: zero-duration completion, and normal completion/interruption. The suite now has 71 passing tests, including existing transition, focus and scroll transaction tests.

Chromium verification before Lighthouse changes covered eight combinations: 390/1440px, normal/reduced motion, Escape/close button. Every case restored focus to the project card, preserved the exact opening scroll position, removed the overlay, restored `inert=false` and cleared the root scroll lock. Tab focus stayed inside the open dialog. The production build under the new security policy also passed the four desktop motion/dismissal combinations.

## Split-text accessibility

SplitText's default automatic accessibility mode adds `aria-label` to its target and hides the split children. The reported generic role spans and paragraph targets prohibit such naming. See [GSAP's SplitText accessibility guidance](https://gsap.com/docs/v3/Plugins/SplitText/).

The visible role text is now an `aria-hidden` animation target with `aria: 'none'`, alongside an unsplit `.sr-only` copy. About and Life retain their visual paragraphs and existing animation refs; those visuals are hidden from assistive technology and their adjacent screenreader-only paragraphs provide the complete text. Their copies follow the visual paragraph so the existing global `p + p` margin does not alter visible spacing. Native paragraph semantics and the existing typography remain intact. The SiteNav name also disables automatic split naming; the existing home link supplies its accessible name.

The Chromium accessibility tree contained exactly one complete StaticText node for each About/Life paragraph at 390/1440px under both motion preferences. No target retained a prohibited `aria-label`, including after resizing to 768/1024px. Visible paragraph top margins remained 0px and there was no horizontal page overflow. This checks browser accessibility semantics, not a manual VoiceOver/NVDA listening session.

## Hosting, caching and security

Read-only live requests confirmed `https://justinpicard.nl/` is served by **LiteSpeed**. HTTP redirects to HTTPS. The deployed hashed JS, favicon and original JPEG responses used `Cache-Control: public, max-age=604800`; the HTML response had no explicit cache header. The reviewed security headers were absent. The local changes have **not** altered those deployed responses.

The existing build already emits Apache/LiteSpeed `.htaccess` redirects. A final build step now reads the final prerendered HTML and appends cache/security rules to that generated file. This happens after ViteSSG so CSP hashes match the exact inline reload handler and JSON-LD bytes, including all prerendered pages.

| Resource | New policy |
| --- | --- |
| `/assets/` Vite-hashed JS/CSS/WOFF2 and `/generated/images/` content-hashed WebP/PNG/JPEG | `public, max-age=31536000, immutable` |
| HTML, including directory index requests | `no-cache` |
| Fixed URLs: social image, favicon, SVG, videos, PDF and other non-versioned files | `public, max-age=0, must-revalidate` |

Matching is restricted to generated directories and the actual build filename formats; an arbitrary fixed file elsewhere with a hash-looking name is not treated as immutable. The existing image strategy, variants, compression, lazy loading and priorities are unchanged.

Headers added:

- CSP: same-origin resources and script files, exact inline-script hashes, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'self'`. No script `unsafe-inline` or `unsafe-eval`. Inline styles remain allowed because Vue/GSAP and the media presentation API update styles dynamically. There are no existing remote script/font/API integrations requiring extra origins.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- `Cross-Origin-Opener-Policy: same-origin`. No current `window.opener`, popup messaging or OAuth/payment integration depends on a cross-origin opener. Ordinary external links remain allowed. Future opener-dependent integrations should revisit this choice.
- HSTS: host-only `max-age=31536000`. HTTPS is already live; `includeSubDomains` and preload remain deliberately absent pending review of every subdomain and TLS operations. Browsers ignore HSTS delivered over HTTP; the effective deployed policy must be validated over HTTPS. No preload submission was made.

Trusted Types enforcement was tested in an isolated browser response with the Vue policy allowed. Initial loading can work, but resizing caused four real `TrustedHTML` assignment errors from split-text reversion (`SplitText` writes stored strings to `innerHTML`). A direct sink probe also failed as expected. Enforcement is therefore **not enabled**. A broad identity/default policy would defeat the intended protection and was not introduced. Revisit when the animation library supports safe TrustedHTML reversion, rather than wrapping all HTML assignment or refactoring unrelated animation code. See [Trusted Types enforcement](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for).

The CSP was actively verified to block an unauthorized inline script. Normal app loading, responsive rebuilding and overlay dismissal produced no CSP/page errors. An isolated local Apache instance served the actual `dist/.htaccess`; HTML, JS, CSS, generated WebP, favicon, social PNG and PDF returned the intended cache headers. Local compression was enabled to approximate the existing static host. This is not a LiteSpeed production deployment test. [LiteSpeed header configuration](https://docs.litespeedtech.com/lsws/security-headers/) and [Apache mod_headers](https://httpd.apache.org/docs/current/mod/mod_headers.html) describe the hosting mechanism.

## Lighthouse results

Fresh Lighthouse **13.6.0** runs used the clean production build on `http://127.0.0.1:8181/`, a temporary headless Chrome profile and `--disable-extensions`. Desktop used the desktop preset; mobile used the default mobile emulation/throttling. Runs were sequential, after other test browsers closed. Results are local lab measurements, not field data or proof of a deployed improvement. The supplied earlier baseline has a different hosting/run environment, so small timing differences are not causally attributed to this patch.

| Metric | Supplied desktop baseline | Local desktop | Local mobile |
| --- | ---: | ---: | ---: |
| Performance | 100 | 100 | 91 |
| Accessibility | Not supplied | 100 | 97 |
| Best practices | Not supplied | 100 | 100 |
| SEO | Not supplied | 100 | 100 |
| FCP | 468 ms | 448 ms | 910 ms |
| LCP | 588 ms | 448 ms | 3494 ms |
| TBT | 0 ms | 0 ms | 28 ms |
| CLS | 0 | 0.000053 | 0 |
| Transfer | 450.3 KB | 405,227 bytes | 470,544 bytes |
| First-party requests | 11 | 10 | 11 |

`aria-prohibited-attr` passes with no offending nodes on desktop and mobile. Mobile's remaining accessibility finding is unchanged MuziMatch tag styling: small blue text on the darkened purple card background, measured 4.16:1 against a 4.5:1 requirement. The tag stylesheet, colors and card palette are untouched; no earlier mobile score was supplied. This is a separate observed accessibility follow-up, not fixed by unrelated palette/CSS edits here. Mobile LCP likewise remains a measured follow-up; no unrelated JS/CSS/image optimization was attempted.

Security diagnostics still recommend HSTS subdomain/preload coverage and Trusted Types; these were intentionally not enabled just for a score. Lighthouse's suggestion to add legacy script `unsafe-inline` was also declined. Missing public source maps remain unchanged by request. A back/forward-cache diagnostic reported a non-actionable internal browser error (`IgnoreEventAndEvict`), not a demonstrated application regression.

Raw reports remain at `/tmp/portfolio-lighthouse-{desktop,mobile}.report.{json,html}`. Compact metrics and runtime metadata are preserved in [lighthouse-2026-11-25.json](lighthouse-2026-11-25.json).

## Verification and deployment checklist

Passed: clean full build; typecheck; 71 tests; `verify:images`; `verify:seo`; `git diff --check`; exact inline hash coverage; header tests for positive and negative cache paths; browser accessibility-tree and responsive checks; normal/reduced overlay dismissal, focus, scroll and cleanup checks.

Firefox and WebKit were attempted but their Playwright engine binaries are not installed. Chromium was tested. Physical-device and manual screenreader testing remain available follow-ups.

After an explicitly authorized deployment:

1. Upload the complete matching `dist`, **including hidden `.htaccess`**, using the normal release process. Do not independently deploy HTML and CSP hashes from different builds. Disable hosting transformations that rewrite inline script text, or regenerate the policy for the final served bytes.
2. Verify HTTPS document, error-page and asset headers on LiteSpeed. Confirm `mod_headers`/`.htaccess` overrides are honored, no duplicate contradictory cache headers remain, and hashed URLs get immutable caching while fixed URLs revalidate. Hosting-panel/server rules may need adjustment if they override these directives.
3. Verify HSTS over HTTPS and stable certificate renewal before considering subdomains or preload. Check CSP console, images, video, external links, PDF, captions, carousel, keyboard focus and both motion preferences on the deployed site.
4. Run fresh production Lighthouse and cross-browser/manual AT checks. Local Apache results do not replace production validation.

Final mobile integration checks under the generated CSP also passed in normal and reduced motion: Recranet images loaded, the carousel advanced, switching to SFVonline completed and Escape dismissed the overlay without page errors. No JavaScript/CSS/image optimizations or palette changes were made to chase remaining Lighthouse diagnostics.
