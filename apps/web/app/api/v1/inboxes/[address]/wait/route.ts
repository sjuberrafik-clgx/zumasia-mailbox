import { fullAddressFromLocalPart, normalizeLocalPart } from '@zumasia/shared/address';
import type { MessageDetail, MessageSummary, WaitResponse } from '@zumasia/shared/schemas';
import { apiError, apiJson, authorize } from '@/lib/apiAuth';
import { bindings } from '@/lib/cf';
import { getMessageDetail, listInboxMessages } from '@/lib/mail';

export const dynamic = 'force-dynamic';

const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 30_000;
const DEFAULT_TIMEOUT_MS = 25_000;
const POLL_INTERVAL_MS = 1_500;
const WAIT_RATE_LIMIT_PER_MIN = 20;

type Params = { address: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTimeoutMs(value: string | null): number {
  if (value === null) return DEFAULT_TIMEOUT_MS;
  const seconds = Number.parseInt(value, 10);
  if (Number.isNaN(seconds)) return DEFAULT_TIMEOUT_MS;
  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, seconds * 1000));
}

export async function GET(req: Request, ctx: { params: Promise<Params> }) {
  const env = bindings();
  const auth = await authorize(req, env, 'v1-wait', WAIT_RATE_LIMIT_PER_MIN);
  if (!auth.ok) return auth.response;

  const { address } = await ctx.params;
  const local = normalizeLocalPart(decodeURIComponent(address));
  if (!local) return apiError('invalid_request', 'Invalid inbox address.', 400);
  const fullAddress = fullAddressFromLocalPart(local);

  const params = new URL(req.url).searchParams;
  const startedAt = Date.now();
  const sinceRaw = params.get('since');
  const since = sinceRaw !== null && /^\d+$/.test(sinceRaw) ? Number.parseInt(sinceRaw, 10) : startedAt;
  const from = params.get('from');
  const subject = params.get('subject');
  const full = params.get('full') === 'true';
  const deadline = startedAt + parseTimeoutMs(params.get('timeout'));

  while (Date.now() < deadline) {
    const matches = await listInboxMessages(env, fullAddress, { limit: 1, skip: 0, since, from, subject });
    const hit = matches[0];
    if (hit) {
      let message: MessageSummary | MessageDetail = hit;
      if (full) {
        const detail = await getMessageDetail(env, hit.id);
        if (detail) message = detail;
      }
      const body: WaitResponse = { matched: true, timedOut: false, message };
      return apiJson(body, auth.remaining);
    }
    if (deadline - Date.now() <= POLL_INTERVAL_MS) break;
    await sleep(POLL_INTERVAL_MS);
  }

  const body: WaitResponse = { matched: false, timedOut: true, message: null };
  return apiJson(body, auth.remaining);
}
