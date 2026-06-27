'use client';

import { useState } from 'react';

type Status = 'pending' | 'approved' | 'denied' | 'claimed';

type Props = {
  id: string;
  exp: string;
  sig: string;
  label: string | null;
  contact: string | null;
  reason: string | null;
  status: Status;
};

export function ReviewClient(props: Props) {
  const [status, setStatus] = useState<Status>(props.status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [rate, setRate] = useState('120');
  const [days, setDays] = useState('');

  async function act(kind: 'approve' | 'deny') {
    setBusy(true);
    setMsg(null);
    const qs = `exp=${encodeURIComponent(props.exp)}&sig=${encodeURIComponent(props.sig)}`;
    const init: RequestInit = { method: 'POST' };
    if (kind === 'approve') {
      init.headers = { 'content-type': 'application/json' };
      init.body = JSON.stringify({
        rateLimitPerMin: Number(rate) || 120,
        expiresDays: days ? Number(days) : null,
      });
    }
    try {
      const res = await fetch(`/api/v1/admin/token-requests/${props.id}/${kind}?${qs}`, init);
      const data = (await res.json()) as { status?: Status; error?: { message?: string } };
      if (!res.ok) {
        setMsg(data.error?.message ?? 'Action failed.');
      } else {
        setStatus(data.status ?? status);
        setMsg(kind === 'approve' ? 'Approved — the requester can now claim their token.' : 'Denied.');
      }
    } catch {
      setMsg('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const decided = status !== 'pending';

  return (
    <div className="zm-container api-access">
      <header className="api-access__head">
        <p className="hero__eyebrow">Admin review</p>
        <h1>API token request</h1>
        <p>Review the details, then approve or deny this request.</p>
      </header>

      <div className="api-access__grid">
        <section className="api-access__card">
          <h2>Request details</h2>
          <p className="api-access__note">Label</p>
          <code className="api-access__code">{props.label || '(no label)'}</code>
          <p className="api-access__note">Contact</p>
          <code className="api-access__code">{props.contact || '(no contact)'}</code>
          <p className="api-access__note">Reason</p>
          <code className="api-access__code">{props.reason || '(no reason)'}</code>
          <p className="api-access__note">Request id · status</p>
          <code className="api-access__code">
            {props.id} · {status}
          </code>
        </section>

        <section className="api-access__card">
          <h2>Decision</h2>
          {decided ? (
            <p className="api-access__note">
              This request is <strong>{status}</strong>. No further action needed.
            </p>
          ) : (
            <div className="api-access__form">
              <div className="api-access__field">
                <label htmlFor="rv-rate">Rate limit (per minute)</label>
                <input
                  id="rv-rate"
                  className="api-access__input"
                  type="number"
                  min={1}
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
              <div className="api-access__field">
                <label htmlFor="rv-days">Expires in days (blank = never)</label>
                <input
                  id="rv-days"
                  className="api-access__input"
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>
              <div className="api-access__actions">
                <button className="zm-button" type="button" disabled={busy} onClick={() => act('approve')}>
                  {busy ? 'Working…' : 'Approve'}
                </button>
                <button className="zm-button" type="button" disabled={busy} onClick={() => act('deny')}>
                  Deny
                </button>
              </div>
            </div>
          )}
          {msg ? (
            <p className="api-access__note" role="status" style={{ marginTop: 12 }}>
              {msg}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
