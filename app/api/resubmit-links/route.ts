import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  const drive = typeof body?.drive_folder_link === 'string' ? body.drive_folder_link.trim() : '';

  if (!token || !drive) {
    return NextResponse.json({ error: 'token and drive folder link required' }, { status: 400 });
  }
  if (!/^https?:\/\//.test(drive)) {
    return NextResponse.json({ error: 'drive link must be an http(s) url' }, { status: 400 });
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
    .select('id, status')
    .eq('candidate_id', candidate.id)
    .single();
  if (!session) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (session.status !== 'submitted') {
    return NextResponse.json({ error: 'not submitted' }, { status: 400 });
  }

  await sb
    .from('sessions')
    .update({
      drive_folder_link: drive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  await sb.from('events').insert({
    session_id: session.id,
    event_type: 'links_updated',
    metadata: { drive_folder_link: drive },
  });

  return NextResponse.json({ ok: true });
}
