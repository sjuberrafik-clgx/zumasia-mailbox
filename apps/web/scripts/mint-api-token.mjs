/* eslint-disable no-undef */
/**
 * mint-api-token.mjs
 *
 * Mint an API token for the Zumasia Mail automation API (v1). The plaintext token
 * is shown ONCE; only its SHA-256(token:pepper) hash is stored in D1. The pepper
 * must match the deployed API_TOKEN_PEPPER secret (apps/web).
 *
 * Usage (run from anywhere, but the printed wrangler commands assume packages/db-mail):
 *   API_TOKEN_PEPPER=... node scripts/mint-api-token.mjs --label "QA CI" [--rate 120] [--expires-days 90]
 */

import { createHash, randomBytes } from 'node:crypto';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      args[name] = next;
      i++;
    } else {
      args[name] = 'true';
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

const pepper = process.env.API_TOKEN_PEPPER || (typeof args.pepper === 'string' ? args.pepper : '');
if (!pepper) {
  console.error('Error: set API_TOKEN_PEPPER (env) or pass --pepper <value>. It must match the deployed secret.');
  process.exit(1);
}

const label = typeof args.label === 'string' ? args.label : 'unnamed';

const rate = Number.parseInt(args.rate ?? '120', 10);
if (Number.isNaN(rate) || rate < 1) {
  console.error('Error: --rate must be a positive integer.');
  process.exit(1);
}

const expiresDays = args['expires-days'] ? Number.parseInt(args['expires-days'], 10) : null;
if (expiresDays !== null && (Number.isNaN(expiresDays) || expiresDays < 1)) {
  console.error('Error: --expires-days must be a positive integer.');
  process.exit(1);
}

const token = `zm_live_${randomBytes(24).toString('base64url')}`;
const tokenHash = createHash('sha256').update(`${token}:${pepper}`).digest('hex');
const id = `tok_${randomBytes(6).toString('hex')}`;
const now = Date.now();
const expiresAt = expiresDays === null ? null : now + expiresDays * 86_400_000;
const safeLabel = label.replace(/'/g, "''");

const sql =
  'INSERT INTO api_tokens (id, token_hash, label, rate_limit_per_min, created_at, last_used_at, revoked, expires_at) ' +
  `VALUES ('${id}', '${tokenHash}', '${safeLabel}', ${rate}, ${now}, NULL, 0, ${expiresAt ?? 'NULL'});`;
const cmd = sql.replace(/"/g, '\\"');

console.log('');
console.log('  API token (shown once — copy it now):');
console.log(`    ${token}`);
console.log('');
console.log(`  Token id:  ${id}`);
console.log(`  Label:     ${label}`);
console.log(`  Rate/min:  ${rate}`);
console.log(`  Expires:   ${expiresAt ? new Date(expiresAt).toISOString() : 'never'}`);
console.log('');
console.log('  Insert into D1 (run from packages/db-mail):');
console.log('');
console.log('    # Remote (production):');
console.log(`    wrangler d1 execute zumasia-mail --remote --command "${cmd}"`);
console.log('');
console.log('    # Local dev (shared with the web app state):');
console.log(`    wrangler d1 execute zumasia-mail --local --persist-to ../../apps/web/.wrangler/state --command "${cmd}"`);
console.log('');
console.log('  Try it:');
console.log(`    curl -H "Authorization: Bearer ${token}" https://zumasia.com/api/v1/inboxes/test/messages`);
console.log('');
