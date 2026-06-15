-- Migration: 0001_init
-- Initial schema for the Zumasia Clipboard product (Cloudflare D1, SQLite dialect).
--
-- A "clip" is a one-time, short-lived payload shared between devices via a
-- 6-digit code. Codes are stored only as salted SHA-256 hashes. Text payloads
-- are stored inline; image/file payloads live in R2 and are referenced by key.

CREATE TABLE clips (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('text', 'image', 'file')),
  text_body TEXT,
  r2_key TEXT,
  filename TEXT,
  content_type TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  retrieved_at INTEGER,
  blob_token_hash TEXT,
  blob_token_expires_at INTEGER
);

-- Only one *active* (not yet retrieved) clip may hold a given code at a time.
-- Once retrieved_at is set the code is burned and the same code can be reused.
CREATE UNIQUE INDEX idx_clips_active_code
  ON clips(code_hash)
  WHERE retrieved_at IS NULL;

CREATE INDEX idx_clips_expires
  ON clips(expires_at);
