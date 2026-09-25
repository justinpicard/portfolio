import { readdir, readFile, mkdir, writeFile, rm } from 'node:fs/promises'
import { join, relative, extname } from 'node:path'
import { createHash } from 'node:crypto'
import sharp from 'sharp'

const sourceRoot = 'public/images'
const outputRoot = 'public/generated/images'
const manifestRoot = 'src/generated'
const manifest = {}
const report = []

async function collect(directory) {
	const entries = await readdir(directory, { withFileTypes: true })
	return (await Promise.all(entries.map(entry => entry.isDirectory()
		? collect(join(directory, entry.name))
		: join(directory, entry.name)))).flat()
}

// Only this reproducible output directory is cleared; source assets remain untouched.
await rm(outputRoot, { recursive: true, force: true })
await mkdir(outputRoot, { recursive: true })
await mkdir(manifestRoot, { recursive: true })
for (const path of (await collect(sourceRoot)).sort()) {
	if (!/\.(jpe?g|png)$/i.test(path)) continue
	const input = await readFile(path)
	const url = '/' + relative('public', path).split('\\').join('/')
	if (input.length < 32 * 1024) {
		report.push({ url, originalBytes: input.length, skipped: 'under 32 KiB' })
		continue
	}
	const metadata = await sharp(input).metadata()
	const isPng = extname(path).toLowerCase() === '.png'
	const options = isPng
		? { lossless: true, effort: 6 }
		: { quality: path.includes('/projects/') ? 90 : 85, alphaQuality: 100, effort: 6 }
	const full = await sharp(input).rotate().webp(options).toBuffer({ resolveWithObject: true })
	if (full.data.length > input.length * 0.9 || input.length - full.data.length < 8192) {
		report.push({ url, originalBytes: input.length, skipped: 'less than 10% / 8 KiB saving' })
		continue
	}
	async function emit(result) {
		const hash = createHash('sha256').update(result.data).digest('hex').slice(0, 16)
		const filename = `${hash}.webp`
		await writeFile(join(outputRoot, filename), result.data)
		return { url: `/generated/images/${filename}`, width: result.info.width, height: result.info.height, bytes: result.data.length }
	}
	const optimized = await emit(full)
	const variants = []
	// Two smaller candidates cover mobile and column layouts; retain full resolution for wide/high-DPR screens.
	if (path.includes('/projects/') && optimized.width >= 1600) {
		for (const width of [800, 1200]) {
			if (width >= optimized.width * 0.8) continue
			const variant = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp(options).toBuffer({ resolveWithObject: true })
			if (variant.data.length < full.data.length * 0.85) variants.push(await emit(variant))
		}
	}
	manifest[url] = { ...optimized, variants }
	report.push({ originalUrl: url, originalBytes: input.length, ...optimized, variants, hasAlpha: metadata.hasAlpha })
}
await writeFile(join(manifestRoot, 'image-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
await writeFile(join(manifestRoot, 'image-report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(`Images: ${Object.keys(manifest).length} optimized, ${report.filter(item => item.skipped).length} skipped. See src/generated/image-report.json.`)
