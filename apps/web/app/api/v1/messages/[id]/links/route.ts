import type { MessageLinksResponse } from '@zumasia/shared/schemas';
import { apiError, apiJson, authorize } from '@/lib/apiAuth';
import { bindings } from '@/lib/cf';
import { extractLinks } from '@/lib/links';
import { getMessageDetail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export async function GET(req: Request, ctx: { params: Promise<Params> }) {
  const env = bindings();
  const auth = await authorize(req, env, 'v1');
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const detail = await getMessageDetail(env, id);
  if (!detail) return apiError('not_found', 'Message not found or expired.', 404);

  const body: MessageLinksResponse = { messageId: id, links: extractLinks(detail) };
  return apiJson(body, auth.remaining);
}
