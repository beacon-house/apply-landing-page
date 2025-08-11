/**
 * Meta Pixel Events Implementation
 * 
 * Purpose: Comprehensive Meta Pixel event tracking system based on events.md specification.
 * Handles 35 different events across lead classification, funnel progression, and category-specific tracking.
 * 
 * Features:
 * - Environment-specific event naming (prod/stg suffix)
 * - Console logging for staging environment
 * - Spam detection logic
 * - Lead qualification simulation for students
 * - Event storage and deduplication
 */

import { LeadCategory, CompleteFormData } from '@/types/form';
import { determineLeadCategory } from '@/lib/leadCategorization';
import { debugLog, errorLog } from '@/lib/logger';

// Environment suffix for event names
const getEnvironmentSuffix = (): string => {
  const env = import.meta.env.VITE_ENVIRONMENT?.trim();
  return env === 'prod' ? 'prod' : 'stg';
};

// Meta Pixel ID from environment
const getMetaPixelId = (): string | null => {
  return import.meta.env.VITE_META_PIXEL_ID?.trim() || null;
};

// Initialize Meta Pixel
export const initializeMetaPixel = (): void => {
  const pixelId = getMetaPixelId();
  if (!pixelId) {
    debugLog('Meta Pixel ID not configured, skipping initialization');
    return;
  }

  try {
    // Initialize Facebook Pixel if not already done
    if (typeof window !== 'undefined' && !window.fbq) {
      // Load Facebook Pixel script
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }

    debugLog('Meta Pixel initialized with ID:', pixelId);
  } catch (error) {
    errorLog('Failed to initialize Meta Pixel:', error);
  }
};

// Check if spam based on GPA/percentage values
const isSpamDetected = (gpaValue?: string, percentageValue?: string): boolean => {
  return gpaValue === "10" || percentageValue === "100";
};

// Simulate student qualification as if parent filled the form
const simulateStudentQualification = (formData: Partial<CompleteFormData>): LeadCategory => {
  return determineLeadCategory(
    formData.currentGrade || '',
    'parent', // Simulate as parent
    formData.scholarshipRequirement || '',
    formData.curriculumType || '',
    undefined,
    formData.gpaValue,
    formData.percentageValue,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    formData.targetGeographies
  );
};

// Generic event tracking function
const trackMetaPixelEvent = (eventName: string, parameters?: Record<string, any>): void => {
  const envSuffix = getEnvironmentSuffix();
  const fullEventName = `${eventName}_${envSuffix}`;
  
  try {
    // Console logging for staging environment
    if (envSuffix === 'stg') {
      debugLog('🎯 Meta Pixel Event Fired:', {
        eventName: fullEventName,
        parameters: parameters || {},
        timestamp: new Date().toISOString()
      });
    }

    // Fire the actual Meta Pixel event
    if (typeof window !== 'undefined' && window.fbq) {
      if (parameters) {
        window.fbq('trackCustom', fullEventName, parameters);
      } else {
        window.fbq('trackCustom', fullEventName);
      }
    } else {
      debugLog('Meta Pixel not available, event would have been:', fullEventName);
    }
  } catch (error) {
    errorLog('Error firing Meta Pixel event:', error);
  }
};

