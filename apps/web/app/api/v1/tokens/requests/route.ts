import type { TokenRequestCreated } from '@zumasia/shared/schemas';
import { SITE_URL } from '@zumasia/shared/brand';
import { verifyTurnstile } from '@/lib/apiAdmin';
import { reviewExpiry, signReviewToken } from '@/lib/adminLink';
import { apiError, apiJson } from '@/lib/apiAuth';
import { bindings, getClientIp, waitUntil } from '@/lib/cf';
import { sendTokenRequestNotification } from '@/lib/notify';
import { rateLimit } from '@/lib/ratelimit';
import { createTokenRequest } from '@/lib/tokenRequests';

export const dynamic = 'force-dynamic';

const MAX_LABEL = 80;
const MAX_CONTACT = 160;
const MAX_REASON = 600;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function POST(req: Request) {
  const env = bindings();
  const ip = getClientIp(req);

  const rl = await rateLimit(env, ip, 'token-request', 5);
  if (!rl.ok) {
    return apiError('rate_limited', 'Too many requests. Try again in a minute.', 429, { 'retry-after': '60' });
  }

  let payload: { label?: unknown; email?: unknown; reason?: unknown; turnstileToken?: unknown };
  try {
    payload = await req.json();
  } catch {
    return apiError('invalid_request', 'Request body must be JSON.', 400);
  }

  const label = cleanString(payload.label, MAX_LABEL);
  const contact = cleanString(payload.email, MAX_CONTACT);
  const reason = cleanString(payload.reason, MAX_REASON);

  if (!contact || !EMAIL_RE.test(contact)) {
    return apiError('invalid_request', 'A valid contact email is required.', 400);
  }
  if (!reason) {
    return apiError('invalid_request', 'A reason / use case is required.', 400);
  }

  const turnstileToken = typeof payload.turnstileToken === 'string' ? payload.turnstileToken : null;
  const human = await verifyTurnstile(env, turnstileToken, ip);
  if (!human) {
    return apiError('turnstile_failed', 'Bot verification failed. Please retry.', 400);
  }

  const { requestId, claimCode } = await createTokenRequest(env, { label, contact, reason }, ip);

  // Notify the admin with a signed, expiring review link (best-effort, non-blocking).
  const exp = reviewExpiry();
  const sig = await signReviewToken(env, requestId, exp);
  const reviewUrl = `${SITE_URL}/admin/review/${requestId}?exp=${exp}&sig=${encodeURIComponent(sig)}`;
  waitUntil(
    sendTokenRequestNotification(
      env,
      { id: requestId, label, contact, reason, createdAt: Date.now() },
      reviewUrl,
    ),
  );

  const body: TokenRequestCreated = { requestId, claimCode, status: 'pending' };
  return apiJson(body, rl.remaining, 201);
}
