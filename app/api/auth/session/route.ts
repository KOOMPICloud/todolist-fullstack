import { NextRequest, NextResponse } from 'next/server';
import { RENEW_AFTER_MS, createSession, readSession } from '@/lib/session';

export const runtime = 'nodejs';

/**
 * A fresh 30-day session for a signed-in person, so someone who keeps using
 * the app never has to sign in again (lib/auth.ts asks for it once a day).
 * 401 when the session is missing, expired or not this app's.
 */
export async function POST(request: NextRequest) {
  const header = request.headers.get('authorization') ?? '';
  const claims = header.startsWith('Bearer ') ? readSession(header.slice('Bearer '.length)) : null;
  if (!claims) return NextResponse.json({ error: 'Sign in again' }, { status: 401 });
  const token = Date.now() - claims.iat > RENEW_AFTER_MS ? createSession(claims.user) : null;
  return NextResponse.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
}
