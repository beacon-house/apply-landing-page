# **Beacon House \- New Landing Page Workflow Setup**

## **Project Overview**

New admissions landing page for Beacon House with simplified form structure, database integration, updated lead categories, and new custom pixel events. This runs alongside the existing landing page at admissions.beaconhouse.in.

## **Key Improvements Over Old Landing Page**

* Simplified form structure  
* Database integration (dual save: Supabase \+ Google Sheets)  
* New custom pixel events  
* Updated lead categories

## **Development & Deployment Workflow**

### **GitHub Repository**

* **Repository:** https://github.com/beacon-house/new-admissions-landing-page  
* **Main Branch:** main \- Production-ready code  
* **Staging Branch:** staging \- Development/testing branch

### **Development Process**

1. **Development:** Pull code into Bolt.new from GitHub  
2. **Testing:** Work on required changes in Bolt.new with live preview  
3. **Staging Deploy:** Push changes to staging branch  
4. **Validation:** Test on staging environment  
5. **Production Deploy:** Push/merge to main branch after validation

## **Current Deployment \- Staging**

### **Staging Site**

* **Branch:** staging  
* **Domain:** staging-v3-admissions-bch.netlify.app  
* **Purpose:** Testing and validation

### **Environment Variables (Staging)**

\# Supabase Configuration  
VITE\_SUPABASE\_URL=\[staging-project-url\]  
VITE\_SUPABASE\_ANON\_KEY=\[staging-project-key\]

\# Other Environment Variables  
VITE\_ENVIRONMENT=stg  
VITE\_META\_PIXEL\_ID=\[staging-pixel-id\]  
VITE\_REGISTRATION\_WEBHOOK\_URL=\[staging-webhook-url\]

## **Current Deployment \- Production**

### **Production Site**

* **Branch:** main  
* **Domain:** apply.beaconhouse.in  
* **Purpose:** Live site for real customers (runs alongside existing admissions.beaconhouse.in)

### **Environment Variables (Production)**

\# Supabase Configuration  
VITE\_SUPABASE\_URL=\[production-project-url\]  
VITE\_SUPABASE\_ANON\_KEY=\[production-project-key\]

\# Other Environment Variables  
VITE\_ENVIRONMENT=prod  
VITE\_META\_PIXEL\_ID=\[production-pixel-id\]  
VITE\_REGISTRATION\_WEBHOOK\_URL=\[production-webhook-url\]

## **Database \- Supabase**

### **Current Setup**

* **Organization:** beacon-house-projects  
* **Project:** new-admissions-landing-page  
* **Table:** form\_sessions  
* Two branches \- main and staging \- set up for testing in staging and main environments

### **Single Organization Approach**

Both staging and production projects will be in the same Supabase organization for cost optimization while maintaining complete database isolation.

## **Netlify Deployment Setup**

### **Staging Site**

* **Branch:** staging  
* **Netlify Site:** staging-v3-admissions-bch.netlify.app  
* **GitHub Integration:** Staging branch auto-deploys to this site  
* **Environment Variables:** Uses staging environment variables (stg)

### **Production Site**

* **Branch:** main  
* **Netlify Site:** apply.beaconhouse.in  
* **GitHub Integration:** Main branch auto-deploys to this site  
* **Environment Variables:** Uses production environment variables (prod)

### **Deployment Flow**

* **Staging:** Push to staging branch → Auto-deploy to staging-v3-admissions-bch.netlify.app  
* **Production:** Push/merge to main branch → Auto-deploy to apply.beaconhouse.in

## **Lead Collection Flow**

### **Dual-Save Architecture**

1. **User fills form** on landing page  
2. **Primary save:** Data written to Supabase database  
3. **Secondary save:** Form submission triggers webhook URL  
4. **Make.com scenario** processes webhook data  
5. **Backup storage:** Data written to Google Spreadsheet  
6. **Notifications:** Email alerts and calendar invites

### **Staging Data Flow**

**Form Submission** → **Supabase DB Save** \+ **Webhook** → **Make.com Scenario** ("02.staging-admissions-bch page v3 \- WIP") → **Google Sheet** (staging-v4 tab) \+ **Email** (nkgoutham@gmail.com) \+ **Calendar Invite**

### **Production Data Flow**

**Form Submission** → **Supabase DB Save** \+ **Webhook** → **Make.com Scenario** → **Google Sheet** (prod-v4 tab) \+ **Email** (Vishy & Karthik) \+ **Calendar Invite**

## **Data Storage Structure**

### **Supabase Database**

* **Environment Separation:** Separate projects for staging vs production  
* **Schema:** Identical table structure across environments  
* **Primary Storage:** Real-time application queries

### **Google Spreadsheet Backup**

* **Spreadsheet:** "admissions-beaconhouse-in \- leads"  
* **Staging Tab:** staging-v4  
* **Production Tab:** prod-v4  
* **Purpose:** Backup storage and manual analysis

## **Make.com Integration**

