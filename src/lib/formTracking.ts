/**
 * Form Funnel Tracking Utility - Fixed for Consistent Field Names
 * 
 * Purpose: Provides incremental form tracking with consistent snake_case field names
 * that match the database schema exactly.
 * 
 * Changes made:
 * - Removed CAPI-related tracking fields
 * - Simplified to core form tracking functionality
 */

import { supabase } from './database';
import { debugLog, errorLog } from '@/lib/logger';
import { useFormStore } from '@/store/formStore';

// Generate unique session ID for tracking
export const generateSessionId = (): string => {
  return crypto.randomUUID();
};

// Funnel stages - Updated with descriptive names
// Only these stages should be used for new leads going forward
export type FunnelStage = 
  | '01_form_start'
  | '02_page1_student_info_filled'
  | '03_page1_academic_info_filled'
  | '04_page1_scholarship_info_filled'
  | '05_page1_complete'
  | '06_lead_evaluated'
  | '07_page_2_view'
  | '08_page_2_counselling_slot_selected'
  | '09_page_2_parent_details_filled'
  | '10_form_submit'
  | 'abandoned';

/**
 * Save form data incrementally using the simplified upsert function
 */
export const saveFormDataIncremental = async (
  sessionId: string,
  pageNumber: number,
  funnelStage: FunnelStage,
  formData: any
): Promise<void> => {
  try {
    // Determine if counseling is booked
    const isCounsellingBooked = Boolean(formData.selectedDate && formData.selectedSlot);
    
    // Determine if this is a qualified lead
    const isQualifiedLead = ['bch', 'lum-l1', 'lum-l2'].includes(formData.lead_category || '');

    // Get the latest UTM parameters from the store
    const { utmParameters } = useFormStore.getState();

    // Prepare form data with consistent snake_case field names matching database schema
    const dbFormData = {
      session_id: sessionId,
      environment: import.meta.env.VITE_ENVIRONMENT?.trim(),
      
      // Page 1: Student Information - using snake_case
      form_filler_type: formData.formFillerType,
      student_name: formData.studentName,
      current_grade: formData.currentGrade,
      phone_number: formData.phoneNumber || null, // Use existing phone number, don't reconstruct
      
      // Page 1: Academic Information - using snake_case
      curriculum_type: formData.curriculumType,
      grade_format: formData.gradeFormat,
      gpa_value: formData.gpaValue,
      percentage_value: formData.percentageValue,
      school_name: formData.schoolName,
      
      // Page 1: Study Preferences - using snake_case
      scholarship_requirement: formData.scholarshipRequirement,
      target_geographies: formData.targetGeographies || [],
      
      // Page 2: Parent Contact Information - using snake_case
      parent_name: formData.parentName,
      parent_email: formData.email, // Frontend uses 'email', DB uses 'parent_email'
      
      // Page 2A: Counseling Information - using snake_case
      selected_date: formData.selectedDate,
      selected_slot: formData.selectedSlot,
      
      // System Fields - using snake_case
      lead_category: formData.lead_category,
      is_counselling_booked: isCounsellingBooked,
      funnel_stage: funnelStage,
      is_qualified_lead: isQualifiedLead,
      page_completed: pageNumber,
      // triggered_events: [],
      triggered_events: formData.triggeredEvents || [],
      
      // UTM Parameters (snake_case)
      utm_source: utmParameters.utm_source || null,
      utm_medium: utmParameters.utm_medium || null,
      utm_campaign: utmParameters.utm_campaign || null,
      utm_term: utmParameters.utm_term || null,
      utm_content: utmParameters.utm_content || null,
      utm_id: utmParameters.utm_id || null,
      
      created_at: new Date().toISOString()
    };

    // Use the simple upsert function
    const { data, error } = await supabase.rpc('upsert_form_session', {
      p_form_data: dbFormData,
      p_session_id: sessionId
    });

    if (error) {
      throw error;
    }

    debugLog(`✅ Form data saved: Page ${pageNumber} (${funnelStage}) for session ${sessionId}`);
    
  } catch (error) {
    errorLog('❌ Incremental form save error:', error);
    
    // Fallback: try direct insert/upsert if RPC fails
    try {
      debugLog('🔄 Attempting fallback direct upsert for session:', sessionId);
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('form_sessions')
        .upsert([dbFormData], { 
          onConflict: 'session_id',
          ignoreDuplicates: false 
        })
        .select();

      if (fallbackError) {
        errorLog('❌ Fallback upsert also failed:', fallbackError);
        throw fallbackError;
      }

      debugLog(`✅ Fallback success: Form data saved via direct upsert for session ${sessionId}`);
      
    } catch (fallbackError) {
      errorLog('❌ Both RPC and direct upsert failed:', fallbackError);
      // Don't throw - form should continue working even if tracking fails
    }
    // Don't throw - form should continue working even if tracking fails
  }
};

