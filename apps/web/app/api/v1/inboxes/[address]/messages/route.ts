import { fullAddressFromLocalPart, normalizeLocalPart } from '@zumasia/shared/address';
import { INBOX_LIST_LIMIT } from '@zumasia/shared/brand';
import type { MessagesListResponse } from '@zumasia/shared/schemas';
import { apiError, apiJson, authorize } from '@/lib/apiAuth';
import { bindings } from '@/lib/cf';
import { listInboxMessages } from '@/lib/mail';

export const dynamic = 'force-dynamic';

type Params = { address: string };

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
  if (value === null) return fallback;
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function GET(req: Request, ctx: { params: Promise<Params> }) {
  const env = bindings();
  const auth = await authorize(req, env, 'v1');
  if (!auth.ok) return auth.response;

  const { address } = await ctx.params;
  const local = normalizeLocalPart(decodeURIComponent(address));
  if (!local) return apiError('invalid_request', 'Invalid inbox address.', 400);
  const fullAddress = fullAddressFromLocalPart(local);

  const params = new URL(req.url).searchParams;
  const limit = clampInt(params.get('limit'), INBOX_LIST_LIMIT, 1, INBOX_LIST_LIMIT);
  const skip = clampInt(params.get('skip'), 0, 0, 100_000);
  const sinceRaw = params.get('since');
  const since = sinceRaw !== null && /^\d+$/.test(sinceRaw) ? Number.parseInt(sinceRaw, 10) : null;

  const messages = await listInboxMessages(env, fullAddress, {
    limit,
    skip,
    since,
    from: params.get('from'),
    subject: params.get('subject'),
  });

  const body: MessagesListResponse = { address: fullAddress, messages, limit, skip };
  return apiJson(body, auth.remaining);
}
