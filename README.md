# Zumasia

> Useful tiny tools — no account needed.

Zumasia is a multi-product brand starting with **Mail**: public, free, anonymous,
disposable inboxes at `*@zumasia.com`. Anyone can lookup any address and read its
mail until auto-purge (8h). Mailinator-style.

This is a `$0/month` Cloudflare-only stack: Workers + D1 + R2 + Pages, deployed
via the OpenNext Cloudflare adapter.

## Repo layout

```
apps/
  web/                 Next.js 16 (App Router) — umbrella + Mail UI + read API
workers/
  mail-ingest/         Email Worker — receives, parses, sanitizes, stores
  mail-purge/          Cron Worker — every 15 min, purges expired mail + R2 objects
packages/
  shared/              Zod schemas, address normalizer, HTML sanitizer, brand consts
  ui/                  Shared design system (header, footer, logo, products registry)
  db-mail/             D1 schema + migrations
.github/workflows/
  ci.yml               typecheck / lint / test / build on PR
  deploy.yml           apply migrations + deploy workers + deploy web on main
```

## One-time setup

### 1. Install

```bash
pnpm install
```

### 2. Domain (Cloudflare Registrar)

`zumasia.com` is registered with **Cloudflare Registrar**, so it is already on
Cloudflare DNS — no nameserver changes needed. Confirm the zone is active under
the correct account: `wrangler whoami` should list the account that owns the
domain. (If you have multiple Cloudflare accounts, set `CLOUDFLARE_ACCOUNT_ID`
so Wrangler creates D1/R2/KV in the same account as the zone.)

### 3. Cloudflare DNS, Email, and resources

```bash
# Login
wrangler login

# Create resources
wrangler d1 create zumasia-mail
wrangler r2 bucket create zumasia-mail-eml
wrangler kv namespace create zumasia-mail-ratelimit
```

Copy the `database_id` (D1) and `id` (KV) into the `wrangler.toml` files in
`workers/mail-ingest/`, `workers/mail-purge/`, and `apps/web/` (uncomment the
`[[d1_databases]]` / `[[r2_buckets]]` / `[[kv_namespaces]]` blocks).

### 4. DNS records (Cloudflare dashboard)

- **MX + SPF**: enable Email Routing on `zumasia.com` (Compute → Email Service
  → Email Routing → Onboard Domain). Cloudflare auto-adds MX and SPF.
- **DMARC**: TXT record `_dmarc` →
  `v=DMARC1; p=none; rua=mailto:dmarc@zumasia.com`.
- **Reserved address rules** (set BEFORE catch-all) — forward each to your real
  Gmail: `postmaster@`, `abuse@`, `dmarc@`, `support@`, `hello@`, `admin@`,
  `dmca@`, `legal@`, `privacy@`.
- **Catch-all rule**: `*@zumasia.com` → "Send to Worker" → `zumasia-mail-ingest`
  (set this AFTER deploying the worker the first time).

### 5. Apply migrations

```bash
pnpm db:migrate:local   # against local D1 (.wrangler/state)
pnpm db:migrate:remote  # against production D1
```

### 6. Local dev

```bash
pnpm dev               # Next.js on http://localhost:3000
```

For workers (full bindings) use `wrangler dev` from each worker directory.

### 7. Deploy

```bash
pnpm deploy:ingest     # workers/mail-ingest
pnpm deploy:purge      # workers/mail-purge
pnpm deploy:web        # apps/web (via OpenNext Cloudflare)
```

CI on `main` does this automatically once you set repo secrets:

- `CLOUDFLARE_API_TOKEN` (with Workers + Pages + D1 + R2 edit scopes)
- `CLOUDFLARE_ACCOUNT_ID`

## Cost

`$0/month` while inside Cloudflare free-tier limits (Workers 100k req/day, D1
5 GB / 5M reads-day, R2 10 GB, KV 1k writes/day, Cron unlimited).

Upgrade triggers documented in the session plan.

## Verification checklist (after deploy)

1. `dig MX zumasia.com` and `dig TXT zumasia.com` show CF MX + SPF + DMARC.
2. Send mail from Gmail to `test@zumasia.com` → row in D1 within 10 s,
   raw eml in R2, viewable at `/inbox/test`.
3. `postmaster@zumasia.com` forwards to your Gmail (NOT in D1).
4. XSS payloads in email HTML do not execute when viewed.
5. PDF attachment downloads with `Content-Disposition: attachment`.
6. New mail appears in UI within 5 s without page refresh.
7. Tab in background → polling pauses (CF dashboard req count drops).
8. Hammer `/api/inbox/x` >60 rpm → 429.
9. `wrangler d1 execute zumasia-mail --command "SELECT count(*) FROM messages"` works.
10. Lighthouse `/` and `/mail` both >90 on mobile.

## Roadmap

- v1.1: real-time SSE (after $5/mo Workers Paid + Durable Objects upgrade)
- v1.x: API keys, webhooks, private domains, Zumasia accounts
- v2: Clipboard product on `clip.zumasia.com`

See `/memories/session/plan.md` (private) for the full plan.
