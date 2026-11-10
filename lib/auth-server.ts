import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { Agent, fetch as fetchKeepingConnections } from 'undici';
import type { AuthUser } from '@/lib/types';

/** KOOMPI ID's userinfo, which says whose a token is (another address only for a test of the sign-in). */
export const KID_USERINFO_URL = process.env.KOOMPI_ID_USERINFO_URL || 'https://api.kid.koompi.org/oauth/userinfo';

/**
 * Every API request asks KOOMPI ID whose its token is. Node's fetch closes an
 * idle connection after 4 s (KOOMPI ID keeps it 75 s), and a new one made
 * that question about 0.1 s slower, at times 0.4 s, from Singapore: so the
 * connections to it are kept open 30 s between requests.
 */
const kidConnections = new Agent({ keepAliveTimeout: 30_000, keepAliveMaxTimeout: 30_000 });

/**
 * Swap the one-time code KOOMPI Cloud's sign-in hands back (lib/auth.ts
 * loginUrl) for the person's KOOMPI ID tokens. It takes this app's client
 * secret, which only the server has. null when KOOMPI Cloud refuses it: a
 * wrong, used or expired code (2 minutes), or no secret here.
 */
export async function exchangeSignInCode(code: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_KOOMPI_API_BASE_URL || 'https://api-kconsole.koompi.cloud';
  const clientId = process.env.NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID || '';
  // Apps made before the secret became server-only have it under its old name.
  const clientSecret = process.env.KOOMPI_PROVIDER_CLIENT_SECRET || process.env.NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_SECRET || '';
  const redirectUri = process.env.NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI || '';
  if (!clientId || !clientSecret) {
    console.error('Sign-in: KOOMPI_PROVIDER_CLIENT_SECRET is not set, so the sign-in code cannot be swapped for a token');
    return null;
  }
  const response = await fetch(`${apiBaseUrl}/api/provider/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, ...(redirectUri && { redirect_uri: redirectUri }) }),
    cache: 'no-store',
  });
  if (!response.ok) {
    console.error(`Sign-in: KOOMPI Cloud did not take the code (HTTP ${response.status})`);
    return null;
  }
  const data = await response.json();
  if (typeof data.access_token !== 'string' || !data.access_token) return null;
  return { accessToken: data.access_token, refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : '' };
}

/**
 * KOOMPI Cloud's previews are signed in as this test person, so the AI can
 * try the signed-in screens: a preview (never a deployed app) has
 * KOOMPI_PREVIEW_TOKEN, a new random token of its own, and its browser sends
 * it as its access token. A deployed app has no such variable, so this
 * signs no one in there.
 */
const PREVIEW_USER: AuthUser = {
  _id: 'koompi-preview',
  sub: 'koompi-preview',
  email: 'preview@koompi.cloud',
  fullname: 'Preview Tester',
};

function isPreviewToken(token: string): boolean {
  const expected = process.env.KOOMPI_PREVIEW_TOKEN;
  if (!expected || expected.length < 32) return false;
  const given = Buffer.from(token);
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

/**
 * Verify the Bearer token on a request against KOOMPI ID and return the user,
 * or null if the token is missing/invalid. Used to guard API routes.
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length);
  if (isPreviewToken(token)) {
    return PREVIEW_USER;
  }

  try {
    const response = await fetchKeepingConnections(KID_USERINFO_URL, {
      headers: { Authorization: `Bearer ${token}` },
      dispatcher: kidConnections,
    });
    if (!response.ok) {
      await response.text(); // read to the end, so the connection can take the next request
      return null;
    }
    const data = (await response.json()) as { user?: AuthUser } & AuthUser;
    return (data.user ?? data) as AuthUser;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/** The stable per-user identifier used as the foreign key on todos. */
export function userId(user: AuthUser): string {
  return (user._id || user.sub || user.id) as string;
}
