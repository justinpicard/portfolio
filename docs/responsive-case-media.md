# Case media

Existing `presentation`, `position`, `width`, `align`, `fullBleed`, captions and loading defaults remain supported. Natural proportions remain the default. Ratio presets deliberately crop with `cover`; `appearance.crop` takes precedence. Set `crop: null` to restore natural proportions, including in a mobile override.

## Single image

```ts
{
  type: 'media',
  width: 'content',
  src: 'projects/example/interface',
  format: 'png',
  alt: 'Booking interface',
  appearance: {
    radius: 'none',
    background: 'transparent',
    padding: 'medium',
    maxWidth: '60rem',
    align: 'end',
    crop: { ratio: '16 / 9', fit: 'contain', position: 'center top' },
    belowMd: { padding: 'none', maxWidth: '100%', crop: null }
  }
}
```

Omit `crop` for natural height. Radius supports `none`, `default` (the existing responsive radius), and existing `sm`, `md`, `lg`, `xl`, `2xl` tokens. Padding and gaps use `none`, `small` (space-4), `medium` (space-8), `large` (space-12). Outer block alignment is separate from `appearance.align`, which aligns the capped image inside its frame. Background and padding belong to the frame; captions remain outside it.

Use CSS lengths such as `24rem`, numeric percentages, or `none` for `maxWidth`. Numeric percentages are converted to slot-relative lengths for HTML `sizes`.

## Device compositions

```ts
{
  type: 'media-group',
  width: 'full',
  layout: 'overlap',
  gap: 'medium',
  verticalAlign: 'end',
  items: [
    {
      type: 'media',
      src: 'projects/recranet/recranet-book-on-map-desktop@2x',
      format: 'png',
      alt: 'Book on Map on desktop',
      width: 84,
      align: 'start',
      appearance: { radius: 'none' }
    },
    {
      type: 'media',
      src: 'projects/recranet/recranet-book-on-map-mobile@2x',
      format: 'png',
      alt: 'Book on Map on mobile',
      width: 26,
      align: 'end',
      offsetBlock: 'large',
      appearance: { radius: 'none', maxWidth: '24rem' },
      belowMd: { width: 100, align: 'center', offsetBlock: 'none' }
    }
  ]
}
```

`row` normalizes item widths as column weights and subtracts gaps. `grid` provides two equal columns in reading order. `stack` uses item widths as percentages. `overlap` accepts exactly two images sharing a grid cell; percentages and start/center/end alignment position them horizontally, and a non-negative spacing-token offset positions them vertically. Both images contribute to height. The later item paints in front. Widths are clamped to 1–100.

All layouts stack below 48rem. Mobile widths default to 100%, alignment to center and vertical offsets to zero. Image maximum widths still apply. Each item can override these defaults using `belowMd`; its image treatment can independently override settings with `appearance.belowMd`.

Groups default to vertically centred images; the existing `verticalAlign` setting can override this. Device compositions in Recranet and MuziMatch use the existing overlap layout with 84%/26% widths and still stack below 48rem.

Group `appearance` supports radius, background, padding and mobile overrides. Group surfaces do not clip images. Use individual image radius settings when clipping source corners is intentional. Baked-in transparent asset margins remain part of the intrinsic image bounds.

The renderer reuses CaseMediaBlock and BaseImage. No duplicate breakpoint assets, animation, conditional mounting or optimization-pipeline changes are introduced. `sizes` accounts for group weights, padding, gaps, image caps and mobile widths. Intrinsic dimensions, lazy loading and generated WebP selection remain in BaseImage.

Keep composition geometry on the group/item wrappers if media animations are added later. Do not animate the same properties used for layout; use the existing GSAP context lifecycle and the overlay's scrolling element.

## Validation (2026-11-20)

- Typecheck, production build, image verification and all 56 regression tests passed.
- Chromium checks at 390, 767, 768, 1023, 1024 and 1440px covered natural images, square crops, explicit contain crops, mobile crop removal, row/stack/overlap, independent heights, transparent PNGs and generated WebP.
- Production Book-on-Map checks confirmed intrinsic dimensions, lazy loading, responsive sources, bounded composition heights and no horizontal overflow or collision with the next section. Screenshots reviewed at 390, 768 and 1440px.
- Existing MuziMatch media retained natural and 6:5 ratios, rounded corners and captions at all six widths. Normal-motion case opening, switching to SFVonline, resizing, Escape closing and keyboard focus containment passed.
- Reduced-motion opening and static media work. Closing leaves an invisible dialog mounted after the URL clears. This also reproduces against unchanged HEAD in both development and production; no overlay changes were made in this media task.
- Safari, Firefox and physical touch-device checks remain outstanding. Existing GSAP empty-target warnings and the build's chunk-size advisory remain outside this change.

## Caption with a link

Single images, media groups and columns accept either the existing plain-text caption or:

```ts
caption: {
  text: 'Bekijk het resultaat op',
  link: { label: 'Recranet', href: 'https://recranet.com' }
}
```

The link follows the text and uses the global keyboard focus style and existing stagger-link animation. Optional `link.target` and `link.rel` are passed to the anchor. Links open in the current tab unless a target is supplied; `_blank` defaults to `noopener noreferrer` when rel is omitted. HTTP(S) links to another origin receive an aria-hidden ↗ indicator. Caption content is rendered as text, without HTML interpolation.

