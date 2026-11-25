# Image source and distribution workflow

For the subsequent removal of unused originals, see [image-asset-cleanup.md](image-asset-cleanup.md).

Raster originals live in `assets/source-images`, keeping their paths relative to the old `public/images` directory. Content continues to use the same extensionless `/images` keys. Originals are source files, not production URLs.

- `npm run dev` generates intrinsic dimensions only. The Vite development middleware serves originals at the existing `/images/...` URLs. It is not registered with the preview or production server.
- `npm run build` regenerates output, builds the site, and runs image and SEO verification. Vite clears `dist`; generation clears `public/generated/images`.
- Compression, orientation handling, alpha preservation, full-resolution output, responsive widths and candidate selection are unchanged.
- `image-manifest.json` retains its existing structure. `image-unoptimized.json` separately records deliberately skipped images, their generated distribution URL, dimensions and skip reason. Currently these are two small MuziMatch PNGs. A missing entry is an error, not permission to use a source URL.
- `BaseImage` uses the generated full-resolution URL for `img.src`, preserving the existing WebP `source`, `srcset`, `sizes`, intrinsic dimensions and loading attributes. Video posters use the same resolver. Browsers without WebP support are no longer supported.
- CSS pattern, social image, favicon, SVGs, videos and PDF remain public assets. `.DS_Store` is removed from build output.

`scripts/image-exclusions.json` supports explicitly archived images whose repository references have been checked, including case data used indirectly by media groups, carousels and project thumbnails. The source cleanup removed confirmed unused files, so this list is currently empty. Any excluded originals retained in the source directory remain available in development. Generation rejects renewed literal references to an excluded image. It also checks complete `/images/...` and `projects/...` references in source before generation. If future code constructs image names from fragments rather than storing complete stems, extend the inventory validation alongside that code. The runtime resolver also rejects missing production entries.

Verification checks all non-excluded dimension entries have an explicit distribution entry, all public assets are copied byte-for-byte, generated metadata and PNG pixels remain correct, output has no unexpected raster originals or orphan generated images, and prerendered HTML/SEO asset references resolve. Use `npm run build` for release builds so these checks cannot be skipped.

## Validation

The clean build measured 60,435,764 bytes (60.44 MB), compared with the requested 140.04 MB baseline: 79.60 MB / 56.84% saved. All 75 moved originals were compared byte-for-byte with Git HEAD. No image URL redirects were introduced because there is no evidence of external dependencies requiring them.

Missing manifest entries, generated files and required public assets were injected temporarily; verification failed in each case and the fixtures were restored. Unit tests cover missing source references, exclusion reuse, development serving and path traversal rejection.

Chromium checks passed for Recranet, MuziMatch and SFVonline at 390px/DPR 2, 768px/DPR 1 and 1440px/DPR 2. All case images decoded, the small PNG exceptions loaded, the WebP poster returned HTTP 200, carousel navigation and overlay opening/closing worked, and no horizontal page overflow or JavaScript errors were observed. Desktop overlap/transparency and mobile stacking were visually checked; the mobile screenshot used reduced motion. Development was also checked with generated files and optimization manifests temporarily absent and restored afterward. The original hero loaded successfully and dimensions-only generation did not create optimized output.

Cross-browser Safari/Firefox and deployment-server checks remain outstanding. Existing GSAP target warnings and the existing Vite JavaScript chunk-size warning are outside this distribution change.

The final suite contains 67 passing tests. Live case switching, desktop-to-mobile resizing and closing with Escape also passed. Production requests to old source-image URLs returned the preview HTML fallback rather than image bytes; the social image, favicon, CSS pattern and PDF returned their expected content types.
