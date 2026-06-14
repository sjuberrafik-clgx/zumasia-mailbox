type Env = {
    DB: D1Database;
    EML_BUCKET: R2Bucket;
};

const PURGE_BATCH_SIZE = 500;
const IDLE_INBOX_MS = 7 * 24 * 60 * 60 * 1000;

type ExpiredRow = {
    id: string;
    raw_eml_key: string;
};

type AttachmentRow = {
    r2_key: string;
};

async function purgeExpired(env: Env): Promise<{ messages: number; objects: number }> {
    const now = Date.now();
    const expired = await env.DB.prepare(
        `SELECT id, raw_eml_key FROM messages WHERE expires_at < ? LIMIT ?`,
    )
        .bind(now, PURGE_BATCH_SIZE)
        .all<ExpiredRow>();

    const rows = expired.results ?? [];
    if (rows.length === 0) return { messages: 0, objects: 0 };

    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => '?').join(',');
    const atts = await env.DB.prepare(
        `SELECT r2_key FROM attachments WHERE message_id IN (${placeholders})`,
    )
        .bind(...ids)
        .all<AttachmentRow>();

    const r2Keys = [...rows.map((r) => r.raw_eml_key), ...(atts.results ?? []).map((a) => a.r2_key)];

    for (let i = 0; i < r2Keys.length; i += 1000) {
        const batch = r2Keys.slice(i, i + 1000);
        await env.EML_BUCKET.delete(batch);
    }

    await env.DB.prepare(`DELETE FROM messages WHERE id IN (${placeholders})`)
        .bind(...ids)
        .run();

    return { messages: rows.length, objects: r2Keys.length };
}

async function purgeIdleInboxes(env: Env): Promise<number> {
    const cutoff = Date.now() - IDLE_INBOX_MS;
    const result = await env.DB.prepare(
        `DELETE FROM inboxes WHERE last_message_at < ? AND message_count = 0`,
    )
        .bind(cutoff)
        .run();
    return result.meta.changes ?? 0;
}

export default {
    async scheduled(
        _controller: ScheduledController,
        env: Env,
        ctx: ExecutionContext,
    ): Promise<void> {
        ctx.waitUntil(
            (async () => {
                try {
                    const expired = await purgeExpired(env);
                    const idle = await purgeIdleInboxes(env);
                    console.log(
                        JSON.stringify({
                            evt: 'purge_run',
                            messages: expired.messages,
                            objects: expired.objects,
                            idle_inboxes: idle,
                        }),
                    );
                } catch (err) {
                    const errMsg = err instanceof Error ? err.message : String(err);
                    console.error(JSON.stringify({ evt: 'purge_error', err: errMsg }));
                }
            })(),
        );
    },
} satisfies ExportedHandler<Env>;
