/**
 * Form Store v8.1
 * 
 * Purpose: Zustand store for managing 2-page form state with Meta Pixel event tracking.
 * Handles form data, step navigation, and submission status.
 * 
 * Changes made:
 * - Re-added triggeredEvents for Meta Pixel event tracking
 * - Added event management functions
 */

import { create } from 'zustand';
import { CompleteFormData, UtmParameters, BookingFailureContext } from '@/types/form';
import { validateFormStep } from '@/lib/form';
import { generateSessionId, getSessionData } from '@/lib/formTracking';
import { debugLog, errorLog } from '@/lib/logger';

const SESSION_STORAGE_KEY = 'bch_form_session_id';

/** Save sessionId to localStorage so it survives page refresh */
function persistSessionId(sessionId: string): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    // localStorage unavailable (private browsing, etc.) — non-critical
  }
}

/** Retrieve persisted sessionId from localStorage */
function getPersistedSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Clear persisted sessionId */
function clearPersistedSessionId(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Hydrate the store from Supabase if a previous session exists.
 * Returns hydrated state or null if no recoverable session.
 */
async function recoverSession(sessionId: string): Promise<Partial<FormState> | null> {
  try {
    const data = await getSessionData(sessionId);
    if (!data) return null;

    // Don't recover completed or submitted sessions
    if (data.funnel_stage === '10_form_submit' || data.is_final_submission) {
      debugLog('Session already submitted, skipping recovery:', sessionId);
      clearPersistedSessionId();
      return null;
    }

    // Don't recover sessions older than 24 hours
    const createdAt = new Date(data.created_at).getTime();
    const ageMs = Date.now() - createdAt;
    if (ageMs > 24 * 60 * 60 * 1000) {
      debugLog('Session too old, skipping recovery:', sessionId);
      clearPersistedSessionId();
      return null;
    }

    debugLog('Recovering session from Supabase:', sessionId, 'stage:', data.funnel_stage);

    // Map snake_case DB columns back to camelCase form fields
    const formData: Partial<CompleteFormData> = {};
    if (data.form_filler_type) formData.formFillerType = data.form_filler_type;
    if (data.student_name) formData.studentName = data.student_name;
    if (data.current_grade) formData.currentGrade = data.current_grade;
    if (data.location) formData.location = data.location;
    if (data.phone_number) formData.phoneNumber = data.phone_number;
    if (data.country_code) formData.countryCode = data.country_code;
    if (data.curriculum_type) formData.curriculumType = data.curriculum_type;
    if (data.grade_format) formData.gradeFormat = data.grade_format;
    if (data.gpa_value) formData.gpaValue = data.gpa_value;
    if (data.percentage_value) formData.percentageValue = data.percentage_value;
    if (data.school_name) formData.schoolName = data.school_name;
    if (data.scholarship_requirement) formData.scholarshipRequirement = data.scholarship_requirement;
    if (data.target_geographies) formData.targetGeographies = data.target_geographies;
    if (data.parent_name) formData.parentName = data.parent_name;
    if (data.parent_email) formData.email = data.parent_email;
    if (data.selected_date) formData.selectedDate = data.selected_date;
    if (data.selected_slot) formData.selectedSlot = data.selected_slot;
    if (data.lead_category) formData.lead_category = data.lead_category;

    // Determine step from page_completed
    const currentStep = data.page_completed >= 2 ? 2 : 1;

    // Recover UTM params
    const utmParameters: UtmParameters = {};
    if (data.utm_source) utmParameters.utm_source = data.utm_source;
    if (data.utm_medium) utmParameters.utm_medium = data.utm_medium;
    if (data.utm_campaign) utmParameters.utm_campaign = data.utm_campaign;
    if (data.utm_term) utmParameters.utm_term = data.utm_term;
    if (data.utm_content) utmParameters.utm_content = data.utm_content;
    if (data.utm_id) utmParameters.utm_id = data.utm_id;

    return {
      formData,
      currentStep,
      sessionId,
      utmParameters,
      startTime: createdAt,
    };
  } catch (error) {
    errorLog('Session recovery failed:', error);
    return null;
  }
}


interface FormState {
  currentStep: number;
  formData: Partial<CompleteFormData>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  isHydrated: boolean;
  startTime: number;
  sessionId: string;
  triggeredEvents: string[];
  utmParameters: UtmParameters;
  eventCounter: number;
  bookingFailureContext: BookingFailureContext;
  zohoLeadId: string | null;
  setStep: (step: number) => void;
  updateFormData: (data: Partial<CompleteFormData>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitted: (isSubmitted: boolean) => void;
  addTriggeredEvents: (events: string[]) => void;
  clearTriggeredEvents: () => void;
  setUtmParameters: (utm: UtmParameters) => void;
  setBookingFailureContext: (ctx: BookingFailureContext) => void;
  setZohoLeadId: (id: string | null) => void;
  hydrateFromSupabase: () => Promise<void>;
  resetForm: () => void;
  canProceed: (step: number) => boolean;
  getLatestFormData: () => { formData: Partial<CompleteFormData>; triggeredEvents: string[]; utmParameters: UtmParameters };
  incrementEventCounter: () => number;
}

export const useFormStore = create<FormState>((set, get) => {
  // Check for persisted session on initialization
  const persistedId = getPersistedSessionId();
  const initialSessionId = persistedId || generateSessionId();
  if (!persistedId) persistSessionId(initialSessionId);

  return {
  currentStep: 1,
  formData: {},
  isSubmitting: false,
  isSubmitted: false,
  isHydrated: false,
  startTime: Date.now(),
  sessionId: initialSessionId,
  triggeredEvents: [],
  utmParameters: {},
  eventCounter: 0,
  bookingFailureContext: { failureType: null, failureReason: null, lastAttemptedDate: null, lastAttemptedSlot: null },
  zohoLeadId: null,
  
  setStep: (step) => {
    set({ currentStep: step });
    // Scroll to top of the form when changing steps
    window.scrollTo(0, 0);
  },
  
  getLatestFormData: () => ({
    formData: get().formData,
    triggeredEvents: get().triggeredEvents,
    utmParameters: get().utmParameters
  }),
  
  updateFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  
  setSubmitted: (isSubmitted) => set({ isSubmitted }),
  
  addTriggeredEvents: (events) => set((state) => ({
    triggeredEvents: [...state.triggeredEvents, ...events]
  })),
  
  clearTriggeredEvents: () => set({ triggeredEvents: [] }),
  
  setUtmParameters: (utm) => set((state) => ({
    utmParameters: { ...state.utmParameters, ...utm }
  })),
  
  setBookingFailureContext: (ctx) => set({ bookingFailureContext: ctx }),
  setZohoLeadId: (id) => {
    set({ zohoLeadId: id });
    if (id) persistSessionId(get().sessionId);
  },
  
  hydrateFromSupabase: async () => {
    if (get().isHydrated) return; // Only hydrate once
    const sessionId = get().sessionId;
    const recovered = await recoverSession(sessionId);
    if (recovered) {
      set({
        ...recovered,
        isHydrated: true,
      });
      debugLog('Store hydrated from Supabase:', { sessionId, step: recovered.currentStep });
    } else {
      set({ isHydrated: true });
    }
  },
  
  resetForm: () => {
    clearPersistedSessionId();
    const newSessionId = generateSessionId();
    persistSessionId(newSessionId);
    set({
      currentStep: 1,
      formData: {},
      isSubmitting: false,
      isSubmitted: false,
      isHydrated: true,
      startTime: Date.now(),
      sessionId: newSessionId,
      triggeredEvents: [],
      utmParameters: {},
      eventCounter: 0,
      bookingFailureContext: { failureType: null, failureReason: null, lastAttemptedDate: null, lastAttemptedSlot: null },
      zohoLeadId: null
    });
  },
  
  incrementEventCounter: () => {
    const current = get().eventCounter;
    set({ eventCounter: current + 1 });
    return current + 1;
  },
  
  canProceed: (step) => {
    try {
      return validateFormStep(step, get().formData);
    } catch {
      return false;
    }
  }
};
});