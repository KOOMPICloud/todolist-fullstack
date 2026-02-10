/**
 * KConsole Provider OAuth Authentication
 */

// OAuth configuration from environment variables
export const config = {
  clientId: import.meta.env.VITE_KOOMPI_PROVIDER_CLIENT_ID || '',
  redirectUri: import.meta.env.VITE_KOOMPI_PROVIDER_REDIRECT_URI || '',
  apiBaseUrl: import.meta.env.VITE_API_URL || '/api',
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
  const loginUrl = `https://kconsole.koompi.cloud/api/provider/auth/${config.clientId}?state=${state}`;
  window.location.href = loginUrl;
};

/**
 * Handle OAuth callback
 * Call this on your /auth/callback page
 */
export const handleCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const userStr = params.get('user');
  const state = params.get('state');

  // Verify state to prevent CSRF
  const savedState = sessionStorage.getItem('oauth_state');
  if (state !== savedState) {
    console.error('Invalid OAuth state');
    return null;
  }

  sessionStorage.removeItem('oauth_state');

  if (!accessToken) {
    console.error('No access token in callback');
    return null;
  }

  // Store tokens and user
  localStorage.setItem('access_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
  if (userStr) {
    const user = JSON.parse(userStr);
    localStorage.setItem('user', JSON.stringify(user));
  }

  return {
    accessToken,
    refreshToken,
    user: userStr ? JSON.parse(userStr) : null,
  };
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

/**
 * Get current access token
 */
export const getToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Get current user
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
 * Get user profile from KID
 */
export const getProfile = async () => {
  try {
    const response = await fetchWithAuth(config.apiBaseUrl + '/me');
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * API call helpers
 */
export const api = {
  get: async (path: string) => {
    const response = await fetchWithAuth(config.apiBaseUrl + path);
    if (!response.ok) {
      throw new Error(`GET ${path} failed: ${response.statusText}`);
    }
    return response.json();
  },

  post: async (path: string, data?: any) => {
    const response = await fetchWithAuth(config.apiBaseUrl + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`POST ${path} failed: ${response.statusText}`);
    }
    return response.json();
  },

  put: async (path: string, data?: any) => {
    const response = await fetchWithAuth(config.apiBaseUrl + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`PUT ${path} failed: ${response.statusText}`);
    }
    return response.json();
  },

  delete: async (path: string) => {
    const response = await fetchWithAuth(config.apiBaseUrl + path, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`DELETE ${path} failed: ${response.statusText}`);
    }
    return response.json();
  },
};
