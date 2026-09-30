/**
 * apiClient.js
 * Core HTTP client that bridges the frontend to the backend API.
 * Automatically attaches the Firebase Auth ID token as a Bearer token
 * on every request so the backend can verify the caller's identity.
 */
import { auth } from '../firebase.js';

const rawBaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL)) ||
  'http://localhost:5001';

const normalizedBase = rawBaseUrl.replace(/\/+$/, '');
const API_BASE_URL = normalizedBase.endsWith('/api')
  ? normalizedBase
  : `${normalizedBase}/api`;

/**
 * Retrieve the current user's Firebase ID token, or null if not authenticated.
 * The token is short-lived (1 h); Firebase refreshes it automatically.
 */
async function getAuthToken() {
  try {
    if (typeof auth.authStateReady === 'function') {
      await auth.authStateReady();
    }
    return auth.currentUser ? await auth.currentUser.getIdToken() : null;
  } catch {
    return null;
  }
}

/**
 * Universal request handler wrapping the Fetch API.
 *
 * @param {string} endpoint - The relative endpoint path (e.g. '/expenses')
 * @param {object} options  - Fetch options: method, body, headers, params
 * @returns {Promise<any>}    Parsed JSON response from backend
 */
async function request(endpoint, options = {}) {
  const { method = 'GET', body, headers = {}, params } = options;

  // Construct URL with optional query parameters
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  if (params && Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }

  // Attach Firebase ID token for authenticated requests
  const token = await getAuthToken();

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Backend returns { success: false, message: '...', error: '...' }
      const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${method} ${url}:`, error.message);
    throw error;
  }
}

export const apiClient = {
  get:    (endpoint, params, headers) => request(endpoint, { method: 'GET', params, headers }),
  post:   (endpoint, body, headers)   => request(endpoint, { method: 'POST', body, headers }),
  put:    (endpoint, body, headers)   => request(endpoint, { method: 'PUT', body, headers }),
  delete: (endpoint, headers)         => request(endpoint, { method: 'DELETE', headers }),
};

export default apiClient;
