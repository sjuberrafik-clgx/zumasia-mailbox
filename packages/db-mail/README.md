# @zumasia/db-mail

Schema and migrations for the Zumasia Mail D1 database.

## Initial setup (one-time)

```bash
# Create the D1 database (run from repo root)
pnpm --filter @zumasia/db-mail exec wrangler d1 create zumasia-mail
```

Copy the resulting `database_id` into every `wrangler.toml` that binds D1
(`workers/mail-ingest`, `workers/mail-purge`, `apps/web`).

## Apply migrations

```bash
pnpm db:migrate:local      # local dev (wrangler --local)
pnpm db:migrate:remote     # production
```
