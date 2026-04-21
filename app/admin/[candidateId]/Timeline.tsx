'use client';

import type { EventRecord } from '@/lib/types';

interface Props {
  startedAt: string;
  endedAt: string;
  events: EventRecord[];
}

const INTERRUPT: Record<string, string> = {
  idle_start: 'bg-yellow-400',
  tab_hidden: 'bg-gray-400',
  tab_closed: 'bg-red-400',
};
const RESUME: Record<string, true> = {
  idle_end: true,
  tab_visible: true,
  session_start: true,
  session_resume: true,
};

export default function Timeline({ startedAt, endedAt, events }: Props) {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const duration = Math.max(end - start, 1);

  const segments: { from: number; to: number; color: string }[] = [];
  let cursor = start;
  let currentColor = 'bg-green-400';

  for (const e of [...events].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  )) {
    const t = new Date(e.occurred_at).getTime();
    if (INTERRUPT[e.event_type]) {
      segments.push({ from: cursor, to: t, color: currentColor });
      cursor = t;
      currentColor = INTERRUPT[e.event_type];
    } else if (RESUME[e.event_type]) {
      segments.push({ from: cursor, to: t, color: currentColor });
      cursor = t;
      currentColor = 'bg-green-400';
    }
  }
  segments.push({ from: cursor, to: end, color: currentColor });

  return (
    <div>
      <div className="flex h-6 w-full overflow-hidden rounded border border-gray-200">
        {segments.map((s, i) => {
          const pct = ((s.to - s.from) / duration) * 100;
          if (pct <= 0) return null;
          return <div key={i} className={s.color} style={{ width: `${pct}%` }} />;
        })}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-400" /> Active
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-yellow-400" /> Idle
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-gray-400" /> Tab hidden
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-400" /> Tab closed
        </span>
      </div>
    </div>
  );
}
