import { NextResponse } from 'next/server';
import { BLOCKED_ATTACHMENT_EXTENSIONS } from '@zumasia/shared/brand';
import { bindings, getClientIp } from '@/lib/cf';
import { rateLimit } from '@/lib/ratelimit';
import PostalMime from 'postal-mime';

type Params = { id: string };

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
    // Expected id format: "messageid-index"
    const lastDash = id.lastIndexOf('-');
    if (lastDash === -1) {
        return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }
    const messageId = id.slice(0, lastDash);
    const attIndex = parseInt(id.slice(lastDash + 1), 10);

    const msg = await env.DB.prepare(
        `SELECT raw_eml_key FROM messages WHERE id = ? AND expires_at > ?`
    )
        .bind(messageId, Date.now())
        .first<{ raw_eml_key: string }>();

    if (!msg) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const obj = await env.EML_BUCKET.get(msg.raw_eml_key);
    if (!obj) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const buffer = await new Response(obj.body).arrayBuffer();
    const parsed = await PostalMime.parse(buffer);

    const att = parsed.attachments?.[attIndex];
    if (!att || !att.content) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const filename = att.filename || `attachment-${attIndex}`;
    if (BLOCKED_ATTACHMENT_EXTENSIONS.has(getExt(filename))) {
        return NextResponse.json({ error: 'blocked_type' }, { status: 403 });
    }

    const safeName = filename.replace(/"/g, '').slice(0, 200);
    return new Response(att.content as any, {
        headers: {
            'content-type': att.mimeType || 'application/octet-stream',
            'content-disposition': `attachment; filename="${safeName}"`,
            'x-content-type-options': 'nosniff',
            'cache-control': 'private, max-age=300',
        },
    });
}
