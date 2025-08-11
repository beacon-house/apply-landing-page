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

* **Repository:** https://github.com/beacon-house/apply-landing-page
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
* **Domain:** https://staging-v2-apply-bch-in.netlify.app/
* **Purpose:** Testing and validation

### **Environment Variables (Staging)**

\# Supabase Configuration  
VITE\_SUPABASE\_URL=\[staging-branch-url\]  
VITE\_SUPABASE\_ANON\_KEY=\[staging-branch-key\]

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
VITE\_SUPABASE\_URL=\[main-branch-url\]  
VITE\_SUPABASE\_ANON\_KEY=\[main-branch-key\]

\# Other Environment Variables  
VITE\_ENVIRONMENT=prod  
VITE\_META\_PIXEL\_ID=\[production-pixel-id\]  
VITE\_REGISTRATION\_WEBHOOK\_URL=\[production-webhook-url\]

## **Database \- Supabase**

### **Current Setup - Supabase Branching Architecture**

* **Organization:** new-admissions-landing-page
* **Main Project:** apply-new-adms-lp-v2-prod
* **Branching Strategy:** 
  - **Main Branch:** Connected to GitHub main branch (Production)
  - **Staging Branch:** Connected to GitHub staging branch (Development/Testing)
* **Table:** form\_sessions (consistent across all branches)

### **Branch Configuration**

**Staging Branch:**
* **Connected to:** GitHub staging branch
* **Environment:** Development/Testing
* **Auto-deployment:** Staging branch changes auto-deploy to staging environment

**Main Branch:**  
* **Connected to:** GitHub main branch
* **Environment:** Production
* **Auto-deployment:** Main branch changes auto-deploy to production environment

### **Development Workflow**

1. **Development Phase:** Make changes in Supabase staging branch
2. **Testing Phase:** Test changes in staging environment 
3. **Production Deployment:** Push/merge staging branch to main branch in Supabase
4. **GitHub Sync:** Changes automatically sync with corresponding GitHub branches

## **Netlify Deployment Setup**

### **Staging Site**

* **Branch:** staging  
* **Netlify Site:** https://staging-v2-apply-bch-in.netlify.app/
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

**Form Submission** → **Supabase DB Save** \+ **Webhook** → **Make.com Scenario** ("04.stg-apply-bch page v2") → **Google Sheet** (apply-beaconhouse.in leads > staging-v2 tab) \+ **Email** (nkgoutham@gmail.com) \+ **Calendar Invite**

### **Production Data Flow**

**Form Submission** → **Supabase DB Save** \+ **Webhook** → **Make.com Scenario** ("04.prod-apply-bch page v2") → **Google Sheet** (prod-v4 tab) \+ **Email** (Vishy & Karthik) \+ **Calendar Invite**

## **Data Storage Structure**

### **Supabase Database**

* **Environment Separation:** Separate branches (staging vs main) within single project
* **Schema:** Identical table structure across environments  
* **Primary Storage:** Real-time application queries
* **Branch Management:** Changes flow from staging branch → main branch

### **Google Spreadsheet Backup**

* **Spreadsheet:** "apply-beaconhouse.in leads"  
* **Staging Tab:** staging-v2  
* **Production Tab:** prod-v2  
* **Purpose:** Actual leads repository and manual analysis


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


## **Security & Best Practices**

### **Secret Management**

* **No Hardcoded Values:** All sensitive data stored in Supabase Edge Function secrets
* **Automatic Injection:** Secrets injected at runtime by Supabase platform

### **CORS Configuration**

* **Permissive CORS:** Allows all origins for development flexibility
* **Production Consideration:** Could be tightened to specific domains for enhanced security

### **Data Privacy**

* **Minimal Data Transfer:** Only necessary form fields included in payloads
* **Compliance:** Structure supports GDPR/privacy compliance requirements