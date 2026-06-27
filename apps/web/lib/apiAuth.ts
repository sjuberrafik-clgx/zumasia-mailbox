import type { Bindings } from './cf';
import { rateLimit } from './ratelimit';

/** Local-dev fallback pepper. In production set API_TOKEN_PEPPER via `wrangler secret`. */
const DEV_PEPPER = 'zumasia-api-dev-pepper';

/** How often (ms) to refresh a token's last_used_at stamp. Throttled to limit D1 writes. */
const LAST_USED_REFRESH_MS = 60_000;

export function apiTokenPepper(env: Pick<Bindings, 'API_TOKEN_PEPPER'>): string {
  return env.API_TOKEN_PEPPER || DEV_PEPPER;
}

/** SHA-256(token:pepper) as lowercase hex. Mirrored by scripts/mint-api-token.mjs. */
export async function hashToken(token: string, pepper: string): Promise<string> {
  const data = new TextEncoder().encode(`${token}:${pepper}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Constant-time string comparison. Inputs of differing length return false. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type TokenRow = {
  id: string;
  rate_limit_per_min: number;
  revoked: number;
  expires_at: number | null;
  last_used_at: number | null;
};

export type AuthFail = { ok: false; response: Response };
export type AuthOk = { ok: true; tokenId: string; rateLimitPerMin: number };
export type AuthResult = AuthOk | AuthFail;

export type GuardOk = { ok: true; tokenId: string; rateLimitPerMin: number; remaining: number };
export type GuardResult = GuardOk | AuthFail;

/** Build a JSON error response with the v1 error envelope. */
export function apiError(
  code: string,
  message: string,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

/** Build a JSON success response with no-store caching and a rate-limit hint header. */
export function apiJson(body: unknown, remaining: number, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, private',
      'x-ratelimit-remaining': String(remaining),
    },
  });
}

function extractToken(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  const queryToken = new URL(req.url).searchParams.get('token');
  if (queryToken) return queryToken.trim();
  return null;
}

/** Verify the request's API token against the api_tokens table. */
export async function requireToken(req: Request, env: Bindings): Promise<AuthResult> {
  const token = extractToken(req);
  if (!token) {
    return {
      ok: false,
      response: apiError(
        'unauthorized',
        'Missing API token. Send an "Authorization: Bearer <token>" header.',
        401,
        { 'www-authenticate': 'Bearer' },
      ),
    };
  }

  const tokenHash = await hashToken(token, apiTokenPepper(env));
  const row = await env.DB.prepare(
    `SELECT id, rate_limit_per_min, revoked, expires_at, last_used_at
     FROM api_tokens WHERE token_hash = ?`,
  )
    .bind(tokenHash)
    .first<TokenRow>();

  if (!row) {
    return {
      ok: false,
      response: apiError('unauthorized', 'Invalid API token.', 401, { 'www-authenticate': 'Bearer' }),
    };
  }
  if (row.revoked === 1) {
    return { ok: false, response: apiError('forbidden', 'This API token has been revoked.', 403) };
  }
  const now = Date.now();
  if (row.expires_at !== null && row.expires_at <= now) {
    return { ok: false, response: apiError('forbidden', 'This API token has expired.', 403) };
  }

  // Throttled, best-effort last-used stamp. Never fail the request because of it.
  if (row.last_used_at === null || now - row.last_used_at > LAST_USED_REFRESH_MS) {
    try {
      await env.DB.prepare(`UPDATE api_tokens SET last_used_at = ? WHERE id = ?`).bind(now, row.id).run();
    } catch {
      // ignore — stamping is not critical
    }
  }

  return { ok: true, tokenId: row.id, rateLimitPerMin: row.rate_limit_per_min };
}

/**
 * Authenticate, then apply a per-token rate limit for the given bucket.
 * Pass `limitOverride` to cap an endpoint below the token's default (e.g. long-poll).
 */
export async function authorize(
  req: Request,
  env: Bindings,
  bucket: string,
  limitOverride?: number,
): Promise<GuardResult> {
  const auth = await requireToken(req, env);
  if (!auth.ok) return auth;

  const limit = limitOverride ?? auth.rateLimitPerMin;
  const rl = await rateLimit(env, auth.tokenId, bucket, limit);
  if (!rl.ok) {
    return {
      ok: false,
      response: apiError('rate_limited', 'Rate limit exceeded. Slow down and retry.', 429, {
        'retry-after': '60',
        'x-ratelimit-limit': String(limit),
        'x-ratelimit-remaining': '0',
      }),
    };
  }

  return { ok: true, tokenId: auth.tokenId, rateLimitPerMin: auth.rateLimitPerMin, remaining: rl.remaining };
}
