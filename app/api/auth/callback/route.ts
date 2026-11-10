import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { KID_USERINFO_URL, exchangeSignInCode } from '@/lib/auth-server';

export const runtime = 'nodejs';

/**
 * Text safe inside a <script>: JSON, with what could end the script, open
 * markup or break a line escaped. The values come from the address, so they
 * are never pasted in as they are.
 */
const forScript = (value: unknown) => JSON.stringify(value)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

/** Home with the error, by path: request.url is the server's own address (https://0.0.0.0:3000) behind KOOMPI Cloud's proxy. */
const backHome = (error: string) => new NextResponse(null, { status: 307, headers: { Location: `/?error=${error}` } });

/**
 * KOOMPI Cloud's sign-in comes back here (lib/auth.ts login) with a one-time
 * code, which this server swaps for the person's KOOMPI ID tokens with the
 * app's client secret. Older KOOMPI Cloud versions put the tokens in the
 * address instead; those still work. The user is KOOMPI ID's answer for the
 * token, never anything in the address. The page then hands the sign-in to
 * the window that asked for it (in a popup: to the app or its live preview,
 * then closes; in the same tab: keeps it and goes home), and only for a
 * sign-in this browser started.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  let accessToken = searchParams.get('access_token');
  let refreshToken = searchParams.get('refresh_token') ?? '';
  const state = searchParams.get('state') ?? '';

  try {
    if (code) {
      const tokens = await exchangeSignInCode(code);
      if (!tokens) return backHome('auth_failed');
      ({ accessToken, refreshToken } = tokens);
    }
    if (!accessToken) {
      return backHome('no_token');
    }

    const response = await fetch(KID_USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error(`KOOMPI ID did not accept the token (HTTP ${response.status})`);
    const data = await response.json();
    const user = data.user ?? data;

    const db = await getDb();
    if (!db) {
      console.error('Database not initialized');
      return backHome('database_error');
    }

    await db.execute({
      sql: `
        INSERT INTO users (koompi_id, email, fullname, avatar, wallet_address)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(koompi_id) DO UPDATE SET
          email = excluded.email,
          fullname = excluded.fullname,
          avatar = excluded.avatar,
          wallet_address = excluded.wallet_address,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        user._id || user.sub || user.id,
        user.email,
        user.fullname || user.name || null,
        user.profile || user.avatar || user.picture || null,
        user.wallet_address || '',
      ],
    });

    const handBack = { type: 'koompi-sign-in', accessToken, refreshToken, user: JSON.stringify(user), state };
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <title>Signing in…</title>
  </head>
  <body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
    <p id="note">Signing in…</p>
    <script>
      (function () {
        var data = ${forScript(handBack)};
        var KEY = 'koompi_sign_in';
        var pending = null;
        try { pending = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
        // Only a sign-in this browser started, in the last 10 minutes; its state, once KOOMPI Cloud hands it back.
        var ours = !!(pending && pending.state && pending.at && Date.now() - pending.at < 600000 && (!data.state || data.state === pending.state));
        if (ours) {
          localStorage.setItem('access_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken || '');
          localStorage.setItem('user', data.user || 'null');
          localStorage.removeItem(KEY);
        }
        // The window that asked: it keeps the sign-in if it started it (lib/auth.ts acceptSignIn).
        try { if (window.opener) window.opener.postMessage(data, location.origin); } catch (e) {}
        try { var channel = new BroadcastChannel('koompi-sign-in'); channel.postMessage(data); channel.close(); } catch (e) {}
        var popup = !!window.opener || !!(pending && pending.popup);
        try { history.replaceState(null, '', '/api/auth/callback'); } catch (e) {}
        if (popup) window.close();
        else if (ours) { location.replace('/'); return; }
        document.getElementById('note').textContent = popup
          ? 'Signed in. You can close this window.'
          : 'This sign-in was not started here. Go back to the app and sign in again.';
      })();
    </script>
  </body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    return backHome('auth_failed');
  }
}
