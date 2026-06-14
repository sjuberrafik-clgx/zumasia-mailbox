import { v7 as uuidv7 } from 'uuid';
import { BLOCKED_ATTACHMENT_EXTENSIONS } from '@zumasia/shared/brand';
import type { Env } from './env.ts';
import type { ParsedAttachment, ParsedMail } from './parse.ts';

const SAFE_FILENAME_RE = /[^a-z0-9._-]+/gi;

function safeFilename(name: string): string {
  const cleaned = name.replace(SAFE_FILENAME_RE, '_').slice(0, 120);
  return cleaned || 'file';
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
}

function rawEmlKey(messageId: string): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `eml/${yyyy}/${mm}/${dd}/${messageId}.eml`;
}

function attachmentKey(messageId: string, index: number, filename: string): string {
  return `att/${messageId}/${index}-${safeFilename(filename)}`;
}

export type StoreInput = {
  env: Env;
  fullAddress: string;
  parsed: ParsedMail;
  rawEml: ArrayBuffer;
  sanitizedHtml: string;
  retentionMs: number;
};

export async function storeMessage(input: StoreInput): Promise<string> {
  const { env, fullAddress, parsed, rawEml, sanitizedHtml, retentionMs } = input;

  const id = uuidv7();
  const receivedAt = parsed.receivedAt;
  const expiresAt = receivedAt + retentionMs;
  const emlKey = rawEmlKey(id);

  await env.EML_BUCKET.put(emlKey, rawEml, {
    httpMetadata: { contentType: 'message/rfc822' },
  });

  const safeAttachments: Array<{
    id: string;
    attachment: ParsedAttachment;
    key: string;
  }> = [];

  for (let i = 0; i < parsed.attachments.length; i++) {
    const att = parsed.attachments[i]!;
    const ext = getExtension(att.filename);
    if (BLOCKED_ATTACHMENT_EXTENSIONS.has(ext)) continue;

    const key = attachmentKey(id, i, att.filename);
    await env.EML_BUCKET.put(key, att.content, {
      httpMetadata: { contentType: att.mimeType },
    });
    safeAttachments.push({ id: uuidv7(), attachment: att, key });
  }

  const senderDomain = parsed.fromAddr.includes('@')
    ? parsed.fromAddr.slice(parsed.fromAddr.indexOf('@') + 1)
    : null;

  const stmts: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO inboxes (address, last_message_at, message_count)
       VALUES (?, ?, 1)
       ON CONFLICT(address) DO UPDATE SET
         last_message_at = excluded.last_message_at,
         message_count = inboxes.message_count + 1`,
    ).bind(fullAddress, receivedAt),
    env.DB.prepare(
      `INSERT INTO messages (
         id, inbox_address, message_id, from_addr, from_name, subject,
         received_at, expires_at, size_bytes, has_attachments,
         text_body, html_body_sanitized, headers_json, raw_eml_key,
         sender_ip, sender_domain
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      fullAddress,
      parsed.messageId,
      parsed.fromAddr,
      parsed.fromName,
      parsed.subject,
      receivedAt,
      expiresAt,
      rawEml.byteLength,
      safeAttachments.length > 0 ? 1 : 0,
      parsed.text,
      sanitizedHtml || null,
      JSON.stringify(parsed.headers),
      emlKey,
      null,
      senderDomain,
    ),
    ...safeAttachments.map((a) =>
      env.DB.prepare(
        `INSERT INTO attachments (id, message_id, filename, content_type, size_bytes, r2_key)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(a.id, id, a.attachment.filename, a.attachment.mimeType, a.attachment.size, a.key),
    ),
  ];

  await env.DB.batch(stmts);
  return id;
}

export async function logIngestError(
  env: Env,
  source: string,
  message: string,
  context: Record<string, unknown>,
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO error_log (occurred_at, source, message, context_json) VALUES (?, ?, ?, ?)`,
    )
      .bind(Date.now(), source, message.slice(0, 500), JSON.stringify(context).slice(0, 2000))
      .run();
  } catch {
    // best-effort
  }
}
