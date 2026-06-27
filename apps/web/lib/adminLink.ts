import { apiTokenPepper, timingSafeEqual } from './apiAuth';
import type { Bindings } from './cf';

const REVIEW_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function base64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return base64url(new Uint8Array(sig));
}

/** Expiry timestamp (ms) for a freshly minted review link. */
export function reviewExpiry(): number {
  return Date.now() + REVIEW_TTL_MS;
}

/** Sign a per-request review token: HMAC-SHA256("<id>:<exp>") keyed by the API pepper. */
export function signReviewToken(
  env: Pick<Bindings, 'API_TOKEN_PEPPER'>,
  id: string,
  exp: number,
): Promise<string> {
  return hmac(apiTokenPepper(env), `${id}:${exp}`);
}

/** Verify a review token for a request id; rejects malformed, mismatched, or expired tokens. */
export async function verifyReviewToken(
  env: Pick<Bindings, 'API_TOKEN_PEPPER'>,
  id: string,
  expRaw: string,
  sig: string,
): Promise<boolean> {
  if (!expRaw || !sig || !/^\d+$/.test(expRaw)) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = await signReviewToken(env, id, exp);
  return timingSafeEqual(expected, sig);
}
