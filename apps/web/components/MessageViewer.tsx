'use client';

import { useState } from 'react';
import type { MessageDetail } from '@zumasia/shared/schemas';

type Tab = 'html' | 'text' | 'headers' | 'attachments';

export function MessageViewer({ detail }: { detail: MessageDetail | null }) {
    const [tab, setTab] = useState<Tab>('html');

    if (!detail) {
        return <div className="inbox-empty">Select a message to view it.</div>;
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

    return (
        <div>
            <h2 style={{ margin: '0 0 var(--zm-space-xs)', fontSize: 18 }}>
                {detail.subject ?? '(no subject)'}
            </h2>
            <div style={{ color: 'var(--zm-text-muted)', fontSize: 13, marginBottom: 12 }}>
                From: {detail.fromName ? `${detail.fromName} <${detail.fromAddr}>` : detail.fromAddr}
            </div>

            <div className="viewer-tabs" role="tablist">
                {tabs
                    .filter((t) => t.show)
                    .map((t) => (
                        <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
                            {t.label}
                        </button>
                    ))}
            </div>

            {tab === 'html' && detail.htmlBody ? (
                <iframe
                    className="viewer-frame"
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                    srcDoc={detail.htmlBody}
                    referrerPolicy="no-referrer"
                    title="Message HTML"
                />
            ) : null}

            {tab === 'text' ? (
                <pre className="viewer-text">{detail.textBody ?? '(no plain-text part)'}</pre>
            ) : null}

            {tab === 'headers' ? (
                <pre className="viewer-text">{JSON.stringify(detail.headers, null, 2)}</pre>
            ) : null}

            {tab === 'attachments' ? (
                <ul className="zm-stack">
                    {detail.attachments.map((a) => (
                        <li key={a.id} className="zm-card" style={{ padding: 12 }}>
                            <a href={`/api/attachment/${encodeURIComponent(a.id)}`} rel="noopener noreferrer">
                                {a.filename}
                            </a>{' '}
                            <span style={{ color: 'var(--zm-text-muted)', fontSize: 12 }}>
                                · {a.contentType} · {formatBytes(a.sizeBytes)}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
