/**
 * patch-open-next.mjs
 *
 * OpenNext on Windows applies two patches incorrectly due to POSIX vs Windows
 * path separator mismatches in its bundler:
 *
 * 1. `getMiddlewareManifest` keeps a live `require(this.middlewareManifestPath)`
 *    call that workerd throws on at runtime ("Dynamic require of X is not supported").
 *    Fix: inline the manifest JSON directly.
 *
 * 2. The Turbopack SSR runtime `requireChunk` function is left as a stub that always
 *    throws "Not found <chunkPath>".  OpenNext is supposed to generate a switch-case
 *    that maps each chunk path to its bundled CommonJS module factory.  Without this,
 *    every dynamic-route / non-static page crashes with
 *    "components.ComponentMod.handler is not a function".
 *    Fix: generate the switch-case from the chunk files that ARE present on disk.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, '..');

const serverFnRoot = resolve(
    webRoot,
    '.open-next/server-functions/default/apps/web',
);
const handlerPath = resolve(serverFnRoot, 'handler.mjs');

let handler = readFileSync(handlerPath, 'utf8');
let patched = false;

// ── Patch 1: inline middleware-manifest.json ────────────────────────────────
const manifestPath = resolve(serverFnRoot, '.next/server/middleware-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const MANIFEST_NEEDLE =
    'getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}';
const MANIFEST_REPLACEMENT =
    `getMiddlewareManifest(){return this.minimalMode?null:${JSON.stringify(manifest)}}`;

if (handler.includes(MANIFEST_NEEDLE)) {
    handler = handler.replace(MANIFEST_NEEDLE, MANIFEST_REPLACEMENT);
    console.log('[patch-open-next] ✓ Patch 1: inlined middleware-manifest.json.');
    patched = true;
} else {
    console.log('[patch-open-next] ℹ Patch 1: middleware-manifest needle not found (already patched or format changed).');
}

// ── Patch 2: generate requireChunk switch-case for SSR chunks ───────────────
const CHUNK_STUB = 'function requireChunk(chunkPath){throw new Error(`Not found ${chunkPath}`)}';

if (handler.includes(CHUNK_STUB)) {
    const ssrChunkDir = resolve(serverFnRoot, '.next/server/chunks/ssr');
    const chunkFiles = readdirSync(ssrChunkDir).filter(f => f.endsWith('.js') && f !== '[turbopack]_runtime.js');

    // handler.mjs lives at .open-next/server-functions/default/apps/web/handler.mjs
    // Chunk files live at .open-next/server-functions/default/apps/web/.next/server/chunks/ssr/<name>
    // So the relative require path from handler.mjs is ./.next/server/chunks/ssr/<name>
    // Wrangler can statically resolve these and bundle them.
    const cases = chunkFiles.map(name => {
        const shortPath = `server/chunks/ssr/${name}`;
        const requirePath = `./.next/server/chunks/ssr/${name}`;
        return `case ${JSON.stringify(shortPath)}: return require(${JSON.stringify(requirePath)});`;
    }).join('');

    const CHUNK_REPLACEMENT =
        `function requireChunk(chunkPath){switch(chunkPath){${cases}default:throw new Error(\`Not found \${chunkPath}\`)}}`;

    handler = handler.replace(CHUNK_STUB, CHUNK_REPLACEMENT);
    console.log(`[patch-open-next] ✓ Patch 2: wired requireChunk switch for ${chunkFiles.length} SSR chunks.`);
    patched = true;
} else {
    console.log('[patch-open-next] ℹ Patch 2: requireChunk stub not found (already patched or format changed).');
}

if (patched) {
    writeFileSync(handlerPath, handler, 'utf8');
    console.log('[patch-open-next] ✓ handler.mjs written.');
} else {
    console.log('[patch-open-next] ℹ No patches applied.');
}
