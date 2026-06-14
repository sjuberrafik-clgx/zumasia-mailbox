'use client';

import { useState } from 'react';
import type { MessageDetail } from '@zumasia/shared/schemas';

type Tab = 'html' | 'text' | 'headers' | 'attachments';

export function MessageViewer({ detail }: { detail: MessageDetail | null }) {
  const [tab, setTab] = useState<Tab>('html');

  if (!detail) {
    return (
      <div className="viewer-empty">
        <div className="viewer-empty__icon" aria-hidden>
          📧
        </div>
        <p>Select a message to view it.</p>
      </div>
    );
  }

  const tabs: ReadonlyArray<{ id: Tab; label: string; show: boolean }> = [
    { id: 'html', label: 'HTML', show: Boolean(detail.htmlBody) },
    { id: 'text', label: 'Plain text', show: Boolean(detail.textBody) },
    { id: 'headers', label: 'Headers', show: true },
    {
      id: 'attachments',
      label: `Attachments (${detail.attachments.length})`,
      show: detail.attachments.length > 0,
    },
  ];

  const visibleTabs = tabs.filter((t) => t.show);
  const activeTab = visibleTabs.some((t) => t.id === tab) ? tab : visibleTabs[0]?.id;
  const display = detail.fromName ?? detail.fromAddr;
  const initial = (display || '?').trim().charAt(0).toUpperCase();

  return (
    <article className="viewer">
      <header className="viewer__header">
        <h2 className="viewer__subject">{detail.subject ?? '(no subject)'}</h2>
        <div className="viewer__from">
          <span
            className="viewer__avatar"
            style={{ background: avatarGradient(detail.fromAddr) }}
            aria-hidden
          >
            {initial}
          </span>
          <div className="viewer__from-meta">
            <div className="viewer__from-name">
              {detail.fromName ?? detail.fromAddr}
              {detail.fromName ? (
                <span className="viewer__from-addr"> &lt;{detail.fromAddr}&gt;</span>
              ) : null}
            </div>
            <time
              className="viewer__date"
              dateTime={new Date(detail.receivedAt).toISOString()}
              title={new Date(detail.receivedAt).toString()}
            >
              {formatDate(detail.receivedAt)}
            </time>
          </div>
        </div>
      </header>

      <nav className="viewer__tabs" role="tablist" aria-label="Message views">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className="viewer__tab"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="viewer__content">
        {activeTab === 'html' && detail.htmlBody ? (
          <iframe
            className="viewer__frame"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            srcDoc={detail.htmlBody}
            referrerPolicy="no-referrer"
            title="Message HTML"
          />
        ) : null}

        {activeTab === 'text' ? (
          <pre className="viewer__pre">{detail.textBody ?? '(no plain-text part)'}</pre>
        ) : null}

        {activeTab === 'headers' ? (
          <pre className="viewer__pre">{JSON.stringify(detail.headers, null, 2)}</pre>
        ) : null}

        {activeTab === 'attachments' ? (
          <ul className="viewer__attachments">
            {detail.attachments.map((a) => (
              <li key={a.id} className="viewer__attachment">
                <span className="viewer__attachment-icon" aria-hidden>
                  📎
                </span>
                <div className="viewer__attachment-body">
                  <a
                    href={`/api/attachment/${encodeURIComponent(a.id)}`}
                    rel="noopener noreferrer"
                    className="viewer__attachment-name"
                  >
                    {a.filename}
                  </a>
                  <div className="viewer__attachment-meta">
                    {a.contentType} · {formatBytes(a.sizeBytes)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
