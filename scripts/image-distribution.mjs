import { readdir, readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

export function imageDistribution() {
	const root = resolve('assets/source-images')
	return {
		name: 'image-distribution',
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				if (!req.url?.startsWith('/images/')) return next()
				let file
				try { file = resolve(root, decodeURIComponent(req.url.split('?')[0].slice('/images/'.length))) } catch { return next() }
				if (!file.startsWith(root + sep) || !/\.(png|jpe?g)$/i.test(file)) return next()
				try {
					const data = await readFile(file)
					res.setHeader('Content-Type', file.endsWith('.png') ? 'image/png' : 'image/jpeg')
					res.end(req.method === 'HEAD' ? undefined : data)
				} catch (error) {
					if (error.code === 'ENOENT') return next()
					next(error)
				}
			})
		},
		async writeBundle(options) {
			// Vite copies public files outside the module graph, including OS metadata.
			const { rm } = await import('node:fs/promises')
			async function clean(directory) {
				for (const entry of await readdir(directory, { withFileTypes: true })) {
					const file = resolve(directory, entry.name)
					if (entry.name === '.DS_Store') await rm(file)
					else if (entry.isDirectory()) await clean(file)
				}
			}
			await clean(options.dir ?? 'dist')
		}
	}
}
