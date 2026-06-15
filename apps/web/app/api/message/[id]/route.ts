import { NextResponse } from 'next/server';
import type { AttachmentMeta, MessageDetail } from '@zumasia/shared/schemas';
import { sanitizeMessageHtml } from '@zumasia/shared/sanitize';
import { bindings, getClientIp } from '@/lib/cf';
import { rateLimit } from '@/lib/ratelimit';
import PostalMime from 'postal-mime';

type Params = { id: string };

type MessageRow = {
    id: string;
    inbox_address: string;
    from_addr: string;
    from_name: string | null;
    subject: string | null;
    received_at: number;
    expires_at: number;
    has_attachments: number;
    size_bytes: number;
    raw_eml_key: string;
};

type AttachmentRow = {
    id: string;
    filename: string;
    content_type: string;
    size_bytes: number;
};

export async function GET(req: Request, ctx: { params: Promise<Params> }) {
    const env = bindings();
    const ip = getClientIp(req);

    const rl = await rateLimit(env, ip, 'message', 30);
    if (!rl.ok) {
        return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const { id } = await ctx.params;

    const row = await env.DB.prepare(
        `SELECT id, inbox_address, from_addr, from_name, subject, received_at, expires_at,
            has_attachments, size_bytes, raw_eml_key
     FROM messages
     WHERE id = ? AND expires_at > ?`,
    )
        .bind(id, Date.now())
        .first<MessageRow>();

    if (!row) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const emlObj = await env.EML_BUCKET.get(row.raw_eml_key);
    if (!emlObj) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const buffer = await new Response(emlObj.body).arrayBuffer();
    const parsed = await PostalMime.parse(buffer);

    let attachments: AttachmentMeta[] = [];
    if (parsed.attachments && parsed.attachments.length > 0) {
        attachments = parsed.attachments.map((a, i) => {
            const buf = a.content instanceof Uint8Array ? a.content : new Uint8Array(a.content as ArrayBuffer);
            return {
                id: `${row.id}-${i}`,
                filename: a.filename || `attachment-${i}`,
                contentType: a.mimeType || 'application/octet-stream',
                sizeBytes: buf.byteLength,
            };
        });
    }

    let headers: Record<string, string | string[]> = {};
    if (parsed.headers) {
        for (const h of parsed.headers) {
            const key = h.key.toLowerCase();
            const val = h.value;
            if (!headers[key]) headers[key] = val;
            else if (Array.isArray(headers[key])) (headers[key] as string[]).push(val);
            else headers[key] = [headers[key] as string, val];
        }
    }

    const detail: MessageDetail = {
        id: row.id,
        fromAddr: row.from_addr,
        fromName: row.from_name,
        subject: row.subject,
        receivedAt: row.received_at,
        expiresAt: row.expires_at,
        hasAttachments: attachments.length > 0,
        sizeBytes: row.size_bytes,
        textBody: parsed.text || null,
        htmlBody: parsed.html ? sanitizeMessageHtml(parsed.html) : null,
        headers,
        attachments,
    };

    return NextResponse.json(detail, {
        headers: { 'cache-control': 'no-store, private' },
    });
}