Caption `text` is optional; omit it to display only the link.

```ts
caption: {
  link: {
    label: 'Bekijk Recranet',
    href: 'https://recranet.com',
    target: '_blank',
    rel: 'noopener noreferrer'
  }
}
```

## Carousel

```ts
{
  type: 'media-carousel',
  width: 'content',
  label: 'Client websites',
  slides: [
    { type: 'media', src: 'projects/example/screenshot', alt: 'Client website' },
    {
      type: 'media-group',
      layout: 'row',
      verticalAlign: 'center',
      items: [/* existing desktop/mobile media items */],
      caption: { link: { label: 'Client', href: 'https://example.com' } }
    }
  ]
}
```

Slides reuse the single-image/group configuration, including captions and appearance. The carousel's configured slide width supplies the image slot hints; individual image caps still belong in appearance. Nested carousels are not supported. Captions remain inside their slides; previous/counter/next controls are outside, below the entire viewport.

Slides sit side by side in a shared grid row, reserving the tallest slide's natural height including captions. The current slide is centred at its configured width (75% for content on desktop); adjacent slides continue outside the viewport without shrinking the images. Inactive slides and wraparound guards remain visible at 50% opacity where they intersect the viewport, but are aria-hidden and inert. Two guard slides at each end allow seamless wrapping; they reuse the same source URLs. Image sources and lazy loading remain managed by BaseImage. Native image dimensions must be regenerated after changing assets, as for other case media.

The track follows touch and primary-button mouse movement directly, including opacity blending. On release, deliberate horizontal movement snaps to the next/previous slide (24px for mouse, 48px for touch); shorter drags snap back. Snap settling uses the existing fast duration (0.3s), while button navigation retains 0.7s. Movement is limited to one slide per drag, with infinite looping in either direction. Mouse drags capture the pointer, suppress native image dragging and show grab/grabbing cursors. Vertical/diagonal gestures and gestures starting on links/buttons leave normal scrolling and activation alone. There is no autoplay, drag transform or scroll interception. A 0.7s horizontal GSAP transition uses the shared inOut easing (power2.inOut), with incoming/outgoing opacity animated alongside the horizontal movement and respects reduced motion, cleans up its context on unmount and settles immediately when motion preference changes. Controls are round 48px buttons styled like the project close icon, with localized accessible labels; the counter announces the current slide.

Client websites uses the authored slide assets, captions and URLs in recranet.ts. Rebuild after adding new images to regenerate their intrinsic dimensions and optimized variants.

### Carousel validation (2026-11-21)

Typecheck, 58 regression tests, production build and image verification passed. Chromium checks covered 390, 767, 768, 1023, 1024 and 1440px; centred slides kept their previous width, adjacent slides were clipped only at the viewport edge, and 48px round controls stayed below captions. Mixed single-image/group slides retained a stable height before and after image decoding. Native touch swipes changed slides while vertical touch gestures still scrolled the page. Keyboard navigation, infinite wrap in both directions, one/two-slide cases, inert neighbouring slides, reduced-motion changes during a transition and unmount during animation were checked.

The final transition uses power2.inOut for 0.7s. A measurement 250ms into the transition confirmed both outgoing and incoming opacity were between 50% and 100%, with correct normalization after wrapping. Desktop device groups overlap and are vertically centred; mobile groups stack. Safari, Firefox and physical-device testing remain outstanding. The previously documented reduced-motion overlay-close issue remains unchanged.

The current slide number rolls per character using staggerLinkPreset, starting alongside the slide transition. Drag snaps use the same short duration for the counter; the total stays static. Reduced motion skips the number animation, including when the preference changes mid-transition.

## Static three-image composition

```ts
{
  type: 'media-group',
  layout: 'three-up',
  width: 'narrow',
  items: [firstImage, middleImage, lastImage],
  caption: 'One caption for the complete group'
}
```

The schema requires exactly three items. At 48rem and above, three equally sized columns using the existing block width presets: narrow = 50%, content = 75% (default), full = 100% are centred together so the middle image is centred in the viewport and the outside images are clipped at the viewport edges. The group spans the viewport while its width setting controls each individual image, keeping the middle one centred. It has no interaction, opacity changes, scaling, perspective or animations. All three images remain accessible and retain natural proportions and lazy loading through CaseMediaBlock/BaseImage.

Below 48rem, the existing group layout stacks the items in source order with page gutters. Existing group gap, image appearance, responsive overrides and caption settings still apply. Individual item weights do not change the equal desktop columns; image caps belong in appearance. The caption sits outside the clipping composition.

SFVonline uses zero extra group gap because its three supplied PNGs already include matching transparent margins and rounded device frames. Their source corners are preserved with radius: 'none'. Other three-up groups can use the standard spacing tokens for additional gaps.

Three-up validation (2026-11-23): production Chromium checks passed at 390, 767, 768, 1023, 1024, 1440 and 1920px for equal widths, viewport centring, edge clipping, intrinsic ratios, stacking, one caption and no page overflow. Screenshots reviewed at 390, 768 and 1440px. Typecheck, 59 regression tests, production build and image verification passed. Safari, Firefox and physical-device checks remain outstanding.
