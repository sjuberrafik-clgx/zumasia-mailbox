import { NextResponse } from 'next/server';
import { BLOCKED_ATTACHMENT_EXTENSIONS } from '@zumasia/shared/brand';
import { bindings, getClientIp } from '@/lib/cf';
import { rateLimit } from '@/lib/ratelimit';

type Params = { id: string };

type AttachmentRow = {
    id: string;
    filename: string;
    content_type: string;
    size_bytes: number;
    r2_key: string;
};

function getExt(filename: string): string {
    const dot = filename.lastIndexOf('.');
    return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
}

export async function GET(req: Request, ctx: { params: Promise<Params> }) {
    const env = bindings();
    const ip = getClientIp(req);

    const rl = await rateLimit(env, ip, 'attachment', 20);
    if (!rl.ok) {
        return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const { id } = await ctx.params;
    const att = await env.DB.prepare(
        `SELECT a.id, a.filename, a.content_type, a.size_bytes, a.r2_key
     FROM attachments a JOIN messages m ON m.id = a.message_id
     WHERE a.id = ? AND m.expires_at > ?`,
    )
        .bind(id, Date.now())
        .first<AttachmentRow>();

    if (!att) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (BLOCKED_ATTACHMENT_EXTENSIONS.has(getExt(att.filename))) {
        return NextResponse.json({ error: 'blocked_type' }, { status: 403 });
    }

    const obj = await env.EML_BUCKET.get(att.r2_key);
    if (!obj) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const safeName = att.filename.replace(/"/g, '').slice(0, 200);
    return new Response(obj.body, {
        headers: {
            'content-type': 'application/octet-stream',
            'content-disposition': `attachment; filename="${safeName}"`,
            'x-content-type-options': 'nosniff',
            'cache-control': 'private, max-age=300',
        },
    });
}
