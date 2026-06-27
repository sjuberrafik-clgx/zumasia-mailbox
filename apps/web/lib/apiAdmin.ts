import type { Bindings } from './cf';
import { apiError, apiTokenPepper, hashToken, timingSafeEqual } from './apiAuth';
import { verifyReviewToken } from './adminLink';

export type AdminOk = { ok: true };
export type AdminFail = { ok: false; response: Response };
export type AdminResult = AdminOk | AdminFail;

function extractBearer(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
  return match?.[1]?.trim() ?? null;
}

/**
 * Gate an admin-only endpoint behind the ADMIN_API_TOKEN secret.
 * Returns 503 when the secret is not configured, so admin routes are never open.
 */
export async function requireAdmin(req: Request, env: Bindings): Promise<AdminResult> {
  const expected = env.ADMIN_API_TOKEN;
  if (!expected) {
    return { ok: false, response: apiError('admin_not_configured', 'Admin API is not configured.', 503) };
  }
  const provided = extractBearer(req);
  if (!provided) {
    return {
      ok: false,
      response: apiError('unauthorized', 'Missing admin token.', 401, { 'www-authenticate': 'Bearer' }),
    };
  }
  // Compare fixed-length hashes so neither length nor content leaks via timing.
  const pepper = apiTokenPepper(env);
  const [a, b] = await Promise.all([hashToken(provided, pepper), hashToken(expected, pepper)]);
  if (!timingSafeEqual(a, b)) {
    return {
      ok: false,
      response: apiError('unauthorized', 'Invalid admin token.', 401, { 'www-authenticate': 'Bearer' }),
    };
  }
  return { ok: true };
}

/**
 * Authorize a per-request admin action (approve/deny). Accepts either a valid
 * signed review link (`?exp=&sig=` from the notification email) or the admin
 * bearer token. The signed link is scoped to this one request id.
 */
export async function authorizeAdminAction(req: Request, env: Bindings, id: string): Promise<AdminResult> {
  const url = new URL(req.url);
  const exp = url.searchParams.get('exp');
  const sig = url.searchParams.get('sig');
  if (exp || sig) {
    if (exp && sig && (await verifyReviewToken(env, id, exp, sig))) return { ok: true };
    return { ok: false, response: apiError('unauthorized', 'Invalid or expired review link.', 401) };
  }
  return requireAdmin(req, env);
}

/**
 * Verify a Cloudflare Turnstile token. When TURNSTILE_SECRET is not configured the
 * check is treated as disabled (returns true) so the request form still works.
 */
export async function verifyTurnstile(
  env: Pick<Bindings, 'TURNSTILE_SECRET'>,
  token: string | null,
  ip: string,
): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const body = new URLSearchParams();
  body.set('secret', env.TURNSTILE_SECRET);
  body.set('response', token);
  if (ip && ip !== 'unknown') body.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
