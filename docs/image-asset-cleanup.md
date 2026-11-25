# Image asset cleanup

Branch: `chore/cleanup-image-assets`. No commits or pushes. The preceding image distribution changes were already uncommitted and are retained as the base for this cleanup.

## Removed sources

All 20 audit candidates had no remaining runtime references. Checks included Vue components, EN/NL content, project media configuration, group/carousel items, CSS, metadata, scripts and generated manifests. Media renderers consume complete stems from configuration; no directory discovery or filename construction selects these archived files. The old exclusion manifest was their only configuration reference; it is now empty.

| Removed source under `assets/source-images/` | Bytes |
| --- | ---: |
| `photos/_justin-picard_bassist.jpg` | 68,926 |
| `photos/justin-picard_architecture-berlin.jpg` | 111,704 |
| `photos/justin-picard_architecture-valencia.jpg` | 215,166 |
| `photos/justin-picard_family.jpg` | 370,508 |
| `photos/justin-picard_graffiti.jpg` | 191,570 |
| `photos/justin-picard_new-york-art.jpg` | 191,847 |
| `photos/justin-picard_paris.jpg` | 183,387 |
| `photos/justin-picard_pasta.jpg` | 237,484 |
| `photos/justin-picard_perfume.jpg` | 239,164 |
| `photos/justin-picard_portrait.jpg` | 2,196,194 |
| `photos/justin-picard_star-wars.jpg` | 193,426 |
| `projects/muzimatch/muzimatch-listing-detail-early-version-abstract@2x.jpg` | 1,046,831 |
| `projects/muzimatch/muzimatch-listings-overview-early-version-abstract@2x.jpg` | 974,859 |
| `projects/muzimatch/muzimatch-redesign-opening-visual@2x.jpg` | 2,542,447 |
| `projects/muzimatch/muzimatch_oproepen-demos.png` | 96,434 |
| `projects/muzimatch/muzimatch_oproepen-demos@2x.jpg` | 839,048 |
| `projects/muzimatch/muzimatch_statistics@2x.jpg` | 917,778 |
| `projects/recranet/recranet-thumb-vertical.jpg` | 176,975 |
| `projects/recranet/recranet-thumb-vertical@2x.jpg` | 370,687 |
| `projects/sfvonline/sfvonline_screens@2x.jpg` | 1,164,761 |
| `photos/justin-picard_bassist.png` | 6,813,254 |
| `projects/sfvonline/sfvonline.jpg` | 645,367 |

Removed source bytes: **19,787,817** (19.79 MB), out of 76,178,204 bytes of source images before cleanup. This reduces the working source collection by **25.98%**; Git history is not rewritten and its historical objects do not shrink.

## Confirmed duplicate

`projects/muzimatch/muzimatch_oproepen-demos@2x.jpg` was identical to the retained canonical `projects/muzimatch/muzimatch_listings-demos@2x.jpg` by both file SHA-256 and orientation-normalized RGBA pixel comparison.

- File SHA-256: `38582d69ad12bd3bd4f84eddcebaf6a66bb4f3eec2c33b56f74b81b774df7a84`
- Pixel hash (includes dimensions): `ac5bbf8d68ce6e23c145d925085d84d1c90d4a2fd18dfa2eb5181ec63e495289`

The active MuziMatch case already references the canonical file. Removing the alias only required removing its exclusion entry; no live content references needed changing. No other exact file or decoded-pixel duplicates were found among the original 75 source images.

## Retained dependencies

Charlie and Undrift have four source images still used by visible homepage cards and project navigation, despite their cases being unavailable. Following the user’s clarification, both directories and their generated variants remain. Project content, visibility and media references are unchanged. None of the 20 original candidates remained uncertain after reference tracing.

## Distribution impact

The original 20 candidates were already excluded from production. Two additional sources were confirmed unused by tracing complete stems and selected formats: `photos/justin-picard_bassist.png` (Life uses the JPEG with the same stem, without a PNG format override) and `projects/sfvonline/sfvonline.jpg` (current case data uses the separate screens, hero and thumbnail). Neither source is an input to generating another source file. Removing these two also removes eight unused WebP outputs totalling **7,951,772 bytes**. All other generated image bytes were verified identical to the pre-cleanup output. Optimization settings, responsive widths and fallback behavior are unchanged.

The avatar source and SiteNav reference were concurrently renamed by the user during cleanup. That edit is preserved, and final generation uses the current filename. It is separate from the cleanup deletion list.

## Verification results

- Clean `npm run build` passed, including image and static SEO verification.
- `npm run typecheck`, all 67 existing tests and `git diff --check` passed.
- Source collection: **53 files / 56,390,387 bytes**, down from 75 files / 76,178,204 bytes.
- Production build: **52,481,517 bytes (52.48 MB)**, down from 60,435,764 bytes: **7,954,247 bytes / 13.16% saved**.
- Exactly eight unused generated files were removed; all **184 remaining generated files** match the pre-cleanup SHA-256 hashes. The canonical duplicate's outputs and the Charlie/Undrift outputs are retained.
- The exclusion list is now empty, and generated manifests contain only the remaining 53 sources (51 optimized, two intentionally unoptimized).

No optimization policy, compression settings, responsive widths, fallback behavior, project visibility or project copy were changed by this cleanup.

Chromium checks at 390px and 1440px, both DPR 2, passed for homepage images and all three published cases. All case images decoded (MuziMatch 15, Recranet 25, SFVonline 6), carousel navigation and normal overlay opening/closing worked, and no horizontal page overflow or page errors occurred. These counts include project-navigation images retained for the inactive projects.

One initial test incorrectly assumed five homepage cards were rendered simultaneously; the existing stack renders three. That test was corrected. A separate fast reduced-motion/Escape close check timed out after the URL cleared; normal-motion checks using the explicit close button passed at both widths. No animation code was changed or diagnosis attributed to asset deletion. Reduced-motion closing and Safari/Firefox remain follow-up browser checks.
