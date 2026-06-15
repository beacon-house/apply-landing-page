/**
 * Zoho CRM Frontend Helper
 *
 * Calls the Netlify function to create or update leads in Zoho CRM.
 * Supports debounced incremental updates during form filling.
 */

import { debugLog, errorLog } from "@/lib/logger";

interface ZohoResponse {
  success: boolean;
  zohoLeadId?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
  details?: unknown;
}

const FUNCTION_URL = "/.netlify/functions/zoho-crm";

// Debounce state (module-level singleton)
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let currentAbortController: AbortController | null = null;
let isUpdateInFlight = false;
let pendingUpdate: { data: Record<string, unknown>; zohoLeadId: string; isFinalSubmit: boolean } | null = null;

async function callZohoFunction(
  step: 1 | 2,
  data: Record<string, unknown>,
  zohoLeadId?: string,
  isFinalSubmit = false,
  signal?: AbortSignal
): Promise<ZohoResponse> {
  const payload: Record<string, unknown> = { step, ...data };
  if (zohoLeadId) payload.zohoLeadId = zohoLeadId;
  if (isFinalSubmit) payload.isFinalSubmit = true;

  debugLog(`Sending Zoho CRM step ${step} payload (final=${isFinalSubmit}):`, payload);

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  const result: ZohoResponse = await res.json();

  if (!res.ok) {
    errorLog(`Zoho CRM step ${step} failed:`, result);
    throw new Error(result.error || `Zoho CRM step ${step} failed`);
  }

  debugLog(`Zoho CRM step ${step} success:`, result);
  return result;
}

async function sendQueuedUpdate(
  data: Record<string, unknown>,
  zohoLeadId: string,
  isFinalSubmit: boolean
): Promise<void> {
  if (isUpdateInFlight) {
    pendingUpdate = { data, zohoLeadId, isFinalSubmit };
    debugLog("Zoho update queued (request in flight)");
    return;
  }

  isUpdateInFlight = true;
  currentAbortController = new AbortController();

  try {
    await callZohoFunction(2, data, zohoLeadId, isFinalSubmit, currentAbortController.signal);
  } finally {
    isUpdateInFlight = false;
    currentAbortController = null;

    // Send any pending update immediately
    if (pendingUpdate) {
      const next = pendingUpdate;
      pendingUpdate = null;
      debugLog("Sending queued Zoho update");
      await sendQueuedUpdate(next.data, next.zohoLeadId, next.isFinalSubmit);
    }
  }
}

/**
 * Create a new lead in Zoho CRM after Page 1.
 * Returns the zohoLeadId on success.
 */
export async function createZohoLead(
  data: Record<string, unknown>,
  isFinalSubmit = false
): Promise<string | null> {
  const result = await callZohoFunction(1, data, undefined, isFinalSubmit);

  if (result.skipped) {
    debugLog("Zoho lead creation skipped:", result.reason);
    return null;
  }

  if (!result.success || !result.zohoLeadId) {
    throw new Error("Zoho lead creation did not return a lead ID");
  }

  return result.zohoLeadId;
}

/**
 * Update an existing lead in Zoho CRM.
 * For final submit, pass isFinalSubmit=true.
 */
export async function updateZohoLead(
  data: Record<string, unknown>,
  zohoLeadId: string,
  isFinalSubmit = false
): Promise<void> {
  // Cancel any pending debounced update first
  cancelPendingZohoUpdate();
  await sendQueuedUpdate(data, zohoLeadId, isFinalSubmit);
}

/**
 * Schedule a debounced incremental Zoho update.
 * Resets the timer on each call. Queues update if a request is in flight.
 * Delay: 3 seconds after last call.
 */
export function scheduleDebouncedZohoUpdate(
  data: Record<string, unknown>,
  zohoLeadId: string,
  delayMs = 3000
): void {
  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  // Abort any in-flight non-final request (it has stale data)
  if (currentAbortController && !isUpdateInFlight) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void sendQueuedUpdate(data, zohoLeadId, false);
  }, delayMs);
}

/**
 * Cancel any pending debounced Zoho update and abort the in-flight request.
 */
export function cancelPendingZohoUpdate(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  pendingUpdate = null;
}

/**
 * Fire a "parting shot" update to Zoho when the user is leaving the page.
 * Uses fetch with keepalive (or sendBeacon fallback) to ensure the request
 * survives page unload. Intended for beforeunload/visibilitychange handlers.
 * Must be synchronous-calling (no await) to work within page exit events.
 */
export function fireAbandonmentUpdate(
  data: Record<string, unknown>,
  zohoLeadId: string
): void {
  const payload: Record<string, unknown> = { step: 2, ...data, zohoLeadId };

  // Tag as abandoned (not final submit) so sub-category gets set
  payload.isFinalSubmit = false;

  try {
    const body = JSON.stringify(payload);

    // Prefer fetch with keepalive (more reliable, supports headers)
    if (typeof fetch !== "undefined") {
      fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Silently ignore — page is unloading
      });
    } else if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      // Fallback: sendBeacon (no custom headers, but survives unload)
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(FUNCTION_URL, blob);
    }
  } catch {
    // Silently ignore — page is unloading
  }
}
