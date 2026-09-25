# Image optimization

`npm run build` generates images before Vite builds either bundle. `npm run verify:images` checks emitted files, fallback integrity, dimensions, alpha and visible lossless PNG pixels. Development intentionally serves originals; use `npm run preview` to review WebP output.

Sources remain in `public/images`. Generated images and metadata are ignored by Git. Output names are content hashes. Only PNG/JPEG images inside this directory are candidates, excluding root-level social images and favicons. SVG and video files are untouched.

Files below 32 KiB are skipped. Full-size output must save at least 10% and 8 KiB. PNGs use lossless WebP; JPEGs use quality 90 for projects and 85 elsewhere. No source is overwritten or upscaled. Large project images receive 800px and 1200px alternatives only if each saves at least 15% versus full-size WebP.

Case-study sizes mirror the 48rem column and 64rem width breakpoints, page gutters and weighted column gaps. Full-width hero media uses 100vw. Feature-block internals retain full-resolution WebP until their capped grid has a dedicated sizes calculation. No preload or fetch-priority changes. Intrinsic attributes do not feed the component CSS size variables.

The grid has no maximum desktop width, so full-size variants are retained. The 2500px portrait in the life stack is a further responsive-resizing opportunity; its animated layout is outside this case-study change.

Rebuild after adding or changing images. Deploy originals and generated images together. Long-lived immutable caching is appropriate only for hashed generated URLs; this change does not alter hosting headers.

## Current build inventory

| Original URL | Original KiB | Full WebP KiB | Responsive widths |
|---|---:|---:|---|
| /images/dot-pattern.png | 2.8 | under 32 KiB | — |
| /images/justin-picard-avatar-3.jpg | 91.0 | 25.2 |  |
| /images/justin-picard-hero.jpg | 273.5 | 97.7 |  |
| /images/photos/justin-picard_architecture-berlin.jpg | 109.1 | 42.6 |  |
| /images/photos/justin-picard_architecture-valencia.jpg | 210.1 | 99.8 |  |
| /images/photos/justin-picard_bassist.jpg | 67.3 | 18.8 |  |
| /images/photos/justin-picard_berlin-fernsehturm.jpg | 227.0 | 55.1 |  |
| /images/photos/justin-picard_cats.jpg | 151.2 | 70.5 |  |
| /images/photos/justin-picard_family.jpg | 361.8 | 98.9 |  |
| /images/photos/justin-picard_graffiti.jpg | 187.1 | 88.7 |  |
| /images/photos/justin-picard_madison-square-garden.jpg | 276.2 | 162.9 |  |
| /images/photos/justin-picard_middelburg.jpg | 313.0 | 146.7 |  |
| /images/photos/justin-picard_nancy.jpg | 248.8 | 99.6 |  |
| /images/photos/justin-picard_new-york-art.jpg | 187.4 | 54.6 |  |
| /images/photos/justin-picard_new-york-empire-state-building.jpg | 180.4 | 94.0 |  |
| /images/photos/justin-picard_new-york-selfie.jpg | 201.7 | 111.1 |  |
| /images/photos/justin-picard_oktoberfest.jpg | 248.9 | 127.9 |  |
| /images/photos/justin-picard_paris.jpg | 179.1 | 95.0 |  |
| /images/photos/justin-picard_pasta.jpg | 231.9 | 41.1 |  |
| /images/photos/justin-picard_perfume.jpg | 233.6 | 49.4 |  |
| /images/photos/justin-picard_pintxos-bilbao.jpg | 240.7 | 91.9 |  |
| /images/photos/justin-picard_portrait.jpg | 2144.7 | 206.6 |  |
| /images/photos/justin-picard_spanish.jpg | 272.9 | 55.5 |  |
| /images/photos/justin-picard_star-wars.jpg | 188.9 | 36.6 |  |
| /images/projects/charlie/charlie-thumb-horizontal@2x.jpg | 202.9 | 31.1 |  |
| /images/projects/charlie/charlie-thumb-vertical@2x.jpg | 207.2 | 31.1 |  |
| /images/projects/muzimatch/muzimatch-hero.jpg | 802.5 | 382.7 | 800, 1200 |
| /images/projects/muzimatch/muzimatch-listing-detail-early-version@2x.jpg | 1022.3 | 186.4 | 800, 1200 |
| /images/projects/muzimatch/muzimatch-listings-overview-early-version@2x.jpg | 952.0 | 162.7 | 800, 1200 |
| /images/projects/muzimatch/muzimatch-redesign-opening-visual.jpg | 385.5 | 154.6 | 800, 1200 |
| /images/projects/muzimatch/muzimatch-thumb-horizontal@2x.jpg | 306.9 | 57.7 |  |
| /images/projects/muzimatch/muzimatch-thumb-vertical@2x.jpg | 331.9 | 62.9 |  |
| /images/projects/muzimatch/muzimatch_oproepen-demos.png | 94.2 | 64.0 |  |
| /images/projects/muzimatch/muzimatch_oproepen-demos@2x.jpg | 776.1 | 118.4 | 800, 1200 |
| /images/projects/muzimatch/muzimatch_oproepen.png | 206.3 | 122.0 |  |
| /images/projects/recranet/recranet-hero.jpg | 2174.2 | 487.3 | 800, 1200 |
| /images/projects/recranet/recranet-thumb-horizontal.jpg | 232.4 | 54.0 |  |
| /images/projects/recranet/recranet-thumb-vertical.jpg | 172.8 | 40.8 |  |
| /images/projects/recranet/recranet-thumb-vertical@2x.jpg | 362.0 | 89.6 |  |
| /images/projects/recranet/recranet.jpg | 468.2 | 48.2 |  |
| /images/projects/recranet/vodatent.jpg | 1142.9 | 217.8 |  |
| /images/projects/sfvonline/sfvonline-thumb-vertical@2x.jpg | 219.1 | 41.8 |  |
| /images/projects/sfvonline/sfvonline.jpg | 630.2 | 192.5 |  |
| /images/projects/undrift/undrift-thumb-horizontal@2x.jpg | 273.2 | 42.5 |  |
| /images/projects/undrift/undrift-thumb-vertical@2x.jpg | 281.3 | 46.3 |  |
