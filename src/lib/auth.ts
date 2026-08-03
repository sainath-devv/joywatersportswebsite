// In-Memory Authentication & Silent Refresh Manager for React + Express
// Prevents XSS token theft by storing Access Tokens exclusively in JavaScript closure memory.

let inMemoryAccessToken: string | null = null;
let tokenRefreshTimer: any = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (token) {
    scheduleSilentRefresh();
  } else {
    clearRefreshTimer();
  }
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

function clearRefreshTimer() {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
}

// Automatically triggers /api/refresh 1 minute before access token expiration (14 mins)
function scheduleSilentRefresh() {
  clearRefreshTimer();
  tokenRefreshTimer = setTimeout(async () => {
    try {
      await silentTokenRefresh();
    } catch (e) {
      console.warn('Silent token refresh failed:', e);
    }
  }, 14 * 60 * 1000); // 14 minutes
}

// Silent refresh call executed on app startup or timer
export async function silentTokenRefresh(): Promise<{ token: string; user?: any } | null> {
  try {
    const xsrfMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (xsrfMatch) {
      headers['X-XSRF-TOKEN'] = xsrfMatch[1];
    }

    const res = await fetch('/api/refresh', {
      method: 'POST',
      headers,
      credentials: 'include'
    });

    if (!res.ok) {
      setAccessToken(null);
      return null;
    }

    const data = await res.json();
    if (data.token) {
      setAccessToken(data.token);
      return data;
    }
    return null;
  } catch (err) {
    setAccessToken(null);
    return null;
  }
}

// Logout current device
export async function logoutDevice(): Promise<void> {
  try {
    const xsrfMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    const headers: Record<string, string> = {};
    if (xsrfMatch) {
      headers['X-XSRF-TOKEN'] = xsrfMatch[1];
    }
    await fetch('/api/logout', {
      method: 'POST',
      headers,
      credentials: 'include'
    });
  } catch (e) {
    console.error('Logout error:', e);
  } finally {
    setAccessToken(null);
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
  }
}

// Logout ALL devices
export async function logoutAllDevices(): Promise<void> {
  try {
    const xsrfMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    const headers: Record<string, string> = {};
    if (inMemoryAccessToken) {
      headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
    }
    if (xsrfMatch) {
      headers['X-XSRF-TOKEN'] = xsrfMatch[1];
    }
    await fetch('/api/logout-all', {
      method: 'POST',
      headers,
      credentials: 'include'
    });
  } catch (e) {
    console.error('Logout all error:', e);
  } finally {
    setAccessToken(null);
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
  }
}
