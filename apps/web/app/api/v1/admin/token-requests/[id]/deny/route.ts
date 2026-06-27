import type { AdminTokenRequest } from '@zumasia/shared/schemas';
import { authorizeAdminAction } from '@/lib/apiAdmin';
import { apiError, apiJson } from '@/lib/apiAuth';
import { bindings } from '@/lib/cf';
import { denyRequest } from '@/lib/tokenRequests';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const env = bindings();
  const { id } = await ctx.params;
  const admin = await authorizeAdminAction(req, env, id);
  if (!admin.ok) return admin.response;
  const result = await denyRequest(env, id);
  if (result === 'not_found') return apiError('not_found', 'Request not found.', 404);
  if (result === 'not_pending') return apiError('conflict', 'Request is not pending.', 409);
  return apiJson(result satisfies AdminTokenRequest, 0);
}
