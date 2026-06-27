import type { AdminTokenRequest } from '@zumasia/shared/schemas';
import { authorizeAdminAction } from '@/lib/apiAdmin';
import { apiError, apiJson } from '@/lib/apiAuth';
import { bindings } from '@/lib/cf';
import { approveRequest } from '@/lib/tokenRequests';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const env = bindings();
  const { id } = await ctx.params;
  const admin = await authorizeAdminAction(req, env, id);
  if (!admin.ok) return admin.response;

  let payload: { rateLimitPerMin?: unknown; expiresDays?: unknown } = {};
  try {
    payload = await req.json();
  } catch {
    // Body is optional for approve — keep the empty defaults.
  }

  const rateLimitPerMin =
    typeof payload.rateLimitPerMin === 'number' && payload.rateLimitPerMin >= 1
      ? Math.floor(payload.rateLimitPerMin)
      : undefined;
  const expiresDays =
    typeof payload.expiresDays === 'number' && payload.expiresDays >= 1
      ? Math.floor(payload.expiresDays)
      : payload.expiresDays === null
        ? null
        : undefined;

  const result = await approveRequest(env, id, { rateLimitPerMin, expiresDays });
  if (result === 'not_found') return apiError('not_found', 'Request not found.', 404);
  if (result === 'not_pending') return apiError('conflict', 'Request is not pending.', 409);
  return apiJson(result satisfies AdminTokenRequest, 0);
}
