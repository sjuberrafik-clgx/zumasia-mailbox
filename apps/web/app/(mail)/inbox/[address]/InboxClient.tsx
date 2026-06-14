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
  const cancelledRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchInbox(localPart);
      if (cancelledRef.current) return;
      setMessages(result.messages);
      setLastUpdated(Date.now());
      if (intervalMs !== POLL_INTERVAL_MS) setIntervalMs(POLL_INTERVAL_MS);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 429) setIntervalMs(POLL_BACKOFF_MS);
    }
  }, [localPart, intervalMs]);

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
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    fetchMessage(selectedId).then(
      (d) => {
        if (!cancelled) setDetail(d);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  return (
    <div className="zm-container">
      <div className="inbox-header">
        <div className="inbox-header__titles">
          <h1 className="inbox-header__address">{fullAddress}</h1>
          <p className="refresh-status" data-paused={paused ? 'true' : 'false'}>
            {paused
              ? 'Paused — tab is in background'
              : lastUpdated
                ? `Live · checking every ${intervalMs / 1000}s`
                : 'Connecting…'}
          </p>
        </div>
        <span className="inbox-header__count">
          {messages === null ? '—' : messages.length}{' '}
          {messages?.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      <WarningBanner title="Public inbox">
        Anyone with this address can read these messages. Do not use for sensitive mail.
      </WarningBanner>

      <div className="inbox-layout">
        <InboxList messages={messages} selectedId={selectedId} onSelect={setSelectedId} />
        <MessageViewer detail={detail} />
      </div>
    </div>
  );
}
