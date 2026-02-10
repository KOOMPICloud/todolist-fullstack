/**
 * KConsole Provider OAuth Configuration
 */

export const config = {
  clientId: process.env.NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID || '',
  redirectUri: process.env.NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI || '',
  apiBaseUrl: process.env.NEXT_PUBLIC_KOOMPI_API_BASE_URL || 'https://api-kconsole.koompi.cloud',
};

/**
 * Start OAuth login flow
 */
export const login = () => {
  if (!config.clientId) {
    console.error('[Auth] KOOMPI_PROVIDER_CLIENT_ID not configured');
    alert('OAuth not configured. Please ensure this app is deployed on KConsole.');
    return;
  }

  console.log('[Auth] Starting OAuth flow with clientId:', config.clientId);
  console.log('[Auth] API Base URL:', config.apiBaseUrl);

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);

  // Redirect to KConsole Provider OAuth
  const loginUrl = `${config.apiBaseUrl}/api/provider/auth/${config.clientId}?state=${state}`;
  console.log('[Auth] Redirecting to:', loginUrl);
  window.location.href = loginUrl;
};

/**
 * Get current access token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Get current user from localStorage
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
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
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/';
};