### **Staging Scenario**

* **Name:** "02.staging-admissions-bch page v3 \- WIP"  
* **Webhook URL:** Connected to staging environment  
* **Recipients:** nkgoutham@gmail.com

### **Production Scenario**

* **Name:** done  
* **Webhook URL:** Connected to production environment  
* **Recipients:** Vishy & Karthik email addresses

## **Lead Categorization Logic**

### **Qualified Categories (Counseling Booking)**

* **BCH:** Grades 8-10 \+ optional/partial scholarship OR Grade 11 \+ US target  
* **Luminaire L1:** Grade 11 \+ optional scholarship \+ non-US target OR Grade 12 \+ optional  
* **Luminaire L2:** Grade 11 \+ partial scholarship \+ non-US target OR Grade 12 \+ partial

### **Disqualified Categories (Contact Info Only)**

* **Nurture:** Student forms, full scholarship requirements, general cases  
* **Drop:** Grade 7 and below  
* **Masters:** Graduate program applicants

## **Analytics & Tracking**

### **Meta Pixel Events**

* **Primary Classification:** Parent/student, qualified/disqualified, spam detection  
* **Funnel Events:** Page views, CTA clicks, form progression  
* **Category-Specific:** BCH, Luminaire L1/L2 specific events  
* **Environment Suffix:** All events include environment identifier (prod/stg)

### **Form Flow by Category**

* **Qualified Leads:** Page 1 → Page 2A (counseling booking with date/time selection)  
* **Disqualified Leads:** Page 1 → Page 2B (contact information only)

## **Technology Stack**

### **Frontend Development**

* **Platform:** Bolt.new for development with live preview  
* **Framework:** Modern JavaScript/React-based  
* **Styling:** Responsive design

### **Backend Services**

* **Primary Database:** Supabase (PostgreSQL)  
* **Backup Storage:** Google Sheets via Make.com  
* **Webhooks:** Make.com automation  
* **Analytics:** Meta Pixel, Google Analytics

### **Deployment**

* **Hosting:** Netlify  
* **Domain Management:** apply.beaconhouse.in (production), staging-v3-admissions-bch.netlify.app (staging)  
* **SSL:** Automatic via Netlify  
* **Environment Management:** Branch-based deployment with environment variables

## **Coexistence Strategy**

### **Current State**

* **Old Landing Page:** admissions.beaconhouse.in (different repository, active ads)  
* **New Landing Page:** apply.beaconhouse.in (live and operational)

### **Live State**

* **Old Landing Page:** admissions.beaconhouse.in (continues running)  
* **New Landing Page:** apply.beaconhouse.in (live production site)  
* **Strategy:** Both landing pages running simultaneously

## **Production Deployment \- Completed**

The following production deployment steps have been completed:

1. ✅ **Supabase project created** in beacon-house-projects org  
2. ✅ **Main branch deployed** to apply.beaconhouse.in via Netlify  
3. ✅ **Domain configured** \- apply.beaconhouse.in is live  
4. ✅ **Make.com scenario duplicated** with production webhook URL  
5. ✅ **Email recipients updated** to Vishy & Karthik  
6. ✅ **Complete data flow tested** and operational

**Status:** Production site is live and fully operational at apply.beaconhouse.in

## **Meta CAPI Integration via Edge Function**

### **Supabase Edge Function - meta-capi**

* **Purpose:** Server-side Meta Conversions API (CAPI) integration
* **Function Name:** `meta-capi`
* **Location:** `supabase/functions/meta-capi/index.ts`
* **Deployment:** Deployed to both `staging` and `main` branches in Supabase

### **Edge Function Workflow**

1. **Receives Event Data:** Frontend sends form data + Meta Pixel events to Edge Function
2. **Stape.io Integration:** Forwards events to Stape.io CAPI Gateway for Meta
3. **Make.com Integration:** Sends form data to branch-specific Make.com webhook
4. **Dual Success Response:** Returns success status for both integrations

### **Supabase Secrets Configuration**

#### **Branch-Specific Secrets**

The Edge Function uses **branch-specific secrets** to automatically route to the correct services:

**Staging Branch Secrets:**
```
STAPE_CAPIG_API_KEY=[staging-api-key]
STAPE_CAPIG_URL=[staging-stape-url]
MAKE_WEBHOOK_URL=[staging-make-webhook-url]
```

**Main Branch Secrets:**
```
STAPE_CAPIG_API_KEY=[production-api-key]
STAPE_CAPIG_URL=[production-stape-url]
MAKE_WEBHOOK_URL=[production-make-webhook-url]
```

#### **How Branch-Specific Secrets Work**

* **Automatic Resolution:** Supabase automatically provides the correct secret values based on the branch the Edge Function is deployed to
* **No Conditional Logic:** The Edge Function code is identical in both branches - it simply calls `Deno.env.get('MAKE_WEBHOOK_URL')` and receives the appropriate value
* **Environment Isolation:** Complete separation between staging and production configurations

