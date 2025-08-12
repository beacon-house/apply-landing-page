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
import { CompleteFormData } from '@/types/form';
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
  setStep: (step: number) => void;
  updateFormData: (data: Partial<CompleteFormData>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitted: (isSubmitted: boolean) => void;
  addTriggeredEvents: (events: string[]) => void;
  clearTriggeredEvents: () => void;
  resetForm: () => void;
  canProceed: (step: number) => boolean;
  getLatestFormData: () => { formData: Partial<CompleteFormData>; triggeredEvents: string[] };
}

export const useFormStore = create<FormState>((set, get) => ({
  currentStep: 1,
  formData: {},
  isSubmitting: false,
  isSubmitted: false,
  startTime: Date.now(),
  sessionId: generateSessionId(),
  triggeredEvents: [],
  
  setStep: (step) => {
    set({ currentStep: step });
    // Scroll to top of the form when changing steps
    window.scrollTo(0, 0);
  },
  
  getLatestFormData: () => ({
    formData: get().formData,
    triggeredEvents: get().triggeredEvents
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
  
  resetForm: () => set({
    currentStep: 1,
    formData: {},
    isSubmitting: false,
    isSubmitted: false,
    startTime: Date.now(),
    sessionId: generateSessionId(),
    triggeredEvents: []
  }),
  
  canProceed: (step) => {
    try {
      return validateFormStep(step, get().formData);
    } catch {
      return false;
    }
  }
}));