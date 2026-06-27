import type { AdminTokenRequest } from '@zumasia/shared/schemas';
import { apiTokenPepper, hashToken, timingSafeEqual } from './apiAuth';
import type { Bindings } from './cf';

type RequestRow = {
  id: string;
  claim_hash: string;
  label: string | null;
  contact: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'denied' | 'claimed';
  rate_limit_per_min: number;
  expires_days: number | null;
  created_at: number;
  decided_at: number | null;
  claimed_at: number | null;
  token_id: string | null;
  ip: string | null;
};

function randomHex(bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomToken(prefix: string, bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  let bin = '';
  for (const b of a) bin += String.fromCharCode(b);
  const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${prefix}${b64}`;
}

function toAdmin(row: RequestRow): AdminTokenRequest {
  return {
    id: row.id,
    label: row.label,
    contact: row.contact,
    reason: row.reason,
    status: row.status,
    rateLimitPerMin: row.rate_limit_per_min,
    expiresDays: row.expires_days,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
    claimedAt: row.claimed_at,
    tokenId: row.token_id,
    ip: row.ip,
  };
}

export async function getRequest(env: Pick<Bindings, 'DB'>, id: string): Promise<RequestRow | null> {
  return env.DB.prepare(`SELECT * FROM api_token_requests WHERE id = ?`).bind(id).first<RequestRow>();
}

export type CreateRequestInput = {
  label: string | null;
  contact: string | null;
  reason: string | null;
};

export async function createTokenRequest(
  env: Bindings,
  input: CreateRequestInput,
  ip: string,
): Promise<{ requestId: string; claimCode: string }> {
  const requestId = `req_${randomHex(12)}`;
  const claimCode = randomToken('zmclaim_', 24);
  const claimHash = await hashToken(claimCode, apiTokenPepper(env));

  await env.DB.prepare(
    `INSERT INTO api_token_requests
       (id, claim_hash, label, contact, reason, status, rate_limit_per_min, expires_days, created_at, ip)
     VALUES (?, ?, ?, ?, ?, 'pending', 120, NULL, ?, ?)`,
  )
    .bind(requestId, claimHash, input.label, input.contact, input.reason, Date.now(), ip)
    .run();

  return { requestId, claimCode };
}

export async function listRequests(
  env: Pick<Bindings, 'DB'>,
  status: string | null,
): Promise<AdminTokenRequest[]> {
  const stmt = status
    ? env.DB.prepare(
        `SELECT * FROM api_token_requests WHERE status = ? ORDER BY created_at DESC LIMIT 200`,
      ).bind(status)
    : env.DB.prepare(`SELECT * FROM api_token_requests ORDER BY created_at DESC LIMIT 200`);
  const result = await stmt.all<RequestRow>();
  return (result.results ?? []).map(toAdmin);
}

export type DecisionResult = 'not_found' | 'not_pending' | AdminTokenRequest;

export async function approveRequest(
  env: Pick<Bindings, 'DB'>,
  id: string,
  opts: { rateLimitPerMin?: number; expiresDays?: number | null },
): Promise<DecisionResult> {
  const row = await getRequest(env, id);
  if (!row) return 'not_found';
  if (row.status !== 'pending') return 'not_pending';

  const rate = opts.rateLimitPerMin ?? row.rate_limit_per_min;
  const expDays = opts.expiresDays === undefined ? row.expires_days : opts.expiresDays;

  const res = await env.DB.prepare(
    `UPDATE api_token_requests
       SET status = 'approved', decided_at = ?, rate_limit_per_min = ?, expires_days = ?
     WHERE id = ? AND status = 'pending'`,
  )
    .bind(Date.now(), rate, expDays, id)
    .run();
  if (res.meta.changes !== 1) return 'not_pending';

  const updated = await getRequest(env, id);
  return updated ? toAdmin(updated) : 'not_found';
}

export async function denyRequest(env: Pick<Bindings, 'DB'>, id: string): Promise<DecisionResult> {
  const res = await env.DB.prepare(
    `UPDATE api_token_requests SET status = 'denied', decided_at = ? WHERE id = ? AND status = 'pending'`,
  )
    .bind(Date.now(), id)
    .run();
  if (res.meta.changes !== 1) {
    const row = await getRequest(env, id);
    return row ? 'not_pending' : 'not_found';
  }
  const updated = await getRequest(env, id);
  return updated ? toAdmin(updated) : 'not_found';
}

export type ClaimResult =
  | { kind: 'not_found' }
  | { kind: 'pending' }
  | { kind: 'denied' }
  | { kind: 'claimed' }
  | { kind: 'issued'; token: string; tokenId: string; rateLimitPerMin: number; expiresAt: number | null };

export async function claimToken(env: Bindings, id: string, claimCode: string): Promise<ClaimResult> {
  const pepper = apiTokenPepper(env);
  const row = await getRequest(env, id);
  if (!row) return { kind: 'not_found' };

  const expected = await hashToken(claimCode, pepper);
  if (!timingSafeEqual(expected, row.claim_hash)) return { kind: 'not_found' };

  if (row.status === 'pending') return { kind: 'pending' };
  if (row.status === 'denied') return { kind: 'denied' };
  if (row.status === 'claimed') return { kind: 'claimed' };

  // Approved: claim the slot atomically so concurrent claims can't double-issue.
  const now = Date.now();
  const claimRes = await env.DB.prepare(
    `UPDATE api_token_requests SET status = 'claimed', claimed_at = ? WHERE id = ? AND status = 'approved'`,
  )
    .bind(now, id)
    .run();
  if (claimRes.meta.changes !== 1) return { kind: 'claimed' };

  // Mint the API token now — only ever revealed here, after approval.
  const token = randomToken('zm_live_', 24);
  const tokenId = `tok_${randomHex(6)}`;
  const tokenHash = await hashToken(token, pepper);
  const expiresAt = row.expires_days === null ? null : now + row.expires_days * 86_400_000;

  await env.DB.prepare(
    `INSERT INTO api_tokens (id, token_hash, label, rate_limit_per_min, created_at, last_used_at, revoked, expires_at)
     VALUES (?, ?, ?, ?, ?, NULL, 0, ?)`,
  )
    .bind(tokenId, tokenHash, row.label ?? `request ${row.id}`, row.rate_limit_per_min, now, expiresAt)
    .run();
  await env.DB.prepare(`UPDATE api_token_requests SET token_id = ? WHERE id = ?`).bind(tokenId, id).run();

  return { kind: 'issued', token, tokenId, rateLimitPerMin: row.rate_limit_per_min, expiresAt };
}
