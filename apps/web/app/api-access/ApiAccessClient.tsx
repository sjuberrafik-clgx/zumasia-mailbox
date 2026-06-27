'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

type RequestResult = { requestId: string; claimCode: string };
type ClaimResult = {
  status: 'pending' | 'approved' | 'denied' | 'claimed';
  token?: string;
  tokenId?: string;
  rateLimitPerMin?: number;
  expiresAt?: number | null;
};

export function ApiAccessClient() {
  const [label, setLabel] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [reqBusy, setReqBusy] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);
  const [reqResult, setReqResult] = useState<RequestResult | null>(null);

  const [requestId, setRequestId] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    if (document.querySelector(`script[src="${TURNSTILE_SRC}"]`)) return;
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  async function submitRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setReqBusy(true);
    setReqError(null);
    setReqResult(null);
    try {
      let turnstileToken: string | null = null;
      if (SITE_KEY) {
        const input = form.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]');
        turnstileToken = input?.value || null;
        if (!turnstileToken) {
          setReqError('Please complete the verification challenge.');
          return;
        }
      }
      const res = await fetch('/api/v1/tokens/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label, email, reason, turnstileToken }),
      });
      const data = (await res.json()) as { requestId?: string; claimCode?: string; error?: { message?: string } };
      if (!res.ok || !data.requestId || !data.claimCode) {
        setReqError(data.error?.message ?? 'Request failed. Please try again.');
        return;
      }
      setReqResult({ requestId: data.requestId, claimCode: data.claimCode });
      setRequestId(data.requestId);
      setClaimCode(data.claimCode);
    } catch {
      setReqError('Network error. Please try again.');
    } finally {
      setReqBusy(false);
    }
  }

  async function submitClaim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClaimBusy(true);
    setClaimError(null);
    setClaimResult(null);
    try {
      const res = await fetch('/api/v1/tokens/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: requestId.trim(), claimCode: claimCode.trim() }),
      });
      const data = (await res.json()) as ClaimResult & { error?: { message?: string } };
      if (!res.ok) {
        setClaimError(data.error?.message ?? 'Claim failed. Check your request id and claim code.');
        return;
      }
      setClaimResult(data);
    } catch {
      setClaimError('Network error. Please try again.');
    } finally {
      setClaimBusy(false);
    }
  }

  return (
    <div className="zm-container api-access">
      <header className="api-access__head">
        <p className="hero__eyebrow">Mail Automation API</p>
        <h1>Get an API token</h1>
        <p>
          Request access below. An admin reviews each request, and once approved you can claim your
          token here — it is shown only once. Already have a token?{' '}
          <a href="/api-docs">Read the API reference</a>.
        </p>
      </header>

      <div className="api-access__grid">
        <section className="api-access__card" aria-labelledby="req-h">
          <h2 id="req-h">1 · Request access</h2>
          <form className="api-access__form" onSubmit={submitRequest}>
            <div className="api-access__field">
              <label htmlFor="aa-label">Project / label</label>
              <input
                id="aa-label"
                className="api-access__input"
                type="text"
                value={label}
                maxLength={80}
                placeholder="Acme QA suite"
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="api-access__field">
              <label htmlFor="aa-email">Contact email *</label>
              <input
                id="aa-email"
                className="api-access__input"
                type="email"
                required
                value={email}
                maxLength={160}
                placeholder="you@company.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="api-access__field">
              <label htmlFor="aa-reason">Reason / use case *</label>
              <textarea
                id="aa-reason"
                className="api-access__textarea"
                required
                value={reason}
                maxLength={600}
                placeholder="Automating signup OTP checks in CI."
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            {SITE_KEY ? <div className="cf-turnstile" data-sitekey={SITE_KEY} /> : null}
            <button className="zm-button" type="submit" disabled={reqBusy}>
              {reqBusy ? 'Submitting…' : 'Request access'}
            </button>
            {reqError ? <p className="api-access__error" role="alert">{reqError}</p> : null}
          </form>

          {reqResult ? (
            <div className="api-access__result" role="status">
              <p className="api-access__warn">Save these now — the claim code is shown only once.</p>
              <label className="api-access__note">Request id</label>
              <code className="api-access__code">{reqResult.requestId}</code>
              <label className="api-access__note">Claim code</label>
              <code className="api-access__code">{reqResult.claimCode}</code>
              <p className="api-access__note">
                Your request is <strong>pending approval</strong>. Once an admin approves it, use the
                claim panel to reveal your token.
              </p>
            </div>
          ) : null}
        </section>

        <section className="api-access__card" aria-labelledby="claim-h">
          <h2 id="claim-h">2 · Claim your token</h2>
          <p className="api-access__note">
            After approval, paste your request id and claim code to reveal your token (once).
          </p>
          <form className="api-access__form" onSubmit={submitClaim}>
            <div className="api-access__field">
              <label htmlFor="aa-reqid">Request id</label>
              <input
                id="aa-reqid"
                className="api-access__input"
                type="text"
                required
                value={requestId}
                placeholder="req_…"
                onChange={(e) => setRequestId(e.target.value)}
              />
            </div>
            <div className="api-access__field">
              <label htmlFor="aa-claim">Claim code</label>
              <input
                id="aa-claim"
                className="api-access__input"
                type="text"
                required
                value={claimCode}
                placeholder="zmclaim_…"
                onChange={(e) => setClaimCode(e.target.value)}
              />
            </div>
            <button className="zm-button" type="submit" disabled={claimBusy}>
              {claimBusy ? 'Checking…' : 'Claim token'}
            </button>
            {claimError ? <p className="api-access__error" role="alert">{claimError}</p> : null}
          </form>

          {claimResult ? (
            <div className="api-access__result" role="status">
              {claimResult.status === 'approved' && claimResult.token ? (
                <>
                  <p className="api-access__warn">Your token — copy it now, it won&apos;t be shown again.</p>
                  <code className="api-access__code">{claimResult.token}</code>
                  <p className="api-access__note">
                    Rate limit: {claimResult.rateLimitPerMin}/min ·{' '}
                    {claimResult.expiresAt ? `expires ${new Date(claimResult.expiresAt).toISOString()}` : 'no expiry'}
                  </p>
                  <label className="api-access__note">Try it</label>
                  <code className="api-access__code">
                    curl -H &quot;Authorization: Bearer {claimResult.token}&quot;
                    https://zumasia.com/api/v1/inboxes/test/messages
                  </code>
                </>
              ) : claimResult.status === 'pending' ? (
                <p className="api-access__note">Still pending admin approval. Check back later.</p>
              ) : claimResult.status === 'denied' ? (
                <p className="api-access__note">This request was denied.</p>
              ) : (
                <p className="api-access__note">
                  Already claimed — the token was issued once and can&apos;t be shown again.
                </p>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
