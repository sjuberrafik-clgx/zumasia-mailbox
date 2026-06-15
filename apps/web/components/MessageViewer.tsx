'use client';

import { useMemo, useState } from 'react';
import type { MessageDetail } from '@zumasia/shared/schemas';

type MessageViewerProps = {
    detail: MessageDetail | null;
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
};

export function MessageViewer({ detail, isLoading = false, error, onRetry }: MessageViewerProps) {
    const [showImages, setShowImages] = useState(false);

    const blockedImages = useMemo(
        () => (detail?.htmlBody ? countBlockedImages(detail.htmlBody) : 0),
        [detail?.htmlBody],
    );

    const srcDoc = useMemo(
        () => (detail?.htmlBody ? buildEmailDocument(detail.htmlBody, showImages) : ''),
        [detail?.htmlBody, showImages],
    );

    if (isLoading) {
        return (
            <div className="viewer-empty">
                <div className="inbox-empty__spinner" aria-hidden />
                <p className="viewer-empty__title">Loading message</p>
                <p className="viewer-empty__hint">Fetching the full email body and attachments.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="viewer-empty" role="status">
                <div className="viewer-empty__icon" aria-hidden>
                    !
                </div>
                <p className="viewer-empty__title">Message unavailable</p>
                <p className="viewer-empty__hint">{error}</p>
                {onRetry ? (
                    <div className="viewer-empty__actions">
                        <button className="zm-button" type="button" onClick={onRetry}>
                            Try again
                        </button>
                    </div>
                ) : null}
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="viewer-empty">
                <div className="viewer-empty__icon" aria-hidden>
                    @
                </div>
                <p className="viewer-empty__title">Select a message</p>
                <p className="viewer-empty__hint">Choose an email from the inbox list to read it here.</p>
            </div>
        );
    }

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

            <div className="viewer__content">
                {detail.htmlBody ? (
                    <>
                        {blockedImages > 0 ? (
                            <div className="viewer__images-bar">
                                <span className="viewer__images-text">
                                    {showImages
                                        ? 'Remote images are shown. They may load tracking content from the sender.'
                                        : `${blockedImages} remote image${blockedImages > 1 ? 's' : ''} blocked to protect your privacy.`}
                                </span>
                                <button
                                    type="button"
                                    className="zm-button viewer__images-btn"
                                    onClick={() => setShowImages((v) => !v)}
                                >
                                    {showImages ? 'Hide images' : 'Show images'}
                                </button>
                            </div>
                        ) : null}
                        <iframe
                            key={showImages ? 'imgs-on' : 'imgs-off'}
                            className="viewer__frame"
                            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                            srcDoc={srcDoc}
                            referrerPolicy="no-referrer"
                            title="Message HTML"
                        />
                    </>
                ) : detail.textBody ? (
                    <pre className="viewer__pre">{detail.textBody}</pre>
                ) : (
                    <pre className="viewer__pre">(no message body)</pre>
                )}

                {detail.attachments.length > 0 ? (
                    <div className="viewer__attachments-section" style={{ marginTop: '24px' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Attachments ({detail.attachments.length})</h3>
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
                    </div>
                ) : null}
            </div>
        </article>
    );
}

function countBlockedImages(html: string): number {
    const matches = html.match(/data-original-src="/gi);
    return matches ? matches.length : 0;
}

function restoreRemoteImages(html: string): string {
    return html.replace(/<img\b[^>]*>/gi, (tag) => {
        const m = /data-original-src="([^"]*)"/i.exec(tag);
        if (!m) return tag;
        const original = m[1];
        if (/\ssrc="[^"]*"/i.test(tag)) {
            return tag.replace(/\ssrc="[^"]*"/i, ` src="${original}"`);
        }
        return tag.replace(/<img\b/i, `<img src="${original}"`);
    });
}

function buildEmailDocument(html: string, showImages: boolean): string {
    const body = showImages ? restoreRemoteImages(html) : html;
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<base target="_blank" />
<style>
  html, body {
    margin: 0;
    padding: 20px;
    background: #ffffff;
    color: #1f2328;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
    -webkit-text-size-adjust: 100%;
  }
  img { max-width: 100%; height: auto; border: 0; }
  a { color: #0a66c2; }
  table { max-width: 100%; }
  blockquote {
    margin: 0 0 0 12px;
    padding-left: 12px;
    border-left: 3px solid #d0d7de;
    color: #57606a;
  }
  ::-webkit-scrollbar { height: 8px; width: 8px; }
  ::-webkit-scrollbar-thumb { background: #d0d7de; border-radius: 4px; }
</style>
</head>
<body>${body}</body>
</html>`;
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