// PRIMARY LEAD CLASSIFICATION EVENTS (8 events)
export const fireLeadClassificationEvents = (formData: Partial<CompleteFormData>): string[] => {
  const firedEvents: string[] = [];
  const isSpam = isSpamDetected(formData.gpaValue, formData.percentageValue);
  const isParent = formData.formFillerType === 'parent';
  const isStudent = formData.formFillerType === 'student';
  const leadCategory = formData.lead_category;
  const isQualified = ['bch', 'lum-l1', 'lum-l2'].includes(leadCategory || '');

  if (isParent) {
    // Parent events
    trackMetaPixelEvent('adm_prnt_event', formData);
    firedEvents.push('adm_prnt_event');

    if (isSpam) {
      trackMetaPixelEvent('adm_spam_prnt', formData);
      firedEvents.push('adm_spam_prnt');
    } else if (isQualified) {
      trackMetaPixelEvent('adm_qualfd_prnt', formData);
      firedEvents.push('adm_qualfd_prnt');
    } else {
      trackMetaPixelEvent('adm_disqualfd_prnt', formData);
      firedEvents.push('adm_disqualfd_prnt');
    }
  } else if (isStudent) {
    // Student events
    trackMetaPixelEvent('adm_stdnt', formData);
    firedEvents.push('adm_stdnt');

    if (isSpam) {
      trackMetaPixelEvent('adm_spam_stdnt', formData);
      firedEvents.push('adm_spam_stdnt');
    } else {
      // Simulate student qualification as parent
      const simulatedCategory = simulateStudentQualification(formData);
      const wouldBeQualified = ['bch', 'lum-l1', 'lum-l2'].includes(simulatedCategory);
      
      if (wouldBeQualified) {
        trackMetaPixelEvent('adm_qualfd_stdnt', formData);
        firedEvents.push('adm_qualfd_stdnt');
      } else {
        trackMetaPixelEvent('adm_disqualfd_stdnt', formData);
        firedEvents.push('adm_disqualfd_stdnt');
      }
    }
  }

  return firedEvents;
};

// GENERAL FUNNEL EVENTS (7 events)
export const firePageViewEvent = (): string[] => {
  trackMetaPixelEvent('adm_page_view');
  return ['adm_page_view'];
};

export const fireHeroCTAEvent = (): string[] => {
  trackMetaPixelEvent('adm_cta_hero');
  return ['adm_cta_hero'];
};

export const fireHeaderCTAEvent = (): string[] => {
  trackMetaPixelEvent('adm_cta_header');
  return ['adm_cta_header'];
};

export const firePage1ContinueEvent = (formData: Partial<CompleteFormData>): string[] => {
  trackMetaPixelEvent('adm_page_1_continue', formData);
  return ['adm_page_1_continue'];
};

export const firePage2ViewEvent = (formData: Partial<CompleteFormData>): string[] => {
  trackMetaPixelEvent('adm_page_2_view', formData);
  return ['adm_page_2_view'];
};

export const firePage2SubmitEvent = (formData: Partial<CompleteFormData>): string[] => {
  trackMetaPixelEvent('adm_page_2_submit', formData);
  return ['adm_page_2_submit'];
};

export const fireFormCompleteEvent = (formData: Partial<CompleteFormData>): string[] => {
  trackMetaPixelEvent('adm_form_complete', formData);
  return ['adm_form_complete'];
};

// CATEGORY-SPECIFIC EVENTS (12 events total - 4 each for BCH, LUM-L1, LUM-L2)
export const fireCategorySpecificEvents = (
  eventType: 'page_1_continue' | 'page_2_view' | 'page_2_submit' | 'form_complete',
  leadCategory: string,
  formData: Partial<CompleteFormData>
): string[] => {
  const firedEvents: string[] = [];
  
  if (['bch', 'lum-l1', 'lum-l2'].includes(leadCategory)) {
    const categoryPrefix = leadCategory.replace('-', '_'); // lum-l1 becomes lum_l1
    const eventName = `adm_${categoryPrefix}_${eventType}`;
    
    trackMetaPixelEvent(eventName, formData);
    firedEvents.push(eventName);
  }
  
  return firedEvents;
};

