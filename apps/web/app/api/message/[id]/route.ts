import { NextResponse } from 'next/server';
import type { AttachmentMeta, MessageDetail } from '@zumasia/shared/schemas';
import { bindings, getClientIp } from '@/lib/cf';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'edge';

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
    text_body: string | null;
    html_body_sanitized: string | null;
    headers_json: string;
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
            has_attachments, size_bytes, text_body, html_body_sanitized, headers_json
     FROM messages
     WHERE id = ? AND expires_at > ?`,
    )
        .bind(id, Date.now())
        .first<MessageRow>();

    if (!row) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    let attachments: AttachmentMeta[] = [];
    if (row.has_attachments === 1) {
        const att = await env.DB.prepare(
            `SELECT id, filename, content_type, size_bytes FROM attachments WHERE message_id = ?`,
        )
            .bind(row.id)
            .all<AttachmentRow>();
        attachments = (att.results ?? []).map((a) => ({
            id: a.id,
            filename: a.filename,
            contentType: a.content_type,
            sizeBytes: a.size_bytes,
        }));
    }

    let headers: Record<string, string | string[]>;
    try {
        headers = JSON.parse(row.headers_json);
    } catch {
        headers = {};
    }

    const detail: MessageDetail = {
        id: row.id,
        fromAddr: row.from_addr,
        fromName: row.from_name,
        subject: row.subject,
        receivedAt: row.received_at,
        expiresAt: row.expires_at,
        hasAttachments: row.has_attachments === 1,
        sizeBytes: row.size_bytes,
        textBody: row.text_body,
        htmlBody: row.html_body_sanitized,
        headers,
        attachments,
    };

    return NextResponse.json(detail, {
        headers: { 'cache-control': 'no-store, private' },
    });
}
