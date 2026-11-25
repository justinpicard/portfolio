import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import sharp from 'sharp'

const verifier = fileURLToPath(new URL('../verify-images.mjs', import.meta.url))

for (const scenario of ['manifest', 'generated', 'public']) {
	test(`production verification rejects a missing ${scenario} asset`, async () => {
		const directory = await mkdtemp(join(tmpdir(), 'portfolio-images-'))
		try {
			for (const path of ['src/generated', 'assets/source-images', 'public', 'dist']) {
				await mkdir(join(directory, path), { recursive: true })
			}
			const png = await sharp({ create: { width: 1, height: 1, channels: 4, background: '#fff' } }).png().toBuffer()
			await writeFile(join(directory, 'assets/source-images/fixture.png'), png)
			const dimensions = scenario === 'public' ? {} : { '/images/fixture.png': { width: 1, height: 1 } }
			const unoptimized = scenario === 'generated'
				? { '/images/fixture.png': { url: '/generated/images/fixture.png', reason: 'under 32 KiB' } }
				: {}
			for (const [name, data] of Object.entries({
				'image-dimensions': dimensions,
				'image-manifest': {},
				'image-unoptimized': unoptimized
			})) await writeFile(join(directory, `src/generated/${name}.json`), JSON.stringify(data))
			await mkdir(join(directory, 'scripts'))
			await writeFile(join(directory, 'scripts/image-exclusions.json'), '[]')
			if (scenario === 'public') await writeFile(join(directory, 'public/social.png'), png)
			const result = spawnSync(process.execPath, [verifier], { cwd: directory, encoding: 'utf8' })
			assert.notEqual(result.status, 0)
			assert.match(result.stderr, scenario === 'manifest'
				? /Missing distribution manifest entry: \/images\/fixture.png/
				: /Missing required distribution asset: dist\//)
		} finally {
			await rm(directory, { recursive: true, force: true })
		}
	})
}
