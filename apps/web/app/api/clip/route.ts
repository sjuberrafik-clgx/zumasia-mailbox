import { NextResponse } from 'next/server';
import { BLOCKED_ATTACHMENT_EXTENSIONS } from '@zumasia/shared/brand';
import {
  CLIP_IMAGE_CONTENT_TYPES,
  CLIP_TTL_MS,
  MAX_CLIP_FILE_BYTES,
  MAX_CLIP_TEXT_BYTES,
  generateClipCode,
  hashWithPepper,
  type ClipCreateResponse,
  type ClipKind,
} from '@zumasia/shared/clip';
import { bindings, getClientIp } from '@/lib/cf';
import { clipBlobKey, clipPepper } from '@/lib/clip';
import { rateLimit } from '@/lib/ratelimit';

const MAX_CODE_ATTEMPTS = 5;

function getExt(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
}

export async function POST(req: Request) {
  const env = bindings();
  const ip = getClientIp(req);

  const rl = await rateLimit(env, ip, 'clip-create', 20);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const kind = String(form.get('kind') || '') as ClipKind;
  if (kind !== 'text' && kind !== 'image' && kind !== 'file') {
    return NextResponse.json({ error: 'invalid_kind' }, { status: 400 });
  }

  const now = Date.now();
  const expiresAt = now + CLIP_TTL_MS;
  const id = crypto.randomUUID();

  let textBody: string | null = null;
  let r2Key: string | null = null;
  let filename: string | null = null;
  let contentType: string | null = null;
  let sizeBytes: number;

  if (kind === 'text') {
    const text = String(form.get('text') ?? '');
    const bytes = new TextEncoder().encode(text).byteLength;
    if (bytes === 0) {
      return NextResponse.json({ error: 'empty_text' }, { status: 400 });
    }
    if (bytes > MAX_CLIP_TEXT_BYTES) {
      return NextResponse.json({ error: 'text_too_large' }, { status: 413 });
    }
    textBody = text;
    sizeBytes = bytes;
  } else {
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'missing_file' }, { status: 400 });
    }
    if (file.size > MAX_CLIP_FILE_BYTES) {
      return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
    }

    const name = file.name || (kind === 'image' ? 'image' : 'file');
    const ext = getExt(name);
    if (BLOCKED_ATTACHMENT_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'blocked_type' }, { status: 415 });
    }

    const type = file.type || 'application/octet-stream';
    if (kind === 'image' && !CLIP_IMAGE_CONTENT_TYPES.has(type)) {
      return NextResponse.json({ error: 'unsupported_image' }, { status: 415 });
    }

    r2Key = clipBlobKey(id);
    const body = await file.arrayBuffer();
    await env.CLIP_BUCKET.put(r2Key, body, {
      httpMetadata: { contentType: type },
    });
    filename = name.slice(0, 200);
    contentType = type;
    sizeBytes = file.size;
  }

  const pepper = clipPepper(env);

  // Generate a code that is not currently active. The unique partial index
  // guards against races; retry on conflict.
  let code = '';
  let inserted = false;
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    code = generateClipCode();
    const codeHash = await hashWithPepper(code, pepper);
    try {
      await env.CLIP_DB.prepare(
        `INSERT INTO clips (
           id, code_hash, kind, text_body, r2_key, filename, content_type,
           size_bytes, created_at, expires_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(id, codeHash, kind, textBody, r2Key, filename, contentType, sizeBytes, now, expiresAt)
        .run();
      inserted = true;
      break;
    } catch {
      // Active-code collision; try a new code.
    }
  }

  if (!inserted) {
    if (r2Key) await env.CLIP_BUCKET.delete(r2Key).catch(() => {});
    return NextResponse.json({ error: 'try_again' }, { status: 503 });
  }

  const body: ClipCreateResponse = { code, kind, expiresAt };
  return NextResponse.json(body, {
    headers: { 'cache-control': 'no-store, private' },
  });
}
