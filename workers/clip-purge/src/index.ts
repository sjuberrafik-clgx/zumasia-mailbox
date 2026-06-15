type Env = {
  CLIP_DB: D1Database;
  CLIP_BUCKET: R2Bucket;
};

const PURGE_BATCH_SIZE = 500;

type ExpiredRow = {
  id: string;
  r2_key: string | null;
};

async function purgeExpired(env: Env): Promise<{ clips: number; objects: number }> {
  const now = Date.now();
  const expired = await env.CLIP_DB.prepare(
    `SELECT id, r2_key FROM clips WHERE expires_at < ? LIMIT ?`,
  )
    .bind(now, PURGE_BATCH_SIZE)
    .all<ExpiredRow>();

  const rows = expired.results ?? [];
  if (rows.length === 0) return { clips: 0, objects: 0 };

  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');

  const r2Keys = rows.map((r) => r.r2_key).filter((k): k is string => Boolean(k));
  for (let i = 0; i < r2Keys.length; i += 1000) {
    await env.CLIP_BUCKET.delete(r2Keys.slice(i, i + 1000));
  }

  await env.CLIP_DB.prepare(`DELETE FROM clips WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run();

  return { clips: rows.length, objects: r2Keys.length };
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        try {
          const result = await purgeExpired(env);
          console.log(
            JSON.stringify({ evt: 'clip_purge_run', clips: result.clips, objects: result.objects }),
          );
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(JSON.stringify({ evt: 'clip_purge_error', err: errMsg }));
        }
      })(),
    );
  },
} satisfies ExportedHandler<Env>;
