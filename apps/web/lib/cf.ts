import { getCloudflareContext } from '@opennextjs/cloudflare';

export type Bindings = {
  DB: D1Database;
  EML_BUCKET: R2Bucket;
  RATELIMIT_KV: KVNamespace;
  CLIP_DB: D1Database;
  CLIP_BUCKET: R2Bucket;
  CLIP_CODE_PEPPER?: string;
  API_TOKEN_PEPPER?: string;
  ADMIN_API_TOKEN?: string;
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  ADMIN_NOTIFY_TO?: string;
  NOTIFY_FROM?: string;
};

export function bindings(): Bindings {
  return getCloudflareContext().env as unknown as Bindings;
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/**
 * Run a promise in the background without blocking the response. Uses the
 * Cloudflare execution context's waitUntil when available (production), and
 * otherwise lets the promise run best-effort (local dev / build).
 */
export function waitUntil(promise: Promise<unknown>): void {
  try {
    getCloudflareContext().ctx.waitUntil(promise);
  } catch {
    void promise;
  }
}

export type Geo = {
  country: string | null;
  region: string | null;
};

/**
 * Resolve the visitor's country + region from Cloudflare geo data.
 *
 * Prefers the structured `cf` object from the Cloudflare context and falls back
 * to request headers (`cf-ipcountry` / `cf-region`). Tolerant of missing data in
 * local dev, where it returns nulls.
 */
export function getGeo(req: Request): Geo {
  let country: string | null = null;
  let region: string | null = null;

  try {
    const cf = getCloudflareContext().cf as
      | { country?: string; region?: string; regionCode?: string }
      | undefined;
    if (cf) {
      country = cf.country ?? null;
      region = cf.region ?? null;
    }
  } catch {
    // No Cloudflare context (e.g. local dev) — fall back to headers below.
  }

  country = country ?? req.headers.get('cf-ipcountry');
  region = region ?? req.headers.get('cf-region');

  // Cloudflare uses 'XX'/'T1' for unknown/Tor; treat as no signal.
  if (country === 'XX' || country === 'T1') country = null;

  return { country, region };
}
