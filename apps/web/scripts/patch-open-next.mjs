/**
 * patch-open-next.mjs
 *
 * OpenNext on Windows fails to inline manifest JSON files because its patcher
 * uses POSIX path comparisons that never match Windows separators.  The result
 * is a live `require(this.middlewareManifestPath)` call inside the bundled
 * server function, which workerd throws on ("Dynamic require of X is not
 * supported").
 *
 * This script runs after `opennextjs-cloudflare build` and replaces every
 * dynamic manifest require with an inlined copy of the JSON so that wrangler
 * can include it as a static value.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, '..');

const handlerPath = resolve(
    webRoot,
    '.open-next/server-functions/default/apps/web/handler.mjs',
);
const manifestPath = resolve(
    webRoot,
    '.open-next/server-functions/default/apps/web/.next/server/middleware-manifest.json',
);

const handler = readFileSync(handlerPath, 'utf8');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const inlined = JSON.stringify(manifest);

const NEEDLE = 'getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}';
const REPLACEMENT = `getMiddlewareManifest(){return this.minimalMode?null:${inlined}}`;

if (!handler.includes(NEEDLE)) {
    console.warn(
        '[patch-open-next] WARNING: needle not found in handler.mjs — ' +
        'the patch was NOT applied. The site may crash with a "Dynamic require" error.\n' +
        'This can happen when OpenNext already inlined the manifest (no action needed) ' +
        'or when the Next.js/OpenNext bundle format changed (update the needle string).',
    );
    process.exit(0);
}

const patched = handler.replace(NEEDLE, REPLACEMENT);
writeFileSync(handlerPath, patched, 'utf8');
console.log('[patch-open-next] ✓ Inlined middleware-manifest.json into server handler.');
