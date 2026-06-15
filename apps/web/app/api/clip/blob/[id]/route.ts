import { NextResponse } from 'next/server';
import { CLIP_IMAGE_CONTENT_TYPES, hashWithPepper } from '@zumasia/shared/clip';
import { bindings, getClientIp } from '@/lib/cf';
import { clipPepper } from '@/lib/clip';
import { rateLimit } from '@/lib/ratelimit';

type Params = { id: string };

type BlobRow = {
  r2_key: string | null;
  filename: string | null;
  content_type: string | null;
  blob_token_hash: string | null;
  blob_token_expires_at: number | null;
};

export async function GET(req: Request, ctx: { params: Promise<Params> }) {
  const env = bindings();
  const ip = getClientIp(req);

  const rl = await rateLimit(env, ip, 'clip-blob', 30);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get('t') ?? '';
  if (!token) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const row = await env.CLIP_DB.prepare(
    `SELECT r2_key, filename, content_type, blob_token_hash, blob_token_expires_at
       FROM clips WHERE id = ?`,
  )
    .bind(id)
    .first<BlobRow>();

  const now = Date.now();
  if (
    !row ||
    !row.r2_key ||
    !row.blob_token_hash ||
    !row.blob_token_expires_at ||
    row.blob_token_expires_at < now
  ) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const pepper = clipPepper(env);
  const tokenHash = await hashWithPepper(token, pepper);
  // Constant-time-ish comparison via fixed-length hex strings.
  if (tokenHash.length !== row.blob_token_hash.length || tokenHash !== row.blob_token_hash) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const obj = await env.CLIP_BUCKET.get(row.r2_key);
  if (!obj) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const contentType = row.content_type || 'application/octet-stream';
  const isImage = CLIP_IMAGE_CONTENT_TYPES.has(contentType);
  const safeName = (row.filename || 'download').replace(/"/g, '').slice(0, 200);
  const disposition = isImage ? 'inline' : 'attachment';

  return new Response(obj.body, {
    headers: {
      'content-type': contentType,
      'content-disposition': `${disposition}; filename="${safeName}"`,
      'x-content-type-options': 'nosniff',
      'cache-control': 'no-store, private',
    },
  });
}