/**
 * Track form section completion with incremental saving
 */
export const trackFormSection = async (
  sessionId: string,
  sectionName: string,
  currentPage: number,
  fullFormData: any
): Promise<void> => {
  try {
    debugLog(`📝 Tracking form section: ${sectionName} for session ${sessionId}`);
    
    // Map section names to funnel stages - Updated with new naming
    // Only use our 10 defined funnel stages, prevent meta events from being stored
    const funnelStageMap: Record<string, FunnelStage> = {
      'student_info_complete': '02_page1_student_info_filled',
      'academic_info_complete': '03_page1_academic_info_filled', 
      'preferences_complete': '04_page1_scholarship_info_filled',
      'initial_lead_capture': '01_form_start',
      'form_interaction_started': '01_form_start',
      'contact_details_complete': '09_page_2_parent_details_filled',
      'contact_details_entered': '09_page_2_parent_details_filled', // Alias for consistency
      'counseling_slot_selected': '08_page_2_counselling_slot_selected',
      'final_submission': '10_form_submit',
      'form_started': '01_form_start'
      // Note: 'page_2_view' removed - this was a meta event, not a funnel stage
    };
    
    // Ensure we only use valid funnel stages, fallback to form start if unknown
    const funnelStage = funnelStageMap[sectionName] || '01_form_start';
    
    // Save the data incrementally
    await saveFormDataIncremental(
      sessionId,
      currentPage,
      funnelStage,
      fullFormData
    );
    
  } catch (error) {
    errorLog('Form section tracking error:', error);
    // Silent error - don't break form flow
  }
};

/**
 * Track form page completion
 */
export const trackPageCompletion = async (
  sessionId: string,
  pageNumber: number,
  pageType: string,
  formData: any
): Promise<void> => {
  try {
    debugLog(`📄 Tracking page completion: Page ${pageNumber} (${pageType}) for session ${sessionId}`);
    
    // Use the pageType parameter instead of hardcoded mapping
    // This allows the calling code to specify the correct funnel stage
    const funnelStage: FunnelStage = pageType as FunnelStage;
    
    // Save complete page data
    await saveFormDataIncremental(
      sessionId,
      pageNumber,
      funnelStage,
      formData
    );
    
  } catch (error) {
    errorLog('Page completion tracking error:', error);
  }
};

/**
 * Track final form submission
 */
export const trackFormSubmission = async (
  sessionId: string,
  formData: any,
  isComplete: boolean = true
): Promise<void> => {
  try {
    debugLog(`🎯 Tracking form submission for session ${sessionId}`);
    
    // Final funnel stage should always be form_submit for completed forms
    const finalStage: FunnelStage = '10_form_submit';
    
    // Mark as final submission
    await saveFormDataIncremental(
      sessionId,
      formData.currentStep || 2,
      finalStage,
      {
        ...formData,
        is_final_submission: isComplete
      }
    );
    
  } catch (error) {
    errorLog('Form submission tracking error:', error);
  }
};

/**
 * Get form data for a session (for recovery purposes)
 */
export const getSessionData = async (sessionId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('form_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    errorLog('Failed to get session data:', error);
    return null;
  }
};

/**
 * Track funnel abandonment
 */
export const trackFunnelAbandonment = async (
  sessionId: string,
  currentPage: number,
  timeSpent: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('form_sessions')
      .update({
        funnel_stage: 'abandoned',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) {
      throw error;
    }
    
    debugLog(`Funnel abandonment tracked for session ${sessionId} at page ${currentPage}`);
    
  } catch (error) {
    errorLog('Abandonment tracking error:', error);
  }
};

/**
 * Legacy function for backward compatibility
 */
export const trackStep = (
  sessionId: string,
  stepNumber: number,
  stepType: string,
  formData: any
): void => {
  // Convert legacy calls to new format - use proper funnel stages
  const funnelStage: FunnelStage = stepNumber === 1 ? '05_page1_complete' : '07_page_2_view';
  saveFormDataIncremental(sessionId, stepNumber, funnelStage, formData);
};