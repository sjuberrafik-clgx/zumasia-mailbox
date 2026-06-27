import { apiError, authorize } from '@/lib/apiAuth';
import { bindings } from '@/lib/cf';
import { getAttachment } from '@/lib/mail';

export const dynamic = 'force-dynamic';

type Params = { id: string; index: string };

export async function GET(req: Request, ctx: { params: Promise<Params> }) {
  const env = bindings();
  const auth = await authorize(req, env, 'v1');
  if (!auth.ok) return auth.response;

  const { id, index } = await ctx.params;
  const idx = Number.parseInt(index, 10);
  if (Number.isNaN(idx) || idx < 0) {
    return apiError('invalid_request', 'Invalid attachment index.', 400);
  }

  const result = await getAttachment(env, id, idx);
  if (!result.ok) {
    if (result.reason === 'blocked_type') {
      return apiError('blocked_type', 'This attachment type cannot be downloaded.', 403);
    }
    return apiError('not_found', 'Attachment not found or expired.', 404);
  }

  const safeName = result.filename.replace(/"/g, '').slice(0, 200);
  return new Response(result.content, {
    headers: {
      'content-type': result.contentType,
      'content-disposition': `attachment; filename="${safeName}"`,
      'x-content-type-options': 'nosniff',
      'cache-control': 'private, max-age=300',
      'x-ratelimit-remaining': String(auth.remaining),
    },
  });
}
