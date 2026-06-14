import type { Bindings } from './cf';

const WINDOW_SECONDS = 60;

export type RateLimitResult = {
    ok: boolean;
    remaining: number;
};

export async function rateLimit(
    env: Pick<Bindings, 'RATELIMIT_KV'>,
    ip: string,
    bucket: string,
    limit: number,
): Promise<RateLimitResult> {
    if (!env.RATELIMIT_KV) return { ok: true, remaining: limit };
    const minute = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
    const key = `rl:${bucket}:${ip}:${minute}`;
    const current = parseInt((await env.RATELIMIT_KV.get(key)) ?? '0', 10);
    if (current >= limit) return { ok: false, remaining: 0 };
    await env.RATELIMIT_KV.put(key, String(current + 1), {
        expirationTtl: WINDOW_SECONDS * 2,
    });
    return { ok: true, remaining: Math.max(0, limit - current - 1) };
}
