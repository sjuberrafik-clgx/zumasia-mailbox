import type { TokenClaimResult } from '@zumasia/shared/schemas';
import { apiError, apiJson } from '@/lib/apiAuth';
import { bindings, getClientIp } from '@/lib/cf';
import { rateLimit } from '@/lib/ratelimit';
import { claimToken } from '@/lib/tokenRequests';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const env = bindings();
  const ip = getClientIp(req);

  const rl = await rateLimit(env, ip, 'token-claim', 10);
  if (!rl.ok) {
    return apiError('rate_limited', 'Too many requests. Try again in a minute.', 429, { 'retry-after': '60' });
  }

  let payload: { requestId?: unknown; claimCode?: unknown };
  try {
    payload = await req.json();
  } catch {
    return apiError('invalid_request', 'Request body must be JSON.', 400);
  }

  const requestId = typeof payload.requestId === 'string' ? payload.requestId.trim() : '';
  const claimCode = typeof payload.claimCode === 'string' ? payload.claimCode.trim() : '';
  if (!requestId || !claimCode) {
    return apiError('invalid_request', 'requestId and claimCode are required.', 400);
  }

  const result = await claimToken(env, requestId, claimCode);
  switch (result.kind) {
    case 'not_found':
      return apiError('not_found', 'No matching request.', 404);
    case 'pending':
      return apiJson({ status: 'pending' } satisfies TokenClaimResult, rl.remaining);
    case 'denied':
      return apiJson({ status: 'denied' } satisfies TokenClaimResult, rl.remaining);
    case 'claimed':
      return apiJson({ status: 'claimed' } satisfies TokenClaimResult, rl.remaining);
    case 'issued':
      return apiJson(
        {
          status: 'approved',
          token: result.token,
          tokenId: result.tokenId,
          rateLimitPerMin: result.rateLimitPerMin,
          expiresAt: result.expiresAt,
        } satisfies TokenClaimResult,
        rl.remaining,
      );
  }
}
