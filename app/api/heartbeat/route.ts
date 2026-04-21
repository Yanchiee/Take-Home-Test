import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { computeCredit } from '@/lib/accumulate';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  const tabId = typeof body?.tab_id === 'string' ? body.tab_id : '';

  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  const sb = supabaseAdmin();

  const { data: candidate } = await sb
    .from('candidates')
    .select('id')
    .eq('resume_token', token)
    .maybeSingle();
  if (!candidate) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }

  const { data: session } = await sb
    .from('sessions')
    .select('id, active_ms, last_heartbeat_at, status')
    .eq('candidate_id', candidate.id)
    .single();
  if (!session) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }

  if (session.status === 'submitted') {
    return NextResponse.json({ active_ms: session.active_ms, status: session.status });
  }

  const now = new Date();
  const last = session.last_heartbeat_at ? new Date(session.last_heartbeat_at) : null;
  const credit = computeCredit(now, last);
  const newActive = (session.active_ms ?? 0) + credit;

  if (last && now.getTime() - last.getTime() < 5_000 && tabId) {
    await sb.from('events').insert({
      session_id: session.id,
      event_type: 'multi_tab_detected',
      metadata: { tab_id: tabId },
    });
  }

  await sb
    .from('sessions')
    .update({
      active_ms: newActive,
      last_heartbeat_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', session.id);

  return NextResponse.json({ active_ms: newActive, status: session.status });
}
