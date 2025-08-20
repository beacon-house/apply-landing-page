/**
 * Form Submission and Validation Library - Fixed for Consistent Field Names
 * 
 * Purpose: Handles form submission with consistent snake_case field names
 * that match the database schema exactly.
 * 
 * Changes made:
 * - Fixed field name consistency (snake_case for webhook payload)
 * - Simplified webhook payload structure
 * - Removed complex field mapping
 * - Clean separation between frontend and backend field names
 */

import { LeadCategory, CompleteFormData } from '@/types/form';
import { initialLeadCaptureSchema, qualifiedLeadSchema, disqualifiedLeadSchema } from '@/schemas/form';
import { ZodError } from 'zod';
import { 
  validateLeadCategory, 
  sanitizeLeadCategory, 
  logLeadCategoryError,
  validateFormDataConsistency 
} from './dataValidation';
import { debugLog, errorLog } from '@/lib/logger';
import { useFormStore } from '@/store/formStore';

export class FormValidationError extends Error {
  constructor(public errors: { [key: string]: string[] }) {
    super('Form validation failed');
    this.name = 'FormValidationError';
  }
}

// Form submission helper with consistent field names
export const submitFormData = async (
  data: Partial<CompleteFormData>,
  step: number,
  startTime: number,
  isComplete: boolean = false,
  triggeredEvents: string[] = []
): Promise<Response> => {
  const webhookUrl = import.meta.env.VITE_REGISTRATION_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    throw new Error('Form submission URL not configured. Please check environment variables.');
  }
  
  // Get the latest UTM parameters from the store
  const { utmParameters } = useFormStore.getState();
  
  // Use the provided triggered events array
  debugLog('📊 Triggered events being sent:', triggeredEvents);
  
  // Validate and sanitize lead category before webhook submission
  const originalCategory = data.lead_category;
  const sanitizedCategory = sanitizeLeadCategory(originalCategory);
  
  if (originalCategory && !sanitizedCategory) {
    logLeadCategoryError(
      'Webhook Submission - Invalid Category',
      originalCategory,
      undefined,
      { step, isComplete }
    );
  }
  
  // Determine if this is a qualified lead and if counseling is booked
  const isQualifiedLead = ['bch', 'lum-l1', 'lum-l2'].includes(sanitizedCategory || '');
  const isCounsellingBooked = Boolean(data.selectedDate && data.selectedSlot);
  
  // Determine funnel stage
  let funnelStage = 'page1_submitted';
  if (step === 2) {
    if (isCounsellingBooked) {
      funnelStage = 'counseling_booked';
    } else {
      funnelStage = 'contact_details_entered';
    }
  }
  if (isComplete) {
    funnelStage = 'form_complete';
  }

  // Create the webhook payload with consistent snake_case field names matching database
  const webhookPayload: Record<string, any> = {
    // Core session data
    session_id: data.sessionId || crypto.randomUUID(),
    environment: import.meta.env.VITE_ENVIRONMENT?.trim(),
    
    // Page 1: Student Information (snake_case)
    form_filler_type: data.formFillerType,
    student_name: data.studentName,
    current_grade: data.currentGrade,
    phone_number: (data.countryCode || '') + (data.phoneNumber || ''),
    
    // Page 1: Academic Information (snake_case)
    curriculum_type: data.curriculumType,
    grade_format: data.gradeFormat,
    gpa_value: data.gpaValue || null,
    percentage_value: data.percentageValue || null,
    school_name: data.schoolName,
    
    // Page 1: Study Preferences (snake_case)
    scholarship_requirement: data.scholarshipRequirement,
    target_geographies: Array.isArray(data.targetGeographies) ? data.targetGeographies : [],
    
    // Page 2: Parent Contact Information (snake_case)
    parent_name: data.parentName || null,
    parent_email: data.email || null, // Frontend uses 'email', webhook/DB uses 'parent_email'
    
    // Page 2A: Counseling Information (snake_case)
    selected_date: isQualifiedLead ? (data.selectedDate || null) : null,
    selected_slot: isQualifiedLead ? (data.selectedSlot || null) : null,
    
    // System Fields (snake_case)
    lead_category: sanitizedCategory,
    is_counselling_booked: isCounsellingBooked,
    funnel_stage: funnelStage,
    is_qualified_lead: isQualifiedLead,
    page_completed: step,
    triggered_events: triggeredEvents,
    
    // UTM Parameters (snake_case)
    utm_source: utmParameters.utm_source || null,
    utm_medium: utmParameters.utm_medium || null,
    utm_campaign: utmParameters.utm_campaign || null,
    utm_term: utmParameters.utm_term || null,
    utm_content: utmParameters.utm_content || null,
    utm_id: utmParameters.utm_id || null,
    
    // Timestamp
    created_at: new Date().toISOString()
  };

  debugLog('Sending webhook data:', webhookPayload);
  debugLog('📊 Triggered events being sent:', triggeredEvents);
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(webhookPayload),
  });

  // Enhanced error handling with response details
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error details available');
    errorLog('Form submission failed:', {
      status: response.status,
      statusText: response.statusText,
      errorText
    });
    throw new Error(`Form submission failed: ${response.status} ${response.statusText}`);
  }
  
  debugLog(`Webhook success: Lead category "${sanitizedCategory}" submitted successfully`);
  return response;
};

// Enhanced form validation helper
export const validateForm = async (
  step: number,
  data: Partial<CompleteFormData>
): Promise<void> => {
  try {
    switch (step) {
      case 1:
        await initialLeadCaptureSchema.parseAsync(data);
        break;
      case 2:
        // Validate based on lead category
        const isQualified = ['bch', 'lum-l1', 'lum-l2'].includes(data.lead_category || '');
        if (isQualified) {
          await qualifiedLeadSchema.parseAsync(data);
        } else {
          await disqualifiedLeadSchema.parseAsync(data);
        }
        break;
      default:
        throw new Error('Invalid form step');
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors: { [key: string]: string[] } = {};
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(err.message);
      });
      throw new FormValidationError(formattedErrors);
    }
    throw error;
  }
};

// Form validation helper
export const validateFormStep = (
  step: number,
  data: Partial<CompleteFormData>
): boolean => {
  try {
    switch (step) {
      case 1:
        return initialLeadCaptureSchema.safeParse(data).success;
      case 2:
        const isQualified = ['bch', 'lum-l1', 'lum-l2'].includes(data.lead_category || '');
        if (isQualified) {
          return qualifiedLeadSchema.safeParse(data).success;
        } else {
          return disqualifiedLeadSchema.safeParse(data).success;
        }
      default:
        return false;
    }
  } catch {
    return false;
  }
};

// Check if lead is qualified for counseling
export const isQualifiedLead = (leadCategory: LeadCategory): boolean => {
  return ['bch', 'lum-l1', 'lum-l2'].includes(leadCategory);
};