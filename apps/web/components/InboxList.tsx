'use client';

import type { MessageSummary } from '@zumasia/shared/schemas';

type Props = {
  messages: MessageSummary[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function InboxList({ messages, selectedId, onSelect }: Props) {
  if (messages === null) {
    return (
      <div className="inbox-empty">
        <div className="inbox-empty__spinner" aria-hidden />
        <p>Loading…</p>
      </div>
    );
  }
  if (messages.length === 0) {
    return (
      <div className="inbox-empty">
        <div className="inbox-empty__icon" aria-hidden>
          ✉
        </div>
        <p className="inbox-empty__title">No messages yet</p>
        <p className="inbox-empty__hint">Send mail to this address — it will appear here.</p>
      </div>
    );
  }

  return (
    <ul className="inbox-list" role="list">
      {messages.map((m) => {
        const display = m.fromName ?? m.fromAddr;
        const initial = (display || '?').trim().charAt(0).toUpperCase();
        return (
          <li key={m.id}>
            <button
              type="button"
              className={`inbox-list__item${m.id === selectedId ? ' inbox-list__item--selected' : ''}`}
              onClick={() => onSelect(m.id)}
              aria-pressed={m.id === selectedId}
            >
              <span
                className="inbox-list__avatar"
                style={{ background: avatarGradient(m.fromAddr) }}
                aria-hidden
              >
                {initial}
              </span>
              <span className="inbox-list__body">
                <span className="inbox-list__row">
                  <span className="inbox-list__from" title={m.fromAddr}>
                    {display}
                  </span>
                  <time
                    className="inbox-list__time"
                    dateTime={new Date(m.receivedAt).toISOString()}
                  >
                    {relTime(m.receivedAt)}
                  </time>
                </span>
                <span className="inbox-list__subject">{m.subject ?? '(no subject)'}</span>
                <span className="inbox-list__footer">
                  {m.hasAttachments ? (
                    <span className="inbox-list__chip" title="Has attachments">
                      📎 attachment
                    </span>
                  ) : null}
                  <span className="inbox-list__expires" title="Auto-deletes when expired">
                    {expiresIn(m.expiresAt)}
                  </span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 30) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function expiresIn(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return 'expired';
  const h = Math.floor(diff / 3600000);
  if (h >= 1) return `${h}h left`;
  const m = Math.floor(diff / 60000);
  return `${m}m left`;
}

const AVATAR_PALETTE: ReadonlyArray<readonly [string, string]> = [
  ['#6ee7b7', '#10b981'],
  ['#93c5fd', '#3b82f6'],
  ['#c4b5fd', '#8b5cf6'],
  ['#fbbf24', '#f59e0b'],
  ['#f9a8d4', '#ec4899'],
  ['#fb923c', '#f97316'],
  ['#a3e635', '#84cc16'],
  ['#67e8f9', '#06b6d4'],
];

function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const [a, b] = AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0]!;
  return `linear-gradient(135deg, ${a}, ${b})`;
}
