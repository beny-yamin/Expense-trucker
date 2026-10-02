/**
 * keepAlive.js
 * Automated Keep-Alive Ping Service for Render Backend
 * 
 * Free-tier web services on Render sleep after 15 minutes of inactivity.
 * This service automatically pings the backend's /api/health endpoint every
 * 14 minutes (configurable via KEEP_ALIVE_INTERVAL_MS) using Render's automatically
 * injected RENDER_EXTERNAL_URL or BACKEND_URL environment variables.
 */

// Default to 14 minutes (840,000 ms) - before Render's 15-minute inactivity timeout
const DEFAULT_INTERVAL_MS = 14 * 60 * 1000;

let intervalTimer = null;

/**
 * Pings the specified target URL.
 * @param {string} targetUrl - Complete URL to health check endpoint
 */
async function pingServer(targetUrl) {
  try {
    const pingEndpoint = targetUrl.endsWith('/api/health')
      ? targetUrl
      : `${targetUrl.replace(/\/+$/, '')}/api/health`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

    const startTime = Date.now();
    const response = await fetch(pingEndpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'RenderKeepAlive-Ping/1.0',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;
    if (response.ok) {
      console.log(`[KeepAlive] Ping successful to ${pingEndpoint} (${response.status}) in ${latency}ms at ${new Date().toISOString()}`);
    } else {
      console.warn(`[KeepAlive] Ping returned status ${response.status} from ${pingEndpoint}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[KeepAlive] Ping timed out after 15 seconds.');
    } else {
      console.warn(`[KeepAlive] Ping notice: ${error.message}`);
    }
  }
}

/**
 * Start the keep-alive ping loop.
 * Automatically checks RENDER_EXTERNAL_URL, BACKEND_URL, or SERVER_URL.
 */
export function startKeepAlive() {
  const externalUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.BACKEND_URL ||
    process.env.SERVER_URL ||
    process.env.APP_URL;

  const intervalMs = parseInt(process.env.KEEP_ALIVE_INTERVAL_MS, 10) || DEFAULT_INTERVAL_MS;

  if (!externalUrl) {
    console.log('[KeepAlive] Keep-alive service initialized in standby mode.');
    console.log('[KeepAlive] Set RENDER_EXTERNAL_URL or BACKEND_URL in .env / Render environment to activate periodic self-pings.');
    return null;
  }

  console.log(`[KeepAlive] Active keep-alive monitoring configured for: ${externalUrl}`);
  console.log(`[KeepAlive] Ping interval set to every ${Math.round(intervalMs / 60000)} minutes.`);

  // Initial wake-up ping after 30 seconds of server startup
  setTimeout(() => {
    pingServer(externalUrl);
  }, 30000);

  // Set recurring interval
  if (intervalTimer) {
    clearInterval(intervalTimer);
  }

  intervalTimer = setInterval(() => {
    pingServer(externalUrl);
  }, intervalMs);

  // Allow the Node.js process to exit cleanly if needed
  if (intervalTimer.unref) {
    intervalTimer.unref();
  }

  return intervalTimer;
}

/**
 * Stop the keep-alive ping loop if needed.
 */
export function stopKeepAlive() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
    console.log('[KeepAlive] Keep-alive timer stopped.');
  }
}

export default {
  startKeepAlive,
  stopKeepAlive,
  pingServer,
};
