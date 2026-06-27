-- Migration: 0003_api_token_requests
-- Self-service API token requests gated by admin approval. The API token itself
-- is only minted at claim time (after approval) — see apps/web/app/api/v1/tokens/*.
-- Only a salted hash of the one-time claim code is stored here.

CREATE TABLE api_token_requests (
  id TEXT PRIMARY KEY,
  claim_hash TEXT NOT NULL,
  label TEXT,
  contact TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'claimed')),
  rate_limit_per_min INTEGER NOT NULL DEFAULT 120,
  expires_days INTEGER,
  created_at INTEGER NOT NULL,
  decided_at INTEGER,
  claimed_at INTEGER,
  token_id TEXT,
  ip TEXT
);

CREATE INDEX idx_token_requests_status ON api_token_requests(status, created_at DESC);
