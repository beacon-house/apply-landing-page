/**
 * Zoho CRM Frontend Helper
 *
 * Calls the Netlify function to create or update leads in Zoho CRM.
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

async function callZohoFunction(
  step: 1 | 2,
  data: Record<string, unknown>,
  zohoLeadId?: string
): Promise<ZohoResponse> {
  const payload: Record<string, unknown> = { step, ...data };
  if (zohoLeadId) payload.zohoLeadId = zohoLeadId;

  debugLog(`Sending Zoho CRM step ${step} payload:`, payload);

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result: ZohoResponse = await res.json();

  if (!res.ok) {
    errorLog(`Zoho CRM step ${step} failed:`, result);
    throw new Error(result.error || `Zoho CRM step ${step} failed`);
  }

  debugLog(`Zoho CRM step ${step} success:`, result);
  return result;
}

/**
 * Create a new lead in Zoho CRM after Page 1.
 * Returns the zohoLeadId on success.
 */
export async function createZohoLead(
  data: Record<string, unknown>
): Promise<string | null> {
  const result = await callZohoFunction(1, data);

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
 * Update an existing lead in Zoho CRM after Page 2 (or immediate submission).
 */
export async function updateZohoLead(
  data: Record<string, unknown>,
  zohoLeadId: string
): Promise<void> {
  await callZohoFunction(2, data, zohoLeadId);
}
