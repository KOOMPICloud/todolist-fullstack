/**
 * Sign in with KOOMPI ID, through KOOMPI Cloud (set up for the app when it is
 * deployed or previewed there).
 */

export const config = {
  clientId: process.env.NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID || '',
  redirectUri: process.env.NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI || '',
  apiBaseUrl: process.env.NEXT_PUBLIC_KOOMPI_API_BASE_URL || 'https://api-kconsole.koompi.cloud',
};

/** The sign-in this browser started (its state and when): the callback keeps only that one. */
export const PENDING_SIGN_IN = 'koompi_sign_in';
/** How the callback (app/api/auth/callback) hands the sign-in back to the window that asked for it. */
export const SIGN_IN_MESSAGE = 'koompi-sign-in';
/** The last sign-in this browser finished, { state, at }: an action waiting on sign-in (lib/require-sign-in.ts) goes on only after its own. */
export const SIGNED_IN = 'koompi_signed_in';
/** How long a sign-in may take before it is no longer taken. */
export const SIGN_IN_TTL_MS = 10 * 60 * 1000;

/**
 * KOOMPI Cloud's sign-in page for this app, carrying the state the callback
 * checks. It comes back with a one-time code that only this app's server can
 * swap for the tokens (app/api/auth/callback), so no token is ever in an
 * address: browser history, logs or a Referer.
 */
export const loginUrl = (state: string) =>
  `${config.apiBaseUrl}/api/provider/auth/${config.clientId}?state=${encodeURIComponent(state)}&response_type=code${config.redirectUri ? `&redirect_uri=${encodeURIComponent(config.redirectUri)}` : ''}`;

export interface SignIn { accessToken?: string; refreshToken?: string; user?: string; state?: string }

/**
 * Keep a sign-in handed back by the callback, if this browser started it (its
 * state, within 10 minutes). True when kept.
 */
export function acceptSignIn(data: SignIn): boolean {
  if (typeof window === 'undefined' || !data?.accessToken) return false;
  let pending: { state?: string; at?: number } | null = null;
  try { pending = JSON.parse(window.localStorage.getItem(PENDING_SIGN_IN) ?? 'null'); } catch { pending = null; }
  if (!pending?.state || !pending.at || Date.now() - pending.at > SIGN_IN_TTL_MS) return false;
  // KOOMPI Cloud hands the state back (older versions did not): when it does, it must be this one.
  if (data.state && data.state !== pending.state) return false;
  window.localStorage.setItem('access_token', data.accessToken);
  window.localStorage.setItem('refresh_token', data.refreshToken ?? '');
  window.localStorage.setItem('user', data.user ?? 'null');
  window.localStorage.setItem(SIGNED_IN, JSON.stringify({ state: pending.state, at: Date.now() }));
  window.localStorage.removeItem(PENDING_SIGN_IN);
  return true;
}

/**
 * Sign in with KOOMPI ID, in a popup: KOOMPI ID's page can't open inside a
 * frame (KOOMPI Cloud's live preview shows the app in one), and the app keeps
 * its place. The callback hands the sign-in back to this window, which
 * reloads signed in. Where popups are blocked, the whole page goes to KOOMPI
 * ID and comes back to the same page instead (inside a frame it can't: it
 * says to allow them). For a button whose action needs an account, use
 * requireSignIn (lib/require-sign-in.ts): it signs in, then the action goes on.
 */
export const login = () => {
  startSignIn();
};

/**
 * What login does: the sign-in's state, or null when it could not start.
 * beforeLeaving: what must be saved before this page goes to KOOMPI ID or
 * reloads signed in (requireSignIn's photos).
 */
export function startSignIn(beforeLeaving?: Promise<unknown>): string | null {
  if (typeof window === 'undefined') return null;
  if (!config.clientId || !config.apiBaseUrl) {
    alert('Sign-in is not set up yet: it is, once the app is deployed or previewed on KOOMPI Cloud.');
    return null;
  }
  const state = crypto.randomUUID();
  const framed = window.self !== window.top;
  // back: the page to come back to from a full-page sign-in (app/api/auth/callback).
  const back = window.location.pathname + window.location.search;
  window.localStorage.setItem(PENDING_SIGN_IN, JSON.stringify({ state, at: Date.now(), popup: true, back }));
  const url = loginUrl(state);

  const width = 480;
  const height = 680;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
  const popup = window.open(url, SIGN_IN_MESSAGE, `popup=yes,width=${width},height=${height},left=${left},top=${top}`);
  if (!popup) {
    if (framed) {
      window.localStorage.removeItem(PENDING_SIGN_IN);
      alert('Allow pop-ups for this page to sign in with KOOMPI ID, or open the app in its own tab.');
      return null;
    }
    window.localStorage.setItem(PENDING_SIGN_IN, JSON.stringify({ state, at: Date.now(), back }));
    void Promise.resolve(beforeLeaving).finally(() => { window.location.href = url; });
    return state;
  }

  // The callback says so by a message to this window, a broadcast to the app's windows, or by
  // keeping the sign-in itself (then this window sees access_token change). Any of them will do:
  // a page on the way to KOOMPI ID can cut the popup's link to this window.
  let finished = false;
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(SIGN_IN_MESSAGE) : null;
  const done = () => {
    if (finished) return;
    finished = true;
    window.removeEventListener('message', onMessage);
    window.removeEventListener('storage', onStorage);
    channel?.close();
    clearTimeout(giveUp);
    void Promise.resolve(beforeLeaving).finally(() => window.location.reload());
  };
  const take = (data: SignIn) => {
    if (acceptSignIn(data) || isAuthenticated()) done();
  };
  const onMessage = (event: MessageEvent) => {
    if (event.origin === window.location.origin && event.data?.type === SIGN_IN_MESSAGE) take(event.data);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === 'access_token' && event.newValue) done();
  };
  window.addEventListener('message', onMessage);
  window.addEventListener('storage', onStorage);
  if (channel) channel.onmessage = (event) => take(event.data);
  const giveUp = setTimeout(() => {
    window.removeEventListener('message', onMessage);
    window.removeEventListener('storage', onStorage);
    channel?.close();
  }, SIGN_IN_TTL_MS);
  return state;
}

/**
 * Get current access token from localStorage
 */
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('access_token');
};

/**
 * Get current user from localStorage
 */
export const getUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = window.localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!window.localStorage.getItem('access_token');
};

/**
 * Fetch with authentication
 */
export const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

/**
 * Logout user
 */
export const logout = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');
    window.localStorage.removeItem('user');
    window.location.href = '/';
  }
};
