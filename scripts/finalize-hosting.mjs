import { readFile, writeFile, readdir } from 'node:fs/promises'
import { inlineScriptHashes, hostingHeaders } from './hosting-headers.mjs'

async function htmlFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true })
	return (await Promise.all(entries.map(entry => entry.isDirectory()
		? htmlFiles(`${directory}/${entry.name}`)
		: entry.name.endsWith('.html') ? [`${directory}/${entry.name}`] : []))).flat()
}
const hashes = (await Promise.all((await htmlFiles('dist')).map(async file => inlineScriptHashes(await readFile(file, 'utf8'))))).flat()
await writeFile('dist/.htaccess', await readFile('dist/.htaccess', 'utf8') + '\n' + hostingHeaders(hashes))
console.log('Finalized LiteSpeed/Apache cache and security headers with prerendered inline-script hashes.')
