/**
 * Zoho CRM Integration — Netlify Function
 *
 * Handles OAuth token refresh and lead CRUD via Zoho CRM API V8.
 * Step 1: POST /Leads (create)
 * Step 2: PUT /Leads/{id} (update)
 *
 * Staging safety: prepends "TEST -" to names when VITE_ENVIRONMENT=stg.
 */

import type { Handler } from "@netlify/functions";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
  api_domain?: string;
}

async function refreshZohoToken(): Promise<{
  accessToken: string;
  apiDomain: string;
}> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Zoho credentials: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN"
    );
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL?.trim() || "https://accounts.zoho.com";

  // Retry with exponential backoff on rate limit (429) or transient errors
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const tokenRes = await fetch(
      `${accountsUrl}/oauth/v2/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }
    );

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      if ((tokenRes.status === 429 || tokenRes.status >= 500) && attempt < maxRetries - 1) {
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(`Zoho token refresh rate-limited (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw new Error(`Zoho token refresh failed: ${tokenRes.status} ${text}`);
    }

    const tokenData: ZohoTokenResponse = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error("Zoho token response missing access_token");
    }

    const defaultApiDomain = accountsUrl.includes(".in")
      ? "https://www.zohoapis.in"
      : "https://www.zohoapis.com";

    // Override API domain for sandbox; token response always returns production domain
    const env = process.env.VITE_ENVIRONMENT?.trim();
    const isSandbox = env === "stg" || env === "dev";
    const apiDomain = isSandbox
      ? "https://sandbox.zohoapis.in"
      : (tokenData.api_domain || defaultApiDomain);

    return {
      accessToken: tokenData.access_token,
      apiDomain,
    };
  }

  throw new Error("Zoho token refresh failed after max retries");
}

/**
 * Frontend sends camelCase (Zustand store convention).
 * buildZohoPayload expects snake_case (DB convention).
 * This explicit mapping converts known camelCase keys at the boundary.
 * Already-snake_case keys (lead_category, utm_*) pass through unchanged.
 */
const CAMEL_TO_SNAKE: Record<string, string> = {
  formFillerType: "form_filler_type",
  studentName: "student_name",
  currentGrade: "current_grade",
  curriculumType: "curriculum_type",
  gradeFormat: "grade_format",
  gpaValue: "gpa_value",
  percentageValue: "percentage_value",
  schoolName: "school_name",
  scholarshipRequirement: "scholarship_requirement",
  targetGeographies: "target_geographies",
  phoneNumber: "phone_number",
  countryCode: "country_code",
  parentName: "parent_name",
  parentEmail: "parent_email",
  email: "parent_email",
  selectedDate: "selected_date",
  selectedSlot: "selected_slot",
  sessionId: "session_id",
  leadCategory: "lead_category",
};

/** Strip control characters that break JSON parsing (newlines, tabs, etc.) */
function sanitizeString(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/[\x00-\x1F\x7F]/g, " ").trim();
  }
  if (Array.isArray(value)) return value.map(sanitizeString);
  if (value && typeof value === "object") {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) clean[k] = sanitizeString(v);
    return clean;
  }
  return value;
}

function normalizeFormData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Flatten nested utmParameters object to top-level utm_* keys
    if (key === "utmParameters" && value && typeof value === "object") {
      const utm = value as Record<string, unknown>;
      if (utm.utm_source) result.utm_source = utm.utm_source;
      if (utm.utm_medium) result.utm_medium = utm.utm_medium;
      if (utm.utm_campaign) result.utm_campaign = utm.utm_campaign;
      if (utm.utm_term) result.utm_term = utm.utm_term;
      if (utm.utm_content) result.utm_content = utm.utm_content;
      if (utm.utm_id) result.utm_id = utm.utm_id;
      if (utm.campaign_id) result.campaign_id = utm.campaign_id;
      if (utm.utm_adset) result.utm_adset = utm.utm_adset;
      if (utm.adset_id) result.adset_id = utm.adset_id;
      if (utm.ad_id) result.ad_id = utm.ad_id;
      if (utm.utm_placement) result.utm_placement = utm.utm_placement;
      continue;
    }

    const mappedKey = CAMEL_TO_SNAKE[key] || key;
    result[mappedKey] = sanitizeString(value);
  }

  return result;
}

function maybePrefixTest(value: string | null | undefined): string | null {
  if (!value) return null;
  const env = process.env.VITE_ENVIRONMENT?.trim();
  if (env === "stg" || env === "dev") {
    return `TEST - ${value}`;
  }
  return value;
}

