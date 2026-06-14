'use client';

import type { MessageSummary } from '@zumasia/shared/schemas';

type Props = {
    messages: MessageSummary[] | null;
    selectedId: string | null;
    onSelect: (id: string) => void;
};

export function InboxList({ messages, selectedId, onSelect }: Props) {
    if (messages === null) {
        return <div className="inbox-empty">Loading…</div>;
    }
    if (messages.length === 0) {
        return (
            <div className="inbox-empty">
                <p>No messages yet.</p>
                <p style={{ fontSize: 13 }}>Send mail to this address — it will appear here.</p>
            </div>
        );
    }

    return (
        <div className="inbox-list" role="list">
            {messages.map((m) => (
                <button
                    key={m.id}
                    type="button"
                    role="listitem"
                    className={`inbox-list__item ${m.id === selectedId ? 'inbox-list__item--selected' : ''}`}
                    onClick={() => onSelect(m.id)}
                >
                    <div className="inbox-list__from">{m.fromName ?? m.fromAddr}</div>
                    <div className="inbox-list__subject">{m.subject ?? '(no subject)'}</div>
                    <div className="inbox-list__meta">
                        <span>{relTime(m.receivedAt)}</span>
                        <span>{expiresIn(m.expiresAt)}</span>
                    </div>
                </button>
            ))}
        </div>
    );
}

function relTime(ts: number): string {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
}

function expiresIn(ts: number): string {
    const diff = ts - Date.now();
    if (diff <= 0) return 'expired';
    const h = Math.floor(diff / 3600000);
    if (h >= 1) return `${h}h left`;
    const m = Math.floor(diff / 60000);
    return `${m}m left`;
}
