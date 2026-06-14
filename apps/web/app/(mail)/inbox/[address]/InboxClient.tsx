'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { WarningBanner } from '@zumasia/ui';
import type { MessageDetail, MessageSummary } from '@zumasia/shared/schemas';
import { InboxList } from '@/components/InboxList';
import { MessageViewer } from '@/components/MessageViewer';
import { fetchInbox, fetchMessage } from '@/lib/api';

type Props = { localPart: string; fullAddress: string };

const POLL_INTERVAL_MS = 5000;
const POLL_BACKOFF_MS = 15000;

export function InboxClient({ localPart, fullAddress }: Props) {
    const [messages, setMessages] = useState<MessageSummary[] | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<MessageDetail | null>(null);
    const [intervalMs, setIntervalMs] = useState<number>(POLL_INTERVAL_MS);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);
    const [paused, setPaused] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [inboxError, setInboxError] = useState<string | null>(null);
    const [detailLoading, setDetailLoading] = useState<boolean>(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [detailRetryKey, setDetailRetryKey] = useState<number>(0);
    const [copied, setCopied] = useState<boolean>(false);
    const cancelledRef = useRef(false);

    const refresh = useCallback(async (options?: { manual?: boolean }) => {
        if (options?.manual) setIsRefreshing(true);
        try {
            const result = await fetchInbox(localPart);
            if (cancelledRef.current) return;
            setMessages(result.messages);
            setLastUpdated(Date.now());
            setInboxError(null);
            setIntervalMs(POLL_INTERVAL_MS);
        } catch (err) {
            const status = (err as { status?: number }).status;
            if (status === 429) {
                setIntervalMs(POLL_BACKOFF_MS);
                setInboxError('Traffic is high, so refresh slowed down for a moment.');
            } else {
                setInboxError('Could not refresh this inbox. Check your connection and try again.');
            }
        } finally {
            if (options?.manual && !cancelledRef.current) setIsRefreshing(false);
        }
    }, [localPart]);

    useEffect(() => {
        cancelledRef.current = false;
        refresh();
        return () => {
            cancelledRef.current = true;
        };
    }, [refresh]);

    useEffect(() => {
        if (paused) return;
        const t = setInterval(() => {
            refresh();
        }, intervalMs);
        return () => clearInterval(t);
    }, [refresh, intervalMs, paused]);

    useEffect(() => {
        function onVis() {
            const hidden = document.visibilityState === 'hidden';
            setPaused(hidden);
            if (!hidden) refresh();
        }
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, [refresh]);

    useEffect(() => {
        if (!messages || messages.length === 0) {
            setSelectedId(null);
            return;
        }
        if (!selectedId || !messages.some((message) => message.id === selectedId)) {
            setSelectedId(messages[0]?.id ?? null);
        }
    }, [messages, selectedId]);

    useEffect(() => {
        if (!selectedId) {
            setDetail(null);
            setDetailError(null);
            setDetailLoading(false);
            return;
        }
        let cancelled = false;
        setDetail(null);
        setDetailError(null);
        setDetailLoading(true);
        fetchMessage(selectedId).then(
            (d) => {
                if (!cancelled) {
                    setDetail(d);
                    setDetailLoading(false);
                }
            },
            (err) => {
                if (cancelled) return;
                const status = (err as { status?: number }).status;
                setDetailError(
                    status === 404
                        ? 'This message expired or is no longer available.'
                        : 'Could not load this message. Try again in a moment.',
                );
                setDetailLoading(false);
            },
        );
        return () => {
            cancelled = true;
        };
    }, [selectedId, detailRetryKey]);

    async function copyAddress() {
        try {
            await navigator.clipboard.writeText(fullAddress);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
        } catch {
            setCopied(false);
        }
    }

    const statusState = inboxError
        ? 'error'
        : paused
            ? 'paused'
            : intervalMs === POLL_BACKOFF_MS
                ? 'backoff'
                : lastUpdated
                    ? 'live'
                    : 'connecting';

    const statusText = isRefreshing
        ? 'Refreshing now'
        : statusState === 'error'
            ? 'Refresh needs attention'
            : statusState === 'paused'
                ? 'Paused while this tab is in background'
                : statusState === 'backoff'
                    ? `Slowed down · checking every ${intervalMs / 1000}s`
                    : statusState === 'live'
                        ? `Live · checking every ${intervalMs / 1000}s`
                        : 'Connecting';

    return (
        <div className="zm-container inbox-page">
            <div className="inbox-header">
                <div className="inbox-header__titles">
                    <div className="inbox-header__address-row">
                        <h1 className="inbox-header__address">{fullAddress}</h1>
                        <button className="zm-button" type="button" onClick={copyAddress}>
                            {copied ? 'Copied' : 'Copy address'}
                        </button>
                    </div>
                    <p className="refresh-status" data-state={statusState}>
                        {statusText}
                    </p>
                    {inboxError ? <div className="inbox-alert" role="status">{inboxError}</div> : null}
                </div>
                <div className="inbox-header__actions">
                    <button
                        className="zm-button"
                        type="button"
                        onClick={() => void refresh({ manual: true })}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? 'Refreshing' : 'Refresh'}
                    </button>
                    <span className="inbox-header__count">
                        {messages === null ? '-' : messages.length}{' '}
                        {messages?.length === 1 ? 'message' : 'messages'}
                    </span>
                </div>
            </div>

            <WarningBanner title="Public inbox">
                Anyone with this address can read these messages. Do not use for sensitive mail.
            </WarningBanner>

            <div className="inbox-layout">
                <section className="inbox-panel inbox-panel--list" aria-label="Inbox messages">
                    <div className="inbox-panel__head">
                        <h2 className="inbox-panel__title">Incoming mail</h2>
                        <span className="inbox-panel__meta">
                            {messages === null ? 'Loading' : `${messages.length} total`}
                        </span>
                    </div>
                    <InboxList messages={messages} selectedId={selectedId} onSelect={setSelectedId} />
                </section>

                <section className="inbox-panel inbox-panel--viewer" aria-label="Message reader">
                    <MessageViewer
                        detail={detail}
                        error={detailError}
                        isLoading={detailLoading}
                        onRetry={selectedId ? () => setDetailRetryKey((value) => value + 1) : undefined}
                    />
                </section>
            </div>
        </div>
    );
}
