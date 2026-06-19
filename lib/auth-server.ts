import type { NextRequest } from 'next/server';
import type { AuthUser } from '@/lib/types';

const KID_USERINFO_URL = 'https://api.kid.koompi.org/oauth/userinfo';

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
