-- Optional dev seed data. Run with:
--   wrangler d1 execute zumasia-mail --local --file=seed.sql

INSERT INTO blocklist (pattern, kind, reason, added_at)
VALUES ('example-spam.test', 'domain', 'dev seed', strftime('%s', 'now') * 1000);
