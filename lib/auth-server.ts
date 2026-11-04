import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import type { AuthUser } from '@/lib/types';

/** KOOMPI ID's userinfo, which says whose a token is (another address only for a test of the sign-in). */
export const KID_USERINFO_URL = process.env.KOOMPI_ID_USERINFO_URL || 'https://api.kid.koompi.org/oauth/userinfo';

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
    const response = await fetch(KID_USERINFO_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
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