### **Meta CAPI (Conversions API) Integration**

#### **Stape.io CAPI Gateway**

* **Purpose:** Secure server-side Meta Pixel event forwarding
* **Technology:** Stape.io as CAPI Gateway provider
* **Authentication:** API key-based authentication
* **Data Flow:** Edge Function → Stape.io → Meta CAPI

#### **CAPI Payload Structure**

```javascript
{
  event_name: "apply_page_1_continue_stg", // Environment-specific event name
  event_id: "unique-event-id", // For deduplication
  event_time: 1640995200, // Unix timestamp
  user_data: {
    em: ["email@domain.com"], // Hashed email
    ph: ["+919876543210"], // Hashed phone
    fn: ["John"], // Hashed first name
    ln: ["Doe"] // Hashed last name
  },
  custom_data: {
    lead_category: "bch",
    form_filler_type: "parent",
    current_grade: "11",
    // ... other form fields
  },
  source_url: "https://admissions.beaconhouse.in",
  event_source_url: "https://admissions.beaconhouse.in/application-form"
}
```

#### **Event Deduplication**

* **Event ID:** Each event gets a unique `eventId` for deduplication between browser and server events
* **Consistent Naming:** Browser events and server events use the same event names
* **Meta Processing:** Meta's system automatically deduplicates events with matching `event_id`

## **Complete Data Flow Architecture**

### **Form Submission Pipeline**

```
Frontend Form Submission
    ↓
1. Browser Meta Pixel Event (with eventId)
    ↓
2. FormContainer.tsx → Edge Function Call
    ↓
3. Edge Function Processing:
    a. Fetch branch-specific secrets
    b. Send to Stape.io CAPI Gateway
    c. Send to Make.com webhook
    ↓
4. Parallel Processing:
    a. Stape.io → Meta CAPI (server-side)
    b. Make.com → Google Sheets + Email + Calendar
    ↓
5. Database Storage (Supabase)
```

### **Environment-Specific Routing**

* **Staging:** `staging-v3-admissions-bch.netlify.app` → Supabase `staging` branch → Staging Make.com webhook
* **Production:** `apply.beaconhouse.in` → Supabase `main` branch → Production Make.com webhook

### **Error Handling**

* **Stape.io Failure:** Logged but doesn't block Make.com webhook
* **Make.com Failure:** Logged but doesn't block Stape.io CAPI
* **Partial Success:** Function returns success status for each integration separately

## **Security & Best Practices**

### **Secret Management**

* **Branch Isolation:** Secrets are completely isolated between staging and production
* **No Hardcoded Values:** All sensitive data stored in Supabase Edge Function secrets
* **Automatic Injection:** Secrets injected at runtime by Supabase platform

### **CORS Configuration**

* **Permissive CORS:** Allows all origins for development flexibility
* **Production Consideration:** Could be tightened to specific domains for enhanced security

### **Data Privacy**

* **User Data Hashing:** Email, phone, and name data hashed before sending to Meta CAPI
* **Minimal Data Transfer:** Only necessary form fields included in payloads
* **Compliance:** Structure supports GDPR/privacy compliance requirements

## **Troubleshooting & Monitoring**

### **Edge Function Logs**

* **Access:** Supabase Dashboard → Edge Functions → Function Name → Logs
* **Key Indicators:**
  - `📥 Received event data:` - Confirms function received call
  - `📤 Sending to Stape.io:` - Confirms CAPI attempt
  - `📤 Sending to Make.com webhook` - Confirms webhook attempt
  - `✅ Successfully sent...` - Confirms successful delivery

### **Common Issues**

* **Secret Not Found:** Check branch-specific secret configuration
* **Webhook Failure:** Verify Make.com webhook URL and scenario status
* **CAPI Failure:** Check Stape.io API key and endpoint configuration

### **Testing Edge Function**

```bash
# Test staging
curl -X POST https://[staging-project-id].supabase.co/functions/v1/meta-capi \
  -H "Authorization: Bearer [staging-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"eventName":"test_event","eventId":"test-123","formData":{"test":"data"}}'

# Test production
curl -X POST https://[production-project-id].supabase.co/functions/v1/meta-capi \
  -H "Authorization: Bearer [production-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"eventName":"test_event","eventId":"test-123","formData":{"test":"data"}}'
```

## **Future Enhancements**

### **Potential Improvements**

* **Enhanced Error Handling:** Implement retry logic for failed webhook calls
* **Rate Limiting:** Add request throttling for high-volume scenarios
* **Metrics Collection:** Add performance monitoring and success rate tracking
* **CORS Tightening:** Restrict origins to specific domains for production
* **Webhook Validation:** Add signature verification for Make.com webhooks

### **Scalability Considerations**

* **Edge Function Limits:** Monitor function execution time and memory usage
* **Secret Rotation:** Plan for periodic API key rotation
* **Load Testing:** Validate performance under high form submission volumes