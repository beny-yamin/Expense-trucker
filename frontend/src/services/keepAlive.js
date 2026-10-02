/**
 * keepAlive.js
 * Client-side Keep-Alive & Pre-Warm Service
 * 
 * Render backend free tiers go to sleep after 15 minutes of inactivity.
 * This service:
 * 1. Sends an immediate lightweight health ping when the frontend mounts to pre-warm
 *    a sleeping backend before the user makes heavy authenticated requests.
 * 2. Runs a periodic background ping every 12 minutes to keep the backend warm
 *    while the user is active on the application.
 */

const rawBaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL)) ||
  'http://localhost:5001';

const cleanBase = rawBaseUrl.replace(/\/+$/, '');
const HEALTH_URL = cleanBase.endsWith('/api')
  ? `${cleanBase}/health`
  : `${cleanBase}/api/health`;

// 12 minutes (720,000 ms) - safe margin before Render's 15-minute idle limit
const CLIENT_PING_INTERVAL_MS = 12 * 60 * 1000;

let pingTimer = null;

export async function pingBackend() {
  try {
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      keepalive: true,
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: true, data };
    }
  } catch {
    // Gracefully ignore network errors on ping; regular API calls have full error handlers
  }
  return { success: false };
}

export function initKeepAlive() {
  // Immediate pre-warm ping on app load
  pingBackend();

  // Periodic keep-alive ping while the tab is open
  if (!pingTimer) {
    pingTimer = setInterval(() => {
      pingBackend();
    }, CLIENT_PING_INTERVAL_MS);
  }

  return () => {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  };
}

export default {
  pingBackend,
  initKeepAlive,
};
