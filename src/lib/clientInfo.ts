/**
 * Client Information Utility
 *
 * Purpose: Fetches and caches the client IP address asynchronously for Meta CAPI
 * events. Non-blocking - it never delays a CTA.
 *
 * Served by our own Netlify function rather than a Supabase edge function, which
 * was the last thing tying this landing page to Supabase now that the form has
 * moved to the unified form product.
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
    const response = await fetch('/.netlify/functions/client-ip', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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
