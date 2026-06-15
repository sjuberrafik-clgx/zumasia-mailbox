import { NextResponse } from 'next/server';
import {
  CLIP_BLOB_TOKEN_TTL_MS,
  CLIP_IMAGE_CONTENT_TYPES,
  hashWithPepper,
  isValidClipCode,
  type ClipRetrieveResponse,
} from '@zumasia/shared/clip';
import { bindings, getClientIp } from '@/lib/cf';
import { clipPepper } from '@/lib/clip';
import { rateLimit } from '@/lib/ratelimit';

type ClipRow = {
  id: string;
  kind: 'text' | 'image' | 'file';
  text_body: string | null;
  filename: string | null;
  content_type: string | null;
  size_bytes: number;
};

export async function POST(req: Request) {
  const env = bindings();
  const ip = getClientIp(req);

  const rl = await rateLimit(env, ip, 'clip-retrieve', 10);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let payload: { code?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const code = typeof payload.code === 'string' ? payload.code.trim() : '';
  if (!isValidClipCode(code)) {
    // Generic response — do not reveal whether the code format mattered.
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const pepper = clipPepper(env);
  const codeHash = await hashWithPepper(code, pepper);
  const now = Date.now();

  // Mint a one-time blob token up front; only persisted if the burn succeeds.
  const blobToken = crypto.randomUUID().replace(/-/g, '');
  const blobTokenHash = await hashWithPepper(blobToken, pepper);
  const blobTokenExpiresAt = now + CLIP_BLOB_TOKEN_TTL_MS;

  // Atomic burn: claim the active clip and mark it retrieved in one statement.
  const row = await env.CLIP_DB.prepare(
    `UPDATE clips
       SET retrieved_at = ?, blob_token_hash = ?, blob_token_expires_at = ?
       WHERE code_hash = ? AND retrieved_at IS NULL AND expires_at > ?
       RETURNING id, kind, text_body, filename, content_type, size_bytes`,
  )
    .bind(now, blobTokenHash, blobTokenExpiresAt, codeHash, now)
    .first<ClipRow>();

  if (!row) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const isImage =
    row.kind === 'image' && !!row.content_type && CLIP_IMAGE_CONTENT_TYPES.has(row.content_type);

  const body: ClipRetrieveResponse = {
    kind: row.kind,
    text: row.kind === 'text' ? row.text_body : null,
    filename: row.filename,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    blobUrl:
      row.kind === 'text'
        ? null
        : `/api/clip/blob/${encodeURIComponent(row.id)}?t=${encodeURIComponent(blobToken)}`,
    isImage,
  };

  return NextResponse.json(body, {
    headers: { 'cache-control': 'no-store, private' },
  });
}
