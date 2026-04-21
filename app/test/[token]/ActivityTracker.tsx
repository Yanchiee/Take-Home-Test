'use client';

import { useEffect, useRef } from 'react';

const HEARTBEAT_MS = 10_000;
const IDLE_THRESHOLD_MS = 60_000;
const PASTE_MIN_CHARS = 50;

function genTabId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export default function ActivityTracker({ token }: { token: string }) {
  const lastActivityRef = useRef<number>(Date.now());
  const idleRef = useRef<boolean>(false);
  const tabIdRef = useRef<string>(genTabId());

  useEffect(() => {
    async function postEvent(
      event_type: string,
      metadata?: Record<string, unknown>,
      duration_ms?: number,
    ) {
      try {
        await fetch('/api/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, event_type, metadata, duration_ms }),
          keepalive: true,
        });
      } catch {}
    }

    async function sendHeartbeat() {
      if (idleRef.current) return;
      try {
        await fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, tab_id: tabIdRef.current }),
        });
      } catch {}
    }

    function markActivity() {
      lastActivityRef.current = Date.now();
      if (idleRef.current) {
        idleRef.current = false;
        postEvent('idle_end');
      }
    }

    function checkIdle() {
      if (idleRef.current) return;
      if (Date.now() - lastActivityRef.current > IDLE_THRESHOLD_MS) {
        idleRef.current = true;
        postEvent('idle_start');
      }
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((e) =>
      window.addEventListener(e, markActivity, { passive: true }),
    );

    const visHandler = () => {
      if (document.hidden) postEvent('tab_hidden');
      else {
        postEvent('tab_visible');
        markActivity();
      }
    };
    document.addEventListener('visibilitychange', visHandler);

    const closeHandler = () => {
      const payload = JSON.stringify({ token, event_type: 'tab_closed' });
      navigator.sendBeacon(
        '/api/event',
        new Blob([payload], { type: 'application/json' }),
      );
    };
    window.addEventListener('pagehide', closeHandler);
    window.addEventListener('beforeunload', closeHandler);

    const pasteHandler = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') ?? '';
      if (text.length >= PASTE_MIN_CHARS) {
        postEvent('paste_detected', { paste_length: text.length });
      }
    };
    document.addEventListener('paste', pasteHandler);

    const heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_MS);
    const idleTimer = setInterval(checkIdle, 5_000);
    sendHeartbeat();

    return () => {
      activityEvents.forEach((e) => window.removeEventListener(e, markActivity));
      document.removeEventListener('visibilitychange', visHandler);
      window.removeEventListener('pagehide', closeHandler);
      window.removeEventListener('beforeunload', closeHandler);
      document.removeEventListener('paste', pasteHandler);
      clearInterval(heartbeatTimer);
      clearInterval(idleTimer);
    };
  }, [token]);

  return null;
}
