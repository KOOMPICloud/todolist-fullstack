import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const userStr = searchParams.get('user');

  if (!accessToken) {
    return NextResponse.redirect(new URL('/?error=no_token', request.url));
  }

  try {
    // Parse user from URL parameter (already fetched by KConsole)
    let user;
    if (userStr) {
      user = JSON.parse(decodeURIComponent(userStr));
    } else {
      // Fallback: fetch from KID if not provided
      const response = await fetch('https://oauth.koompi.org/v2/oauth/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      user = data.user;
    }

    const db = getDb();
    if (!db) {
      console.error('Database not initialized');
      return NextResponse.redirect(new URL('/?error=database_error', request.url));
    }

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

    stmt.run(user._id || user.sub || user.id, user.email, user.fullname, user.profile || user.avatar, user.wallet_address || '');

    // Create HTML response that stores tokens in localStorage
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
        </head>
        <body>
          <p>Authentication successful! Redirecting...</p>
          <script>
            // Store tokens in localStorage
            localStorage.setItem('access_token', '${accessToken}');
            localStorage.setItem('refresh_token', '${refreshToken || ''}');
            localStorage.setItem('user', '${userStr}');
            // Redirect to home
            window.location.href = '/';
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
