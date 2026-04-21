import type { EventRecord } from './types';

export interface Metrics {
  idle_pauses: number;
  tab_switches: number;
  tab_closes: number;
  pastes: number;
  longest_focus_ms: number;
}

const INTERRUPT_TYPES = new Set(['idle_start', 'tab_hidden', 'tab_closed']);
const RESUME_TYPES = new Set(['idle_end', 'tab_visible', 'session_start', 'session_resume']);

export function deriveMetrics(
  events: EventRecord[],
  startedAt: string,
  submittedAt: string | null,
): Metrics {
  const sorted = [...events].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  );

  let idle_pauses = 0;
  let tab_switches = 0;
  let tab_closes = 0;
  let pastes = 0;

  for (const e of sorted) {
    if (e.event_type === 'idle_start') idle_pauses++;
    if (e.event_type === 'tab_hidden') tab_switches++;
    if (e.event_type === 'tab_closed') tab_closes++;
    if (e.event_type === 'paste_detected') pastes++;
  }

  let longest = 0;
  let focusStart = new Date(startedAt).getTime();
  let inFocus = true;

  for (const e of sorted) {
    const t = new Date(e.occurred_at).getTime();
    if (inFocus && INTERRUPT_TYPES.has(e.event_type)) {
      longest = Math.max(longest, t - focusStart);
      inFocus = false;
    } else if (!inFocus && RESUME_TYPES.has(e.event_type)) {
      focusStart = t;
      inFocus = true;
    }
  }
  if (inFocus && (sorted.length > 0 || submittedAt)) {
    const endTime = submittedAt ? new Date(submittedAt).getTime() : Date.now();
    longest = Math.max(longest, endTime - focusStart);
  }

  return { idle_pauses, tab_switches, tab_closes, pastes, longest_focus_ms: longest };
}
