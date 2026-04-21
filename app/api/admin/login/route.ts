import { NextResponse } from 'next/server';
import { COOKIE_NAME, signAdminCookie } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && rec.resetAt > now && rec.count >= MAX) {
    return NextResponse.json({ error: 'too many attempts' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';
  const expected = process.env.ADMIN_PASSWORD ?? '';
  const secret = process.env.ADMIN_COOKIE_SECRET ?? '';

  if (!expected || !secret) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
  }

  if (password !== expected) {
    const next = rec && rec.resetAt > now
      ? { count: rec.count + 1, resetAt: rec.resetAt }
      : { count: 1, resetAt: now + WINDOW_MS };
    attempts.set(ip, next);
    return NextResponse.json({ error: 'incorrect password' }, { status: 401 });
  }

  attempts.delete(ip);
  const cookieValue = await signAdminCookie(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  const sb = supabaseAdmin();
  await sb.from('admin_audit').insert({ action: 'login' });

  return res;
}
