import type { AdminTokenRequestList } from '@zumasia/shared/schemas';
import { requireAdmin } from '@/lib/apiAdmin';
import { apiJson } from '@/lib/apiAuth';
import { bindings } from '@/lib/cf';
import { listRequests } from '@/lib/tokenRequests';

export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['pending', 'approved', 'denied', 'claimed']);

export async function GET(req: Request) {
  const env = bindings();
  const admin = await requireAdmin(req, env);
  if (!admin.ok) return admin.response;

  const statusParam = new URL(req.url).searchParams.get('status');
  const status = statusParam && ALLOWED.has(statusParam) ? statusParam : null;

  const requests = await listRequests(env, status);
  const body: AdminTokenRequestList = { requests };
  return apiJson(body, 0);
}
