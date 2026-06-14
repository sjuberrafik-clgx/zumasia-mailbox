import type { Env } from './env.ts';

export type BlocklistMatch = {
  pattern: string;
  kind: 'domain' | 'address' | 'ip';
  reason: string | null;
};

export async function checkBlocklist(env: Env, fromAddr: string): Promise<BlocklistMatch | null> {
  const at = fromAddr.indexOf('@');
  const domain = at === -1 ? '' : fromAddr.slice(at + 1);
  const candidates = [fromAddr, domain].filter(Boolean);
  if (!candidates.length) return null;

  const placeholders = candidates.map(() => '?').join(',');
  const result = await env.DB.prepare(
    `SELECT pattern, kind, reason FROM blocklist WHERE pattern IN (${placeholders}) LIMIT 1`,
  )
    .bind(...candidates)
    .first<{ pattern: string; kind: 'domain' | 'address' | 'ip'; reason: string | null }>();

  return result ?? null;
}