// QUALIFIED LEAD SPECIFIC EVENTS (8 events total - 4 each for parent/student)
export const fireQualifiedLeadEvents = (
  eventType: 'page_1_continue' | 'page_2_view' | 'page_2_submit' | 'form_complete',
  formData: Partial<CompleteFormData>
): string[] => {
  const firedEvents: string[] = [];
  const isQualified = ['bch', 'lum-l1', 'lum-l2'].includes(formData.lead_category || '');
  const isParent = formData.formFillerType === 'parent';
  const isStudent = formData.formFillerType === 'student';
  
  if (isParent && isQualified) {
    const eventName = `adm_qualfd_prnt_${eventType}`;
    trackMetaPixelEvent(eventName, formData);
    firedEvents.push(eventName);
  } else if (isStudent) {
    // Check if student would qualify as parent
    const simulatedCategory = simulateStudentQualification(formData);
    const wouldBeQualified = ['bch', 'lum-l1', 'lum-l2'].includes(simulatedCategory);
    
    if (wouldBeQualified) {
      const eventName = `adm_qualfd_stdnt_${eventType}`;
      trackMetaPixelEvent(eventName, formData);
      firedEvents.push(eventName);
    }
  }
  
  return firedEvents;
};

// COMPREHENSIVE EVENT FIRING FOR FORM PROGRESSION
export const fireFormProgressionEvents = (
  stage: 'page_1_complete' | 'page_2_view' | 'page_2_submit' | 'form_complete',
  formData: Partial<CompleteFormData>
): string[] => {
  let allFiredEvents: string[] = [];
  
  switch (stage) {
    case 'page_1_complete':
      // Fire primary classification events first
      allFiredEvents = allFiredEvents.concat(fireLeadClassificationEvents(formData));
      
      // Fire general funnel event
      allFiredEvents = allFiredEvents.concat(firePage1ContinueEvent(formData));
      
      // Fire category-specific events
      if (formData.lead_category) {
        allFiredEvents = allFiredEvents.concat(
          fireCategorySpecificEvents('page_1_continue', formData.lead_category, formData)
        );
      }
      
      // Fire qualified lead events
      allFiredEvents = allFiredEvents.concat(
        fireQualifiedLeadEvents('page_1_continue', formData)
      );
      break;
      
    case 'page_2_view':
      // Fire general funnel event
      allFiredEvents = allFiredEvents.concat(firePage2ViewEvent(formData));
      
      // Fire category-specific events
      if (formData.lead_category) {
        allFiredEvents = allFiredEvents.concat(
          fireCategorySpecificEvents('page_2_view', formData.lead_category, formData)
        );
      }
      
      // Fire qualified lead events
      allFiredEvents = allFiredEvents.concat(
        fireQualifiedLeadEvents('page_2_view', formData)
      );
      break;
      
    case 'page_2_submit':
      // Fire general funnel event
      allFiredEvents = allFiredEvents.concat(firePage2SubmitEvent(formData));
      
      // Fire category-specific events
      if (formData.lead_category) {
        allFiredEvents = allFiredEvents.concat(
          fireCategorySpecificEvents('page_2_submit', formData.lead_category, formData)
        );
      }
      
      // Fire qualified lead events
      allFiredEvents = allFiredEvents.concat(
        fireQualifiedLeadEvents('page_2_submit', formData)
      );
      break;
      
    case 'form_complete':
      // Fire general funnel event
      allFiredEvents = allFiredEvents.concat(fireFormCompleteEvent(formData));
      
      // Fire category-specific events
      if (formData.lead_category) {
        allFiredEvents = allFiredEvents.concat(
          fireCategorySpecificEvents('form_complete', formData.lead_category, formData)
        );
      }
      
      // Fire qualified lead events
      allFiredEvents = allFiredEvents.concat(
        fireQualifiedLeadEvents('form_complete', formData)
      );
      break;
  }
  
  return allFiredEvents;
};

// CTA CLICK EVENTS
export const fireCTAClickEvent = (ctaLocation: 'hero' | 'header'): string[] => {
  if (ctaLocation === 'hero') {
    return fireHeroCTAEvent();
  } else {
    return fireHeaderCTAEvent();
  }
};

// Declare global fbq function
declare global {
  interface Window {
    fbq: (command: string, eventName: string, parameters?: any) => void;
    _fbq: any;
  }
}