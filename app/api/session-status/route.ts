import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: candidate } = await sb
    .from('candidates')
    .select('id, name')
    .eq('resume_token', token)
    .maybeSingle();
  if (!candidate) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const { data: session } = await sb
    .from('sessions')
    .select('active_ms, status, started_at, submitted_at, drive_folder_link, video_link')
    .eq('candidate_id', candidate.id)
    .single();
  if (!session) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({
    name: candidate.name,
    active_ms: session.active_ms,
    status: session.status,
    started_at: session.started_at,
    submitted_at: session.submitted_at,
    drive_folder_link: session.drive_folder_link,
    video_link: session.video_link,
  });
}
