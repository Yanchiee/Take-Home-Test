import { supabaseAdmin } from '@/lib/supabase';
import { deriveMetrics } from '@/lib/metrics';
import type { EventRecord } from '@/lib/types';
import Link from 'next/link';
import AutoRefresh from './AutoRefresh';

export const dynamic = 'force-dynamic';

function fmtMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export default async function AdminDashboard() {
  const sb = supabaseAdmin();

  const { data: rows } = await sb
    .from('candidates')
    .select(`
      id, name, email,
      sessions (
        id, started_at, submitted_at, active_ms, status
      )
    `)
    .order('created_at', { ascending: false });

  const enriched = await Promise.all(
    (rows ?? []).map(async (r: any) => {
      const session = Array.isArray(r.sessions) ? r.sessions[0] : r.sessions;
      if (!session) return null;
      const { data: events } = await sb.from('events').select('*').eq('session_id', session.id);
      const m = deriveMetrics((events ?? []) as EventRecord[], session.started_at, session.submitted_at);
      const end = session.submitted_at ? new Date(session.submitted_at).getTime() : Date.now();
      return {
        id: r.id, name: r.name, email: r.email,
        started_at: session.started_at, submitted_at: session.submitted_at,
        active_ms: session.active_ms, elapsed_ms: end - new Date(session.started_at).getTime(),
        status: session.status, ...m,
      };
    }),
  );

  const candidates = enriched.filter((x) => x !== null) as NonNullable<(typeof enriched)[number]>[];

  return (
    <main className="mx-auto max-w-7xl p-6">
      <AutoRefresh intervalMs={30_000} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Candidates</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>Auto-refreshes every 30s</span>
          <a href="/api/admin/candidates" className="text-blue-600 underline">
            Export JSON
          </a>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Started</th>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Elapsed</th>
              <th className="px-3 py-2">Idle</th>
              <th className="px-3 py-2">Tab sw.</th>
              <th className="px-3 py-2">Tab closes</th>
              <th className="px-3 py-2">Longest focus</th>
              <th className="px-3 py-2">Pastes</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">
                  <Link href={`/admin/${c.id}`} className="text-blue-600 underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{c.email}</td>
                <td className="px-3 py-2">{new Date(c.started_at).toLocaleString()}</td>
                <td className="px-3 py-2">
                  {c.submitted_at ? new Date(c.submitted_at).toLocaleString() : '—'}
                </td>
                <td className="px-3 py-2 font-mono font-semibold">{fmtMs(c.active_ms)}</td>
                <td className="px-3 py-2 font-mono">{fmtMs(c.elapsed_ms)}</td>
                <td className="px-3 py-2">{c.idle_pauses}</td>
                <td className="px-3 py-2">{c.tab_switches}</td>
                <td className="px-3 py-2">{c.tab_closes}</td>
                <td className="px-3 py-2 font-mono">{fmtMs(c.longest_focus_ms)}</td>
                <td className="px-3 py-2">{c.pastes}</td>
                <td className="px-3 py-2">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
