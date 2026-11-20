import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AuthUser } from '@/lib/types';

/**
 * The app's own sign-in session. KOOMPI ID's access token lasts 15 minutes and
 * the app can't renew it, so after signing in this server hands the browser a
 * session of its own instead: 30 days, renewed while the person keeps using
 * the app (POST /api/auth/session), checked here without asking KOOMPI ID.
 * Signed with a key made from the app's client secret (server only, the same
 * across deploys and in its previews), so no new setting is needed;
 * KOOMPI_SESSION_SECRET replaces it, and changing either signs everyone out.
 */
export const SESSION_PREFIX = 'ks1.';
export const SESSION_DAYS = 30;
/** A session older than this is swapped for a fresh one when the app is used. */
export const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

interface SessionClaims { user: AuthUser; iat: number; exp: number }

function sessionKey(): Buffer | null {
  const secret = process.env.KOOMPI_SESSION_SECRET
    || process.env.KOOMPI_PROVIDER_CLIENT_SECRET
    || process.env.NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_SECRET
    || '';
  if (secret.length < 16) return null;
  return createHmac('sha256', secret).update('koompi-app-session-v1').digest();
}

const sign = (key: Buffer, body: string) => createHmac('sha256', key).update(body).digest('base64url');

/** The person's details worth keeping in the session (what the app's routes read). */
function keptUser(user: AuthUser): AuthUser {
  const kept: AuthUser = {};
  for (const field of ['_id', 'sub', 'id', 'email', 'fullname', 'name', 'avatar', 'picture', 'profile', 'wallet_address'] as const) {
    const value = user[field];
    if (typeof value === 'string' && value) kept[field] = value;
  }
  return kept;
}

/** A new session for this person, or null when the app has no key to sign it (then the KOOMPI ID token is used, as before). */
export function createSession(user: AuthUser, now = Date.now()): string | null {
  const key = sessionKey();
  if (!key) return null;
  const claims: SessionClaims = { user: keptUser(user), iat: now, exp: now + SESSION_DAYS * 24 * 60 * 60 * 1000 };
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${SESSION_PREFIX}${body}.${sign(key, body)}`;
}

/** The session's claims when it is this app's, unchanged and not expired; otherwise null. */
export function readSession(token: string, now = Date.now()): SessionClaims | null {
  if (!token.startsWith(SESSION_PREFIX)) return null;
  const key = sessionKey();
  if (!key) return null;
  const [body, signature, extra] = token.slice(SESSION_PREFIX.length).split('.');
  if (!body || !signature || extra !== undefined) return null;
  const given = Buffer.from(signature);
  const wanted = Buffer.from(sign(key, body));
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionClaims;
    if (typeof claims?.exp !== 'number' || claims.exp <= now || !claims.user) return null;
    return claims;
  } catch {
    return null;
  }
}
