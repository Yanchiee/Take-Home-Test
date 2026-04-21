import { supabaseAdmin } from '@/lib/supabase';
import { deriveMetrics } from '@/lib/metrics';
import type { EventRecord } from '@/lib/types';
import { notFound } from 'next/navigation';
import Timeline from './Timeline';
import ReopenButton from './ReopenButton';

export const dynamic = 'force-dynamic';

function fmtMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export default async function CandidateDetail({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const sb = supabaseAdmin();

  const { data: candidate } = await sb.from('candidates').select('*').eq('id', candidateId).single();
  if (!candidate) notFound();

  const { data: session } = await sb
    .from('sessions')
    .select('*')
    .eq('candidate_id', candidateId)
    .single();
  if (!session) notFound();

  const { data: events } = await sb
    .from('events')
    .select('*')
    .eq('session_id', session.id)
    .order('occurred_at', { ascending: true });

  const m = deriveMetrics((events ?? []) as EventRecord[], session.started_at, session.submitted_at);
  const endedAt = session.submitted_at ?? new Date().toISOString();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <a href="/admin" className="text-sm text-blue-600 underline">← All candidates</a>
      <h1 className="mt-2 text-2xl font-semibold">{candidate.name}</h1>
      <p className="text-sm text-gray-600">{candidate.email}</p>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Active time" value={fmtMs(session.active_ms)} big />
        <Stat
          label="Elapsed"
          value={fmtMs(new Date(endedAt).getTime() - new Date(session.started_at).getTime())}
        />
        <Stat label="Status" value={session.status} />
        <Stat label="Longest focus" value={fmtMs(m.longest_focus_ms)} />
        <Stat label="Idle pauses" value={String(m.idle_pauses)} />
        <Stat label="Tab switches" value={String(m.tab_switches)} />
        <Stat label="Tab closes" value={String(m.tab_closes)} />
        <Stat label="Pastes" value={String(m.pastes)} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Submission</h2>
        <dl className="mt-2 space-y-1 text-sm">
          <div>
            Drive folder:{' '}
            {session.drive_folder_link ? (
              <a href={session.drive_folder_link} className="text-blue-600 underline" target="_blank">
                {session.drive_folder_link}
              </a>
            ) : '—'}
          </div>
        </dl>
        {session.status === 'submitted' && <ReopenButton candidateId={candidateId} />}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <div className="mt-2">
          <Timeline
            startedAt={session.started_at}
            endedAt={endedAt}
            events={(events ?? []) as EventRecord[]}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Event log</h2>
        <ul className="mt-2 space-y-1 text-sm font-mono">
          {(events ?? []).slice().reverse().map((e) => (
            <li key={e.id}>
              <span className="text-gray-500">{new Date(e.occurred_at).toLocaleString()}</span>{' '}
              <span className="font-semibold">{e.event_type}</span>{' '}
              {e.metadata && <span className="text-gray-500">{JSON.stringify(e.metadata)}</span>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={big ? 'mt-1 font-mono text-2xl font-semibold' : 'mt-1 font-mono text-base'}>
        {value}
      </div>
    </div>
  );
}
