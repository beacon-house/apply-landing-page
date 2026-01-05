/**
 * Client Information Utility
 * 
 * Purpose: Fetches and caches client IP address asynchronously for Meta CAPI events.
 * Non-blocking implementation that doesn't delay form interactions.
 */

let cachedClientIp: string | undefined = undefined;
let ipFetchInProgress: boolean = false;
let ipFetchAttempted: boolean = false;

export async function fetchClientIpAddress(): Promise<void> {
  if (cachedClientIp !== undefined || ipFetchInProgress || ipFetchAttempted) {
    return;
  }

  ipFetchInProgress = true;
  ipFetchAttempted = true;

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      ipFetchInProgress = false;
      return;
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/get-client-ip`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      ipFetchInProgress = false;
      return;
    }

    const data = await response.json();

    if (data?.ip && typeof data.ip === 'string') {
      cachedClientIp = data.ip.trim();
    }
  } catch (error) {
    // Silently fail
  } finally {
    ipFetchInProgress = false;
  }
}

export function getClientIpAddress(): string | undefined {
  return cachedClientIp;
}

export function getClientUserAgent(): string | undefined {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return undefined;
  }
  return navigator.userAgent || undefined;
}
