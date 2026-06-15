import { getCloudflareContext } from '@opennextjs/cloudflare';

export type Bindings = {
  DB: D1Database;
  EML_BUCKET: R2Bucket;
  RATELIMIT_KV: KVNamespace;
  CLIP_DB: D1Database;
  CLIP_BUCKET: R2Bucket;
  CLIP_CODE_PEPPER?: string;
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
