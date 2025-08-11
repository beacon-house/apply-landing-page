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

// Generate unique session ID for tracking
export const generateSessionId = (): string => {
  return crypto.randomUUID();
};

// Funnel stages
export type FunnelStage = 'form_start' | 'page1_in_progress' | 'page1_submitted' | 'lead_evaluated' | 'page2_view' | 'contact_details_entered' | 'counseling_booked' | 'form_complete' | 'abandoned';

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

    // Prepare form data with consistent snake_case field names matching database schema
    const dbFormData = {
      session_id: sessionId,
      environment: import.meta.env.VITE_ENVIRONMENT?.trim(),
      
      // Page 1: Student Information - using snake_case
      form_filler_type: formData.formFillerType,
      student_name: formData.studentName,
      current_grade: formData.currentGrade,
      phone_number: (formData.countryCode || '') + (formData.phoneNumber || ''),
      
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
      triggered_events: [],
      triggered_events: formData.triggeredEvents || [],
      
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
    
    // Map section names to funnel stages
    const funnelStageMap: Record<string, FunnelStage> = {
      'student_info_complete': 'page1_in_progress',
      'academic_info_complete': 'page1_in_progress', 
      'preferences_complete': 'page1_in_progress',
      'initial_lead_capture': 'page1_in_progress',
      'form_interaction_started': 'page1_in_progress',
      'contact_details_complete': 'contact_details_entered',
      'counseling_slot_selected': 'counseling_booked',
      'page_2_view': 'page2_view',
      'final_submission': 'form_complete',
      'form_started': 'form_start'
    };
    
    const funnelStage = funnelStageMap[sectionName] || 'page1_complete';
    
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
    
    const funnelStage: FunnelStage = pageNumber === 1 ? 'page1_submitted' : 'page2_view';
    
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
    
    // Determine final funnel stage
    const hasSelectedCounseling = Boolean(formData.selectedDate && formData.selectedSlot);
    const finalStage: FunnelStage = hasSelectedCounseling ? 'counseling_booked' : 'form_complete';
    
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
  // Convert legacy calls to new format
  const funnelStage: FunnelStage = stepNumber === 1 ? 'page1_complete' : 'page2_view';
  saveFormDataIncremental(sessionId, stepNumber, funnelStage, formData);
};