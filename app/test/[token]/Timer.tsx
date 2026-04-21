'use client';

import { useEffect, useRef, useState } from 'react';

const SERVER_POLL_MS = 10_000;
const LOCAL_TICK_MS = 250;
const IDLE_THRESHOLD_MS = 60_000;

function fmt(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export default function Timer({
  token,
  initialActiveMs,
  initialStatus,
}: {
  token: string;
  initialActiveMs: number;
  initialStatus: string;
}) {
  // Server-authoritative base value + timestamp of last sync.
  // We also track it in a ref so the local-tick interval always reads the latest.
  const [serverActiveMs, setServerActiveMs] = useState(initialActiveMs);
  const [lastSyncAt, setLastSyncAt] = useState(Date.now());
  const [status, setStatus] = useState(initialStatus);
  const [displayedMs, setDisplayedMs] = useState(initialActiveMs);

  const serverActiveRef = useRef(initialActiveMs);
  const lastSyncRef = useRef(Date.now());
  const lastActivityRef = useRef(Date.now());
  const statusRef = useRef(initialStatus);

  useEffect(() => { serverActiveRef.current = serverActiveMs; }, [serverActiveMs]);
  useEffect(() => { lastSyncRef.current = lastSyncAt; }, [lastSyncAt]);
  useEffect(() => { statusRef.current = status; }, [status]);

  // Server poll — sync to the authoritative value every 10s.
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/session-status?token=${encodeURIComponent(token)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setServerActiveMs(data.active_ms);
        setLastSyncAt(Date.now());
        setStatus(data.status);
      } catch {
        // ignore; next tick will retry
      }
    }
    const id = setInterval(poll, SERVER_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  // Track user activity so the local tick freezes when idle — mirroring the
  // server-side credit rules so the on-screen number stays close to reality.
  useEffect(() => {
    const markActivity = () => { lastActivityRef.current = Date.now(); };
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, markActivity, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, markActivity));
    };
  }, []);

  // Local tick — 4x per second for smooth seconds counter.
  useEffect(() => {
    const id = setInterval(() => {
      const st = statusRef.current;
      if (st !== 'in_progress' && st !== 'reopened') {
        setDisplayedMs(serverActiveRef.current);
        return;
      }
      const now = Date.now();
      const sinceActivity = now - lastActivityRef.current;
      const sinceSync = now - lastSyncRef.current;

      // If idle beyond the threshold, cap the local credit to the idle cutoff
      // so the display freezes at roughly the moment the server stopped crediting.
      const effectiveSince = sinceActivity > IDLE_THRESHOLD_MS
        ? Math.max(0, sinceSync - (sinceActivity - IDLE_THRESHOLD_MS))
        : sinceSync;

      setDisplayedMs(serverActiveRef.current + effectiveSince);
    }, LOCAL_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const isIdle =
    (status === 'in_progress' || status === 'reopened') &&
    Date.now() - lastActivityRef.current > IDLE_THRESHOLD_MS;
  const isLive = (status === 'in_progress' || status === 'reopened') && !isIdle;

  const statusLabel =
    status === 'submitted' ? 'Submitted'
    : status === 'reopened' ? 'Reopened'
    : isIdle ? 'Paused'
    : 'In progress';

  const dotColor =
    status === 'submitted' ? 'var(--color-ink-soft)'
    : isIdle ? 'var(--color-muted)'
    : 'var(--color-rust)';

  return (
    <div className="flex items-end gap-4">
      <div className="text-right">
        <div
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-muted)',
          }}
        >
          Active Time
        </div>
        <div
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '18px',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'var(--color-ink)',
            fontVariantNumeric: 'tabular-nums',
            marginTop: '2px',
          }}
        >
          {fmt(displayedMs)}
        </div>
      </div>
      <div className="flex items-center gap-2 pb-[3px]">
        <span
          aria-hidden="true"
          className={isLive ? 'live-dot' : ''}
          style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: dotColor,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-muted)',
          }}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
