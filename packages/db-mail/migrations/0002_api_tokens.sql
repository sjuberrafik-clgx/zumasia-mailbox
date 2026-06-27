-- Migration: 0002_api_tokens
-- API tokens for the Zumasia Mail automation API (v1).
-- Tokens are stored only as a salted SHA-256 hash; the plaintext is shown once
-- at mint time (see apps/web/scripts/mint-api-token.mjs) and never persisted.

CREATE TABLE api_tokens (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  rate_limit_per_min INTEGER NOT NULL DEFAULT 120,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  revoked INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER
);

CREATE UNIQUE INDEX idx_api_tokens_hash ON api_tokens(token_hash);
