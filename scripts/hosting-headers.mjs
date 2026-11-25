import { createHash } from 'node:crypto'

export function inlineScriptHashes(html) {
	return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
		.filter(([, attributes, source]) => !/\bsrc\s*=/.test(attributes) && source.trim())
		.map(([, , source]) => `'sha256-${createHash('sha256').update(source).digest('base64')}'`)
}

export function hostingHeaders(hashes) {
	const csp = [
		"default-src 'self'", `script-src 'self' ${[...new Set(hashes)].join(' ')}`,
		// GSAP and Vue update inline style attributes; inline scripts remain disallowed.
		"style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "font-src 'self'", "media-src 'self'",
		"connect-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'"
	].join('; ')
	return [
		'<IfModule mod_headers.c>',
		'  Header always set X-Content-Type-Options "nosniff"',
		'  Header always set X-Frame-Options "DENY"',
		'  Header always set Referrer-Policy "strict-origin-when-cross-origin"',
		'  Header always set Cross-Origin-Opener-Policy "same-origin"',
		`  Header always set Content-Security-Policy "${csp}"`,
		// Start host-only: subdomain coverage and preload require separate ownership validation.
		'  Header always set Strict-Transport-Security "max-age=31536000"',
		'  Header set Cache-Control "public, max-age=0, must-revalidate"',
		'  <FilesMatch "\\.html$">',
		'    Header set Cache-Control "no-cache"',
		'  </FilesMatch>',
		'  <IfModule mod_setenvif.c>',
		'    SetEnvIf Request_URI "^/(assets/[^/]+-[A-Za-z0-9_-]{8}\\.(js|css|woff2)|generated/images/[a-f0-9]{16}\\.(webp|png|jpe?g))$" immutable_asset',
		'    Header set Cache-Control "public, max-age=31536000, immutable" env=immutable_asset',
		'    Header unset Expires env=immutable_asset',
		'  </IfModule>',
		'</IfModule>',
		''
	].join('\n')
}
