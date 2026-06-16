'use client';

import { useEffect, useRef, useState } from 'react';
import {
  greetingForHour,
  type GreetingPack,
} from '@zumasia/shared';

const SESSION_KEY = 'zm-greeting-shown';
const AUTO_DISMISS_MS = 6000;

type GreetingResponse = {
  pack: GreetingPack;
  country: string | null;
  region: string | null;
};

/**
 * Auto-dismissing banner that greets the visitor in their native/regional
 * language based on Cloudflare IP geolocation.
 *
 * - Shows once per browser session (sessionStorage flag).
 * - Picks the time-based greeting from the visitor's *device* local hour, so it
 *   stays correct even when IP geo is off (VPN / remote desktop / AVD).
 * - Auto-dismisses after a few seconds; also closeable manually.
 * - Falls back silently (renders nothing) on any error.
 */
export function GreetingBanner() {
  const [pack, setPack] = useState<GreetingPack | null>(null);
  const [greeting, setGreeting] = useState('');
  const [leaving, setLeaving] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let shown = false;
    try {
      shown = window.sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // sessionStorage may be unavailable (private mode); show once per load.
    }
    if (shown) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/greeting', {
          signal: controller.signal,
          headers: { accept: 'application/json' },
        });
        if (!res.ok) return;
        const data = (await res.json()) as GreetingResponse;
        if (!data?.pack) return;

        try {
          window.sessionStorage.setItem(SESSION_KEY, '1');
        } catch {
          // Ignore storage failures.
        }

        setGreeting(greetingForHour(data.pack, new Date().getHours()));
        setPack(data.pack);

        dismissTimer.current = setTimeout(() => setLeaving(true), AUTO_DISMISS_MS);
      } catch {
        // Network/parse error — stay silent.
      }
    })();

    return () => {
      controller.abort();
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      if (removeTimer.current) clearTimeout(removeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!leaving) return;
    removeTimer.current = setTimeout(() => setPack(null), 400);
    return () => {
      if (removeTimer.current) clearTimeout(removeTimer.current);
    };
  }, [leaving]);

  if (!pack) return null;

  function close() {
    setLeaving(true);
  }

  return (
    <div
      className={`zm-greeting${leaving ? ' zm-greeting--leaving' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="zm-greeting__inner">
        <span className="zm-greeting__icon" aria-hidden="true">
          {pack.icon}
        </span>
        <span className="zm-greeting__text" dir={pack.dir}>
          <span className="zm-greeting__hello">{greeting}</span>
          <span className="zm-greeting__welcome">{pack.welcome}</span>
        </span>
      </div>
      <button
        type="button"
        className="zm-greeting__close"
        onClick={close}
        aria-label="Dismiss greeting"
      >
        ×
      </button>
    </div>
  );
}
