-- Migration: 0001_init
-- Initial schema for the Zumasia Mail product (Cloudflare D1, SQLite dialect).

CREATE TABLE inboxes (
  address TEXT PRIMARY KEY,
  last_message_at INTEGER NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  inbox_address TEXT NOT NULL REFERENCES inboxes(address),
  message_id TEXT,
  from_addr TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  received_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL,
  has_attachments INTEGER NOT NULL DEFAULT 0,
  text_body TEXT,
  html_body_sanitized TEXT,
  headers_json TEXT NOT NULL,
  raw_eml_key TEXT NOT NULL,
  sender_ip TEXT,
  sender_domain TEXT
);

CREATE INDEX idx_messages_inbox_received
  ON messages(inbox_address, received_at DESC);

CREATE INDEX idx_messages_expires
  ON messages(expires_at);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  r2_key TEXT NOT NULL
);

CREATE INDEX idx_attachments_message ON attachments(message_id);

CREATE TABLE blocklist (
  pattern TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('domain','address','ip')),
  reason TEXT,
  added_at INTEGER NOT NULL
);

CREATE TABLE error_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at INTEGER NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  context_json TEXT
);

CREATE INDEX idx_error_log_occurred ON error_log(occurred_at DESC);
