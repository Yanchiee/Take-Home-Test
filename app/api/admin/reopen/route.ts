import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const candidateId = typeof body?.candidate_id === 'string' ? body.candidate_id : '';
  if (!candidateId) return NextResponse.json({ error: 'candidate_id required' }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: session } = await sb
    .from('sessions')
    .select('id, status')
    .eq('candidate_id', candidateId)
    .single();
  if (!session) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await sb
    .from('sessions')
    .update({ status: 'reopened', submitted_at: null, updated_at: new Date().toISOString() })
    .eq('id', session.id);

  await sb.from('events').insert({ session_id: session.id, event_type: 'admin_reopen' });
  await sb.from('admin_audit').insert({ action: 'reopen', target_candidate_id: candidateId });

  return NextResponse.json({ ok: true });
}
