import { BLOCKED_ATTACHMENT_EXTENSIONS } from '@zumasia/shared/brand';
import type { AttachmentMeta, MessageDetail, MessageSummary } from '@zumasia/shared/schemas';
import { sanitizeMessageHtml } from '@zumasia/shared/sanitize';
import PostalMime from 'postal-mime';
import type { Bindings } from './cf';

type SummaryRow = {
  id: string;
  from_addr: string;
  from_name: string | null;
  subject: string | null;
  received_at: number;
  expires_at: number;
  has_attachments: number;
  size_bytes: number;
};

type DetailRow = SummaryRow & {
  inbox_address: string;
  raw_eml_key: string;
};

export type InboxQuery = {
  limit: number;
  skip: number;
  since?: number | null;
  from?: string | null;
  subject?: string | null;
};

function toSummary(row: SummaryRow): MessageSummary {
  return {
    id: row.id,
    fromAddr: row.from_addr,
    fromName: row.from_name,
    subject: row.subject,
    receivedAt: row.received_at,
    expiresAt: row.expires_at,
    hasAttachments: row.has_attachments === 1,
    sizeBytes: row.size_bytes,
  };
}

/** Escape LIKE wildcards in user input so filters do substring matching only. */
function likeContains(value: string): string {
  const escaped = value.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escaped}%`;
}

function getExt(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
}

/** List non-expired messages for an inbox, newest first, with optional filters. */
export async function listInboxMessages(
  env: Pick<Bindings, 'DB'>,
  fullAddress: string,
  query: InboxQuery,
): Promise<MessageSummary[]> {
  const clauses = ['inbox_address = ?', 'expires_at > ?'];
  const binds: unknown[] = [fullAddress, Date.now()];

  if (query.since != null) {
    clauses.push('received_at > ?');
    binds.push(query.since);
  }
  if (query.from) {
    clauses.push("lower(from_addr) LIKE ? ESCAPE '\\'");
    binds.push(likeContains(query.from));
  }
  if (query.subject) {
    clauses.push("lower(subject) LIKE ? ESCAPE '\\'");
    binds.push(likeContains(query.subject));
  }

  binds.push(query.limit, query.skip);
  const sql =
    `SELECT id, from_addr, from_name, subject, received_at, expires_at, has_attachments, size_bytes
     FROM messages
     WHERE ${clauses.join(' AND ')}
     ORDER BY received_at DESC
     LIMIT ? OFFSET ?`;

  const result = await env.DB.prepare(sql).bind(...binds).all<SummaryRow>();
  return (result.results ?? []).map(toSummary);
}

/** Fetch and parse a single non-expired message into a full MessageDetail. */
export async function getMessageDetail(
  env: Pick<Bindings, 'DB' | 'EML_BUCKET'>,
  id: string,
): Promise<MessageDetail | null> {
  const row = await env.DB.prepare(
    `SELECT id, inbox_address, from_addr, from_name, subject, received_at, expires_at,
            has_attachments, size_bytes, raw_eml_key
     FROM messages
     WHERE id = ? AND expires_at > ?`,
  )
    .bind(id, Date.now())
    .first<DetailRow>();
  if (!row) return null;

  const emlObj = await env.EML_BUCKET.get(row.raw_eml_key);
  if (!emlObj) return null;

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

  const headers: Record<string, string | string[]> = {};
  if (parsed.headers) {
    for (const h of parsed.headers) {
      const key = h.key.toLowerCase();
      const val = h.value;
      const existing = headers[key];
      if (existing === undefined) headers[key] = val;
      else if (Array.isArray(existing)) existing.push(val);
      else headers[key] = [existing, val];
    }
  }

  return {
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
}

export type AttachmentResult =
  | { ok: true; filename: string; contentType: string; content: ArrayBuffer }
  | { ok: false; reason: 'not_found' | 'blocked_type' };

/** Resolve a single attachment's bytes by message id + zero-based index. */
export async function getAttachment(
  env: Pick<Bindings, 'DB' | 'EML_BUCKET'>,
  messageId: string,
  index: number,
): Promise<AttachmentResult> {
  const msg = await env.DB.prepare(`SELECT raw_eml_key FROM messages WHERE id = ? AND expires_at > ?`)
    .bind(messageId, Date.now())
    .first<{ raw_eml_key: string }>();
  if (!msg) return { ok: false, reason: 'not_found' };

  const obj = await env.EML_BUCKET.get(msg.raw_eml_key);
  if (!obj) return { ok: false, reason: 'not_found' };

  const buffer = await new Response(obj.body).arrayBuffer();
  const parsed = await PostalMime.parse(buffer);

  const att = parsed.attachments?.[index];
  if (!att || !att.content) return { ok: false, reason: 'not_found' };

  const filename = att.filename || `attachment-${index}`;
  if (BLOCKED_ATTACHMENT_EXTENSIONS.has(getExt(filename))) return { ok: false, reason: 'blocked_type' };

  // Normalize to a standalone ArrayBuffer (a fresh, offset-0, full-length allocation).
  let bytes: Uint8Array;
  if (typeof att.content === 'string') bytes = new TextEncoder().encode(att.content);
  else if (att.content instanceof Uint8Array) bytes = new Uint8Array(att.content);
  else bytes = new Uint8Array(att.content as ArrayBuffer);

  return {
    ok: true,
    filename,
    contentType: att.mimeType || 'application/octet-stream',
    content: bytes.buffer as ArrayBuffer,
  };
}
