import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { EventType } from '@/lib/types';

const ALLOWED: EventType[] = [
  'session_resume',
  'idle_start',
  'idle_end',
  'tab_hidden',
  'tab_visible',
  'tab_closed',
  'paste_detected',
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  const eventType = body?.event_type as EventType;
  const metadata = body?.metadata ?? null;
  const duration_ms = typeof body?.duration_ms === 'number' ? body.duration_ms : null;

  if (!token || !ALLOWED.includes(eventType)) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: candidate } = await sb
    .from('candidates')
    .select('id')
    .eq('resume_token', token)
    .maybeSingle();
  if (!candidate) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const { data: session } = await sb
    .from('sessions')
    .select('id')
    .eq('candidate_id', candidate.id)
    .single();
  if (!session) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await sb.from('events').insert({
    session_id: session.id,
    event_type: eventType,
    duration_ms,
    metadata,
  });

  return NextResponse.json({ ok: true });
}
