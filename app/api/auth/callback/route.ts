import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const userStr = searchParams.get('user');
  const state = searchParams.get('state');

  // Verify state to prevent CSRF
  const savedState = sessionStorage?.getItem('oauth_state');
  if (state && savedState !== state) {
    return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
  }

  if (!accessToken) {
    return NextResponse.redirect(new URL('/?error=no_token', request.url));
  }

  // Get user info from KID
  try {
    const response = await fetch('https://oauth.koompi.org/v2/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    const user = data.user;

    // Upsert user in database
    const stmt = db.prepare(`
      INSERT INTO users (koompi_id, email, fullname, avatar, wallet_address)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(koompi_id) DO UPDATE SET
        email = excluded.email,
        fullname = excluded.fullname,
        avatar = excluded.avatar,
        wallet_address = excluded.wallet_address,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(user._id || user.sub, user.email, user.fullname, user.avatar, user.wallet_address);

    // Redirect to frontend with tokens
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('access_token', accessToken);
    if (refreshToken) {
      redirectUrl.searchParams.set('refresh_token', refreshToken);
    }
    if (userStr) {
      redirectUrl.searchParams.set('user', userStr);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
