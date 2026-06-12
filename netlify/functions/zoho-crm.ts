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
    throw new Error(`Zoho token refresh failed: ${tokenRes.status} ${text}`);
  }

  const tokenData: ZohoTokenResponse = await tokenRes.json();

  if (!tokenData.access_token) {
    throw new Error("Zoho token response missing access_token");
  }

  const defaultApiDomain = accountsUrl.includes(".in")
    ? "https://www.zohoapis.in"
    : "https://www.zohoapis.com";

  return {
    accessToken: tokenData.access_token,
    apiDomain: tokenData.api_domain || defaultApiDomain,
  };
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

  // Mandatory field: prefix student name for clarity, replace with parent name when available
  payload.Last_Name =
    maybePrefixTest(data.parent_name) ||
    (data.student_name ? `Student: ${maybePrefixTest(data.student_name)}` : null) ||
    "Unknown";

  // Core contact
  if (data.student_name) payload.Student_s_Name = maybePrefixTest(data.student_name); // repurposed field
  // Email: validate format before sending — Zoho rejects invalid emails
  if (data.parent_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.parent_email))) {
    payload.Email = data.parent_email;
  }
  if (data.phone_number) payload.Phone = data.phone_number;

  // Academic
  if (data.current_grade) payload.Current_Grade_v1 = Number(data.current_grade) || null;
  if (data.school_name) payload.School_Name = data.school_name;
  if (data.curriculum_type) payload.Curriculum_Type1 = data.curriculum_type;
  if (data.grade_format) payload.Grade_Format = data.grade_format;
  // GPA/Percentage: Zoho fields typed as Decimal
  if (data.percentage_value != null)
    payload.Percentage_Value1 = Number(data.percentage_value) || null;
  if (data.gpa_value != null)
    payload.GPA_Value1 = Number(data.gpa_value) || null;

  // Location / tracking
  if (data.location) payload.Location_v1 = data.location;
  if (data.form_filler_type) payload.Form_Filler_Type = data.form_filler_type;
  if (data.lead_category) payload.Lead_Category = data.lead_category;

  // UTM & ad tracking
  if (data.utm_campaign) payload.Campaign = data.utm_campaign;
  if (data.utm_medium) payload.Medium = data.utm_medium;
  if (data.utm_source) payload.Lead_Source2 = data.utm_source;
  if (data.utm_term) payload.Term = Number(data.utm_term) || null;
  if (data.utm_content) payload.LP = data.utm_content;
  if (data.utm_id) payload.UTM_ID = Number(data.utm_id) || null;
  if (data.campaign_id) payload.Campaign_ID = Number(data.campaign_id) || null;
  if (data.utm_adset) payload.Adset = data.utm_adset;
  if (data.adset_id) payload.Adest_ID = Number(data.adset_id) || null; // Zoho has typo "Adest"
  if (data.ad_id) payload.Ad_ID = Number(data.ad_id) || null;
  if (data.utm_placement) payload.Placement = data.utm_placement;

  // Scholarship & targets
  if (data.scholarship_requirement)
    payload.Scholarship_Requirements = data.scholarship_requirement;
  if (data.target_geographies)
    payload.Target_Geographies = Array.isArray(data.target_geographies)
      ? data.target_geographies.join(", ")
      : data.target_geographies;

  // Counselling (Page 2)
  // Parse selected_date: form stores "Wednesday, June 11, 2026" → Zoho needs "2026-06-11"
  let isoDate: string | null = null;
  if (data.selected_date) {
    const parsed = new Date(String(data.selected_date));
    if (!isNaN(parsed.getTime())) isoDate = parsed.toISOString().split("T")[0];
  }
  if (isoDate) payload.Selected_Date = isoDate;

  // Parse selected_slot: form stores "10 AM" / "3 PM" → Zoho date/time needs "2026-06-11T10:00:00"
  if (data.selected_slot && isoDate) {
    const slotStr = String(data.selected_slot).trim();
    const match = slotStr.match(/^(\d{1,2})\s*(AM|PM)$/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const ampm = match[2].toUpperCase();
      if (ampm === "PM" && hour !== 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      const hourStr = String(hour).padStart(2, "0");
      payload.Selected_Time = `${isoDate}T${hourStr}:00:00`;
    }
  }

  // Session tracking
  if (data.session_id) payload.Session_ID = data.session_id;

  // Submission status & sub-category (abandonment tracking)
  if (isFinalSubmit) {
    payload.Submission_Status = "submitted";
    payload.Lead_Status = "In Progress";
    // Clear sub-category on final submit (lead is no longer partial)
    payload.Lead_Subcategory = null;
  } else {
    payload.Lead_Status = "New";
    const subcategory = computeLeadSubcategory(data, false);
    if (subcategory) payload.Lead_Subcategory = subcategory;
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

    if (step === 1) {
      // Duplicate check: search for existing lead with same Session_ID
      if (formData.session_id) {
        try {
          const searchUrl = `${baseUrl}/search?criteria=(Session_ID:equals:${formData.session_id})`;
          const searchRes = await fetch(searchUrl, {
            headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
          });
          const searchData = await searchRes.json();

          if (searchData.data?.length > 0) {
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
