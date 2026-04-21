import { describe, it, expect } from 'vitest';
import { deriveMetrics } from '../lib/metrics';
import type { EventRecord } from '../lib/types';

function evt(type: string, at: string, extra: Partial<EventRecord> = {}): EventRecord {
  return {
    id: Math.floor(Math.random() * 1e6),
    session_id: 's',
    event_type: type as EventRecord['event_type'],
    occurred_at: at,
    duration_ms: null,
    metadata: null,
    ...extra,
  };
}

describe('deriveMetrics', () => {
  it('counts idle_start, tab_closed, tab_hidden, paste_detected', () => {
    const events: EventRecord[] = [
      evt('idle_start', '2026-04-21T10:00:00Z'),
      evt('idle_end', '2026-04-21T10:01:00Z'),
      evt('tab_hidden', '2026-04-21T10:02:00Z'),
      evt('tab_visible', '2026-04-21T10:03:00Z'),
      evt('tab_hidden', '2026-04-21T10:04:00Z'),
      evt('tab_closed', '2026-04-21T10:05:00Z'),
      evt('paste_detected', '2026-04-21T10:06:00Z'),
      evt('paste_detected', '2026-04-21T10:07:00Z'),
    ];
    const m = deriveMetrics(events, '2026-04-21T09:59:00Z', null);
    expect(m.idle_pauses).toBe(1);
    expect(m.tab_switches).toBe(2);
    expect(m.tab_closes).toBe(1);
    expect(m.pastes).toBe(2);
  });

  it('computes longest continuous focus as longest gap between interruptions', () => {
    const events: EventRecord[] = [
      evt('idle_start', '2026-04-21T10:05:00Z'),
      evt('idle_end', '2026-04-21T10:06:00Z'),
      evt('tab_hidden', '2026-04-21T10:16:00Z'),
    ];
    const m = deriveMetrics(events, '2026-04-21T10:00:00Z', null);
    expect(m.longest_focus_ms).toBe(10 * 60 * 1000);
  });

  it('returns zeros for empty events', () => {
    const m = deriveMetrics([], '2026-04-21T10:00:00Z', null);
    expect(m.idle_pauses).toBe(0);
    expect(m.tab_closes).toBe(0);
    expect(m.tab_switches).toBe(0);
    expect(m.pastes).toBe(0);
    expect(m.longest_focus_ms).toBe(0);
  });
});
