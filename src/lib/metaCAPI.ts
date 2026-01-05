/**
 * Meta Conversions API (CAPI) Integration
 * 
 * Purpose: Sends events to Supabase Edge Function for server-side Meta CAPI tracking.
 * Handles event ID generation, URL sanitization, and CAPI event transmission.
 */

export interface MetaUserData {
  fbp?: string;
  fbc?: string;
  client_user_agent?: string;
  client_ip_address?: string;
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  external_id?: string;
}

/**
 * Generate unique event ID for deduplication between Pixel and CAPI
 */
export function generateEventId(sessionId: string, eventName: string, counter: number): string {
  const timestamp = Date.now();
  return `${sessionId}_${eventName}_${timestamp}_${counter}`;
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneE164(countryCode: string, phoneNumber: string): string {
  // Remove any spaces and ensure country code starts with +
  const cleanCountryCode = countryCode.trim().startsWith('+') 
    ? countryCode.trim() 
    : `+${countryCode.trim()}`;
  const cleanPhoneNumber = phoneNumber.trim().replace(/\s+/g, '');
  return `${cleanCountryCode}${cleanPhoneNumber}`;
}

/**
 * Format full name into first name and last name
 */
export function formatName(fullName: string): { fn: string; ln?: string } {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/).filter(part => part.length > 0);
  
  if (parts.length === 0) {
    return { fn: trimmed };
  }
  
  if (parts.length === 1) {
    return { fn: parts[0].toLowerCase() };
  }
  
  const fn = parts[0].toLowerCase();
  const ln = parts.slice(1).join(' ').toLowerCase();
  
  return { fn, ln };
}

/**
 * Sanitize event source URL by removing sensitive query parameters
 */
function sanitizeEventSourceUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const sensitiveParams = [
      'phone', 'email', 'name', 'parentName', 'studentName',
      'ph', 'em', 'fn', 'ln', 'ct',
      'countryCode', 'phoneNumber'
    ];
    
    sensitiveParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch (error) {
    if (typeof window !== 'undefined') {
      return window.location.origin + window.location.pathname;
    }
    return url;
  }
}

/**
 * Send event to Meta CAPI via Supabase Edge Function
 */
export async function sendCAPIEvent(
  eventName: string,
  userData: MetaUserData,
  eventId: string
): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return false;
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/meta-capi`;

    const eventSourceUrl = typeof window !== 'undefined' 
      ? sanitizeEventSourceUrl(window.location.href)
      : undefined;

    const payload = {
      event_name: eventName,
      user_data: userData,
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: eventSourceUrl
    };

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
