# Case-study spacing

`caseStudy.sections` is ordered after the introduction. It accepts existing story sections and standalone media entries. Every entry needs a unique `id`.

Standalone media uses the existing media renderer and properties (`width`, `align`, `src`, `format`, `alt`, `caption`, `presentation`, `position`). Its optional `spacing` uses `tight`, `default`, or `spacious` and controls the gap after the visual, including its caption. The preceding entry controls the gap before it. Omitted spacing uses `default`.

```ts
sections: [
	{
		id: 'opening-visual',
		type: 'media',
		width: 'full',
		src: 'projects/muzimatch/muzimatch-hero',
		format: 'jpg',
		alt: 'MuziMatch interface',
		presentation: 'natural',
		caption: 'An overview of the interface.',
		spacing: 'spacious'
	},
	{
		id: 'story',
		title: 'A product decision',
		spacing: 'spacious',
		blocks: [
			{
				type: 'text',
				paragraphs: ['The explanation behind this decision.'],
				spacingAfter: 'compact'
			},
			{
				type: 'media',
				width: 'content',
				src: 'projects/muzimatch/muzimatch-hero',
				alt: 'Supporting interface detail',
				presentation: 'natural'
			}
		]
	}
]
```

On direct section blocks, `spacingAfter` controls the gap to the next block:

- `compact`: the existing tight case spacing.
- `default`: the existing default case spacing.
- `spacious`: the existing spacious case spacing.

Omitting it preserves the current section-based spacing. It is ignored on the final block, whose trailing gap always uses section `spacing`. Set it on individual text or media blocks to support multiple text → visual groups. Column and feature interiors retain their existing spacing; the option applies to the whole columns/feature block in the section stack.

All spacing uses the existing responsive tokens. No media width, alignment, crop, caption, or heading rules change.
