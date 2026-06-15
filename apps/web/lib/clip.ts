import type { Bindings } from './cf';

/** Local-dev fallback pepper. In production set CLIP_CODE_PEPPER via `wrangler secret`. */
const DEV_PEPPER = 'zumasia-clip-dev-pepper';

export function clipPepper(env: Pick<Bindings, 'CLIP_CODE_PEPPER'>): string {
  return env.CLIP_CODE_PEPPER || DEV_PEPPER;
}

export function clipBlobKey(id: string): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `clip/${yyyy}/${mm}/${dd}/${id}`;
}