function computeLeadSubcategory(
  data: Record<string, unknown>,
  isFinalSubmit: boolean
): string | null {
  const category = String(data.lead_category || "");

  // Final submit: no sub-category needed
  if (isFinalSubmit) return null;

  const hasSlot = Boolean(data.selected_slot && data.selected_date);
  const hasContact = Boolean(data.parent_email || data.parent_name);

  if (category === "nurture") {
    if (!hasContact) return "partial-fill-nurture";
    return null;
  }

  if (["bch", "lum-l1", "lum-l2"].includes(category)) {
    if (hasSlot && !hasContact) {
      return `partial-fill-${category}-slotpicked`;
    }
    if (hasSlot && hasContact) {
      return `partial-fill-${category}-didnotsubmit`;
    }
    return `partial-fill-${category}`;
  }

  return null;
}

function buildZohoPayload(
  data: Record<string, unknown>,
  isFinalSubmit: boolean
): Record<string, unknown> {
  const layoutId = process.env.ZOHO_LEADS_LAYOUT_ID;

  const payload: Record<string, unknown> = {};

  if (layoutId) {
    payload.Layout = { id: layoutId };
  }

  // Source landing page identifier (set via Netlify env var ZOHO_LP_SOURCE)
  const lpSource = process.env.ZOHO_LP_SOURCE?.trim();
  if (lpSource) payload.Source_LP_v2 = lpSource;

  // Mandatory fields: Last_Name and Company
  payload.Last_Name =
    maybePrefixTest(data.parent_name as string | undefined) ||
    (data.student_name ? `Student: ${maybePrefixTest(data.student_name as string | undefined)}` : null) ||
    "Unknown";

  // Company is system-mandatory in Zoho; map from school name or default
  payload.Company = (data.school_name as string) || "Individual";

  // Core contact (system fields Email, Phone, Lead_Status kept as-is for CRM functionality)
  if (data.parent_name) payload.Parent_Name_v2 = maybePrefixTest(data.parent_name as string | undefined);
  if (data.student_name) payload.Student_Name_v2 = maybePrefixTest(data.student_name as string | undefined);
  const parentEmail = data.parent_email as string | undefined;
  if (parentEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
    payload.Email = parentEmail;
  }
  if (data.phone_number) payload.Phone = data.phone_number as string;

  // Academic
  if (data.current_grade) payload.Current_Grade_v2 = data.current_grade;
  if (data.school_name) payload.School_Name_v2 = data.school_name;
  if (data.curriculum_type) payload.Curriculum_Type_v2 = data.curriculum_type;
  if (data.grade_format) payload.Grade_Format_v2 = data.grade_format;
  if (data.percentage_value != null) payload.Percentage_Value_v2 = data.percentage_value;
  if (data.gpa_value != null) payload.GPA_Value_v2 = data.gpa_value;

  // Location / tracking
  if (data.location) payload.Location_v2 = data.location;
  if (data.form_filler_type) payload.Form_Filler_Type_v2 = data.form_filler_type;
  if (data.lead_category) payload.Lead_Category_v2 = data.lead_category;

  // UTM & ad tracking
  if (data.utm_campaign) payload.Campaign_v2 = data.utm_campaign;
  if (data.utm_medium) payload.Medium_v2 = data.utm_medium;
  if (data.utm_source) payload.Lead_Source_v2 = data.utm_source;
  if (data.utm_term) payload.Term_v2 = data.utm_term;
  if (data.utm_content) payload.LP_v2 = data.utm_content;
  if (data.utm_id) payload.UTM_ID_v2 = data.utm_id;
  if (data.campaign_id) payload.Campaign_ID_v2 = data.campaign_id;
  if (data.utm_adset) payload.Adset_v2 = data.utm_adset;
  if (data.adset_id) payload.Adset_ID_v2 = data.adset_id;
  if (data.ad_id) payload.Ad_ID_v2 = data.ad_id;
  if (data.utm_placement) payload.Placement_v2 = data.utm_placement;

  // Scholarship & targets
  if (data.scholarship_requirement)
    payload.Scholarship_Requirement_v2 = data.scholarship_requirement;
  if (data.target_geographies)
    payload.Target_Geographies_v2 = Array.isArray(data.target_geographies)
      ? data.target_geographies.join(", ")
      : data.target_geographies;

  // Counselling (Page 2)
  let isoDate: string | null = null;
  if (data.selected_date) {
    const parsed = new Date(String(data.selected_date));
    if (!isNaN(parsed.getTime())) isoDate = parsed.toISOString().split("T")[0];
  }
  if (isoDate) payload.Selected_Date_v2 = isoDate;

  if (data.selected_slot && isoDate) {
    const slotStr = String(data.selected_slot).trim();
    const match = slotStr.match(/^(\d{1,2})\s*(AM|PM)$/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const ampm = match[2].toUpperCase();
      if (ampm === "PM" && hour !== 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      const hourStr = String(hour).padStart(2, "0");
      payload.Selected_Time_v2 = `${isoDate}T${hourStr}:00:00`;
    }
  }

  // Session tracking
  if (data.session_id) payload.Session_ID_v2 = data.session_id;

  // Submission status & sub-category (abandonment tracking)
  if (isFinalSubmit) {
    payload.Submission_Status_v2 = "submitted";
    payload.Lead_Status = "In Progress";
    payload.Lead_Subcategory_v2 = null;
  } else {
    payload.Lead_Status = "New";
    const subcategory = computeLeadSubcategory(data, false);
    if (subcategory) payload.Lead_Subcategory_v2 = subcategory;
  }

  return payload;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { step, zohoLeadId, isFinalSubmit, ...rawFormData } = body;
    const formData = normalizeFormData(rawFormData);
    const final = Boolean(isFinalSubmit);

    if (!step || ![1, 2].includes(step)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing or invalid step (must be 1 or 2)" }),
      };
    }

    const { accessToken, apiDomain } = await refreshZohoToken();
    const baseUrl = `${apiDomain}/crm/v8/Leads`;

    // Skip drop leads entirely
    if (step === 1 && formData.lead_category === "drop") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          skipped: true,
          reason: "Drop leads are not synced to Zoho CRM",
        }),
      };
    }

    // Skip student leads entirely (DT-002)
    // Student leads stay in Supabase/Google Sheets only — no clear business routine for CRM yet
    if (step === 1 && formData.form_filler_type === "student") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          skipped: true,
          reason: "Student leads are not synced to Zoho CRM",
        }),
      };
    }

    if (step === 1) {
      // Duplicate check: search for existing lead with same Session_ID_v2
      if (formData.session_id) {
        try {
          const searchUrl = `${baseUrl}/search?criteria=(Session_ID_v2:equals:${formData.session_id})`;
          const searchRes = await fetch(searchUrl, {
            headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
          });

          // Guard: Zoho sometimes returns an empty body (e.g. 204 No Content)
          // which causes JSON.parse to throw
          const searchText = await searchRes.text();
          let searchData: { data?: { id: string }[] } | null = null;
          try {
            searchData = searchText ? JSON.parse(searchText) : null;
          } catch {
            console.error("Zoho duplicate search returned invalid JSON, proceeding with create");
          }

          if (searchData?.data?.length > 0) {
            const existingId = searchData.data[0].id;
            console.log(`Zoho duplicate found for session ${formData.session_id}: ${existingId}, returning existing ID`);
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: true,
                zohoLeadId: existingId,
                recovered: true,
              }),
            };
          }
        } catch (searchErr) {
          console.error("Zoho duplicate search failed (proceeding with create):", searchErr);
          // Non-blocking — proceed to create if search fails
        }
      }

      // CREATE lead
      const payload = buildZohoPayload(formData, final);

      // Assign lead owner on CREATE only (Zoho restricts Owner changes on UPDATE)
      const ownerId = process.env.ZOHO_OWNER_ID;
      if (ownerId) {
        payload.Owner = { id: ownerId };
      }

      // Zoho datetime fields need T separator and reject milliseconds.
      // Netlify Functions run in UTC; explicitly convert to IST (Asia/Kolkata)
      // so Zoho stores the correct local time (it interprets input as account timezone).
      const now = new Date();
      const istParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }).formatToParts(now);
      const get = (type: string) => istParts.find(p => p.type === type)?.value || '00';
      payload.Created_At_v2 = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;

      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: [payload] }),
      });

      const result = await res.json();

      if (!res.ok || result.data?.[0]?.code !== "SUCCESS") {
        console.error("Zoho create lead error:", JSON.stringify(result));
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: "Zoho lead creation failed",
            details: result,
          }),
        };
      }

      const createdId = result.data[0].details?.id;
      const subcategory = computeLeadSubcategory(formData, final);
      console.log(`Zoho lead created: ${createdId} | category: ${formData.lead_category}${subcategory ? ` | subcategory: ${subcategory}` : ""}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          zohoLeadId: createdId,
        }),
      };
    }

    if (step === 2) {
      if (!zohoLeadId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: "Missing zohoLeadId for step 2 update",
          }),
        };
      }

      // UPDATE lead
      const payload = buildZohoPayload(formData, final);
      payload.id = zohoLeadId;

      const res = await fetch(`${baseUrl}/${zohoLeadId}`, {
        method: "PUT",
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: [payload] }),
      });

      const result = await res.json();

      if (!res.ok || result.data?.[0]?.code !== "SUCCESS") {
        console.error("Zoho update lead error:", JSON.stringify(result));
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: "Zoho lead update failed",
            details: result,
          }),
        };
      }

      const subcategory = computeLeadSubcategory(formData, final);
      console.log(`Zoho lead updated: ${zohoLeadId}${final ? " | FINAL SUBMIT" : ""}${subcategory ? ` | subcategory: ${subcategory}` : ""}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid step" }),
    };
  } catch (error: unknown) {
    console.error("Zoho CRM function error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message,
      }),
    };
  }
};
