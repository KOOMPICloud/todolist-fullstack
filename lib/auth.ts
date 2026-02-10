/**
 * KConsole Provider OAuth Configuration
 */

export const config = {
  clientId: process.env.NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID || '',
  redirectUri: process.env.NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI || '',
};

/**
 * Start OAuth login flow
 */
export const login = () => {
  if (!config.clientId) {
    console.error('KOOMPI_PROVIDER_CLIENT_ID not configured');
    return;
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);

  // Redirect to KConsole Provider OAuth
  const loginUrl = `https://api-kconsole.koompi.cloud/api/provider/auth/${config.clientId}?state=${state}`;
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
