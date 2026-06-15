import { sanitizeMessageHtml } from '@zumasia/shared/sanitize';
import { normalizeLocalPart, fullAddressFromLocalPart } from '@zumasia/shared/address';
import { MAX_MESSAGE_BYTES, RETENTION_HOURS } from '@zumasia/shared/brand';
import type { Env } from './env.ts';
import { parseMail } from './parse.ts';
import { checkBlocklist } from './blocklist.ts';
import { storeMessage, logIngestError } from './store.ts';

const RETENTION_MS = RETENTION_HOURS * 60 * 60 * 1000;

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    if (message.rawSize > MAX_MESSAGE_BYTES) {
      console.warn(`Message too large: ${message.rawSize} bytes from ${message.from} to ${message.to}`);
      ctx.waitUntil(
        logIngestError(env, 'mail-ingest', 'Message too large', {
          inbox: message.to,
          from: message.from,
          size: message.rawSize,
        }),
      );
      message.setReject('Message too large');
      return;
    }

    const localPart = normalizeLocalPart(message.to);
    if (!localPart) {
      console.warn(`Invalid recipient: ${message.to}`);
      message.setReject('Invalid recipient');
      return;
    }
    const fullAddress = fullAddressFromLocalPart(localPart);

    try {
      const block = await checkBlocklist(env, message.from.toLowerCase());
      if (block) {
        message.setReject(`Blocked sender (${block.kind})`);
        return;
      }

      const rawEml = await new Response(message.raw).arrayBuffer();
      const parsed = await parseMail(new Response(rawEml).body as ReadableStream<Uint8Array>);

      const sanitizedHtml = parsed.html ? sanitizeMessageHtml(parsed.html) : '';

      const messageId = await storeMessage({
        env,
        fullAddress,
        parsed,
        rawEml,
        sanitizedHtml,
        retentionMs: RETENTION_MS,
      });

      ctx.waitUntil(
        Promise.resolve().then(() => {
          console.log(
            JSON.stringify({
              evt: 'mail_ingested',
              id: messageId,
              inbox: fullAddress,
              from: parsed.fromAddr,
              size: rawEml.byteLength,
              attachments: parsed.attachments.length,
            }),
          );
        }),
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ evt: 'ingest_error', inbox: fullAddress, err: errMsg }));
      ctx.waitUntil(
        logIngestError(env, 'mail-ingest', errMsg, {
          inbox: fullAddress,
          from: message.from,
        }),
      );
      message.setReject('Temporary failure, please retry');
    }
  },
} satisfies ExportedHandler<Env>;
