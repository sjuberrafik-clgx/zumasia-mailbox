import { NextResponse } from 'next/server';
import { normalizeLocalPart, fullAddressFromLocalPart } from '@zumasia/shared/address';
import { INBOX_LIST_LIMIT } from '@zumasia/shared/brand';
import type { InboxResponse, MessageSummary } from '@zumasia/shared/schemas';
import { bindings, getClientIp } from '@/lib/cf';
import { rateLimit } from '@/lib/ratelimit';

type Params = { address: string };

type MessageRow = {
  id: string;
  from_addr: string;
  from_name: string | null;
  subject: string | null;
  received_at: number;
  expires_at: number;
  has_attachments: number;
  size_bytes: number;
};

export async function GET(req: Request, ctx: { params: Promise<Params> }) {
  const env = bindings();
  const ip = getClientIp(req);

  const rl = await rateLimit(env, ip, 'inbox', 60);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const { address } = await ctx.params;
  const local = normalizeLocalPart(decodeURIComponent(address));
  if (!local) {
    return NextResponse.json({ error: 'invalid_address' }, { status: 400 });
  }
  const fullAddress = fullAddressFromLocalPart(local);

  const result = await env.DB.prepare(
    `SELECT id, from_addr, from_name, subject, received_at, expires_at, has_attachments, size_bytes
     FROM messages
     WHERE inbox_address = ? AND expires_at > ?
     ORDER BY received_at DESC
     LIMIT ?`,
  )
    .bind(fullAddress, Date.now(), INBOX_LIST_LIMIT)
    .all<MessageRow>();

  const messages: MessageSummary[] = (result.results ?? []).map((r) => ({
    id: r.id,
    fromAddr: r.from_addr,
    fromName: r.from_name,
    subject: r.subject,
    receivedAt: r.received_at,
    expiresAt: r.expires_at,
    hasAttachments: r.has_attachments === 1,
    sizeBytes: r.size_bytes,
  }));

  const body: InboxResponse = { address: fullAddress, messages };
  return NextResponse.json(body, {
    headers: { 'cache-control': 'no-store, private' },
  });
}
