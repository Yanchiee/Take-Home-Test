import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();

  const { data: candidate } = await sb.from('candidates').select('*').eq('id', id).single();
  if (!candidate) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const { data: session } = await sb
    .from('sessions')
    .select('*')
    .eq('candidate_id', id)
    .single();

  const { data: events } = await sb
    .from('events')
    .select('*')
    .eq('session_id', session?.id ?? '')
    .order('occurred_at', { ascending: true });

  return NextResponse.json({ candidate, session, events: events ?? [] });
}
