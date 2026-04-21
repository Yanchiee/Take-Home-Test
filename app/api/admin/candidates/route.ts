import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { deriveMetrics } from '@/lib/metrics';
import type { EventRecord } from '@/lib/types';

export async function GET() {
  const sb = supabaseAdmin();

  const { data: rows, error } = await sb
    .from('candidates')
    .select(`
      id, name, email, resume_token, created_at,
      sessions (
        id, started_at, submitted_at, active_ms, status
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = await Promise.all(
    (rows ?? []).map(async (r: any) => {
      const session = Array.isArray(r.sessions) ? r.sessions[0] : r.sessions;
      if (!session) {
        return {
          id: r.id, name: r.name, email: r.email,
          started_at: null, submitted_at: null,
          active_ms: 0, elapsed_ms: 0, status: 'in_progress',
          idle_pauses: 0, tab_switches: 0, tab_closes: 0, pastes: 0, longest_focus_ms: 0,
        };
      }
      const { data: events } = await sb.from('events').select('*').eq('session_id', session.id);
      const m = deriveMetrics((events ?? []) as EventRecord[], session.started_at, session.submitted_at);
      const end = session.submitted_at ? new Date(session.submitted_at).getTime() : Date.now();
      const elapsed_ms = end - new Date(session.started_at).getTime();
      return {
        id: r.id, name: r.name, email: r.email,
        started_at: session.started_at, submitted_at: session.submitted_at,
        active_ms: session.active_ms, elapsed_ms, status: session.status,
        ...m,
      };
    }),
  );

  return NextResponse.json({ candidates: results });
}
