import { z } from 'zod';

// ---------------------------------------------------------------------------
// Clipboard product constants
// ---------------------------------------------------------------------------

export const CLIP_CODE_LENGTH = 6;
/** How long a clip stays retrievable before it auto-expires. */
export const CLIP_TTL_MS = 5 * 60 * 1000;
/** One-time blob download token lifetime, handed out at retrieve time. */
export const CLIP_BLOB_TOKEN_TTL_MS = 2 * 60 * 1000;

/** Max inline text payload (UTF-8 bytes). */
export const MAX_CLIP_TEXT_BYTES = 100 * 1024; // 100 KB
/** Max binary payload (image or file). */
export const MAX_CLIP_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Image content types eligible for inline preview. SVG is intentionally excluded. */
export const CLIP_IMAGE_CONTENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

export const CLIP_KINDS = ['text', 'image', 'file'] as const;
export type ClipKind = (typeof CLIP_KINDS)[number];

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically-random numeric code of CLIP_CODE_LENGTH digits.
 * Uses rejection sampling so every code in the range is equally likely.
 */
export function generateClipCode(): string {
  const max = 10 ** CLIP_CODE_LENGTH; // exclusive upper bound
  const limit = Math.floor(0xffffffff / max) * max; // largest unbiased multiple
  const buf = new Uint32Array(1);
  let n: number;
  do {
    crypto.getRandomValues(buf);
    n = buf[0]!;
  } while (n >= limit);
  return String(n % max).padStart(CLIP_CODE_LENGTH, '0');
}

const CLIP_CODE_REGEX = new RegExp(`^[0-9]{${CLIP_CODE_LENGTH}}$`);

export function isValidClipCode(code: string): boolean {
  return CLIP_CODE_REGEX.test(code);
}

// ---------------------------------------------------------------------------
// Hashing (codes and blob tokens are never stored in plaintext)
// ---------------------------------------------------------------------------

/** SHA-256 hex digest of `value` salted with a server-side pepper. */
export async function hashWithPepper(value: string, pepper: string): Promise<string> {
  const data = new TextEncoder().encode(`${pepper}:${value}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// API schemas
// ---------------------------------------------------------------------------

export const clipCreateResponseSchema = z.object({
  code: z.string(),
  kind: z.enum(CLIP_KINDS),
  expiresAt: z.number().int(),
});
export type ClipCreateResponse = z.infer<typeof clipCreateResponseSchema>;

export const clipRetrieveResponseSchema = z.object({
  kind: z.enum(CLIP_KINDS),
  text: z.string().nullable(),
  filename: z.string().nullable(),
  contentType: z.string().nullable(),
  sizeBytes: z.number().int().nullable(),
  // Present for image/file kinds: a one-time URL to fetch the blob.
  blobUrl: z.string().nullable(),
  isImage: z.boolean(),
});
export type ClipRetrieveResponse = z.infer<typeof clipRetrieveResponseSchema>;
