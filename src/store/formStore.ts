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
import { CompleteFormData, UtmParameters } from '@/types/form';
import { validateFormStep } from '@/lib/form';
import { generateSessionId } from '@/lib/formTracking';
import { debugLog } from '@/lib/logger';

interface FormState {
  currentStep: number;
  formData: Partial<CompleteFormData>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  startTime: number;
  sessionId: string;
  triggeredEvents: string[];
  utmParameters: UtmParameters;
  eventCounter: number;
  setStep: (step: number) => void;
  updateFormData: (data: Partial<CompleteFormData>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitted: (isSubmitted: boolean) => void;
  addTriggeredEvents: (events: string[]) => void;
  clearTriggeredEvents: () => void;
  setUtmParameters: (utm: UtmParameters) => void;
  resetForm: () => void;
  canProceed: (step: number) => boolean;
  getLatestFormData: () => { formData: Partial<CompleteFormData>; triggeredEvents: string[]; utmParameters: UtmParameters };
  incrementEventCounter: () => number;
}

export const useFormStore = create<FormState>((set, get) => ({
  currentStep: 1,
  formData: {},
  isSubmitting: false,
  isSubmitted: false,
  startTime: Date.now(),
  sessionId: generateSessionId(),
  triggeredEvents: [],
  utmParameters: {},
  eventCounter: 0,
  
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
  
  resetForm: () => set({
    currentStep: 1,
    formData: {},
    isSubmitting: false,
    isSubmitted: false,
    startTime: Date.now(),
    sessionId: generateSessionId(),
    triggeredEvents: [],
    utmParameters: {},
    eventCounter: 0
  }),
  
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
}));