import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateResumeToken } from '@/lib/tokens';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const sb = supabaseAdmin();

  const { data: existing } = await sb
    .from('candidates')
    .select('resume_token')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ token: existing.resume_token });
  }

  const resume_token = generateResumeToken();

  const { data: candidate, error: candErr } = await sb
    .from('candidates')
    .insert({ name, email, resume_token })
    .select()
    .single();

  if (candErr || !candidate) {
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }

  const { data: session, error: sessErr } = await sb
    .from('sessions')
    .insert({ candidate_id: candidate.id })
    .select()
    .single();

  if (sessErr || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  await sb.from('events').insert({
    session_id: session.id,
    event_type: 'session_start',
  });

  return NextResponse.json({ token: resume_token });
}
