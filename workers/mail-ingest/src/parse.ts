import PostalMime from 'postal-mime';

export type ParsedAttachment = {
    filename: string;
    mimeType: string;
    content: Uint8Array;
    size: number;
};

export type ParsedMail = {
    messageId: string | null;
    fromAddr: string;
    fromName: string | null;
    to: string[];
    subject: string | null;
    text: string | null;
    html: string | null;
    headers: Record<string, string | string[]>;
    receivedAt: number;
    attachments: ParsedAttachment[];
};

export async function parseMail(raw: ReadableStream<Uint8Array>): Promise<ParsedMail> {
    const buffer = await new Response(raw).arrayBuffer();
    const parsed = await PostalMime.parse(buffer);

    const headers: Record<string, string | string[]> = {};
    for (const h of parsed.headers ?? []) {
        const key = h.key.toLowerCase();
        const existing = headers[key];
        if (existing === undefined) {
            headers[key] = h.value;
        } else if (Array.isArray(existing)) {
            existing.push(h.value);
        } else {
            headers[key] = [existing, h.value];
        }
    }

    const fromAddr = parsed.from?.address?.toLowerCase() ?? '';
    const fromName = parsed.from?.name ?? null;

    const to = (parsed.to ?? [])
        .map((a) => a.address?.toLowerCase())
        .filter((a): a is string => Boolean(a));

    const attachments: ParsedAttachment[] = (parsed.attachments ?? []).map((a) => {
        const content =
            a.content instanceof Uint8Array ? a.content : new Uint8Array(a.content as ArrayBuffer);
        return {
            filename: a.filename ?? 'attachment',
            mimeType: a.mimeType ?? 'application/octet-stream',
            content,
            size: content.byteLength,
        };
    });

    const dateHeader = parsed.date ? Date.parse(parsed.date) : NaN;
    const receivedAt = Number.isFinite(dateHeader) ? dateHeader : Date.now();

    return {
        messageId: parsed.messageId ?? null,
        fromAddr,
        fromName,
        to,
        subject: parsed.subject ?? null,
        text: parsed.text ?? null,
        html: parsed.html ?? null,
        headers,
        receivedAt,
        attachments,
    };
}
