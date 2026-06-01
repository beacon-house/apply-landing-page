/**
 * GA4 Events Implementation
 *
 * Purpose: Mirrors the Meta Pixel event architecture into Google Analytics 4 so that
 * Google Ads can import these events as conversions (cross-platform learning parity).
 *
 * This is a PARALLEL layer to metaPixelEvents.ts. It must never import from or modify
 * the frozen Meta Pixel / CAPI code. Event names are identical to the Meta event names
 * (same `_prod` / `_stg` environment suffix). Each event carries a `source` parameter
 * for safe filtering/debugging in GA4.
 *
 * GA4 events do NOT send hashed user PII (GA4 conversions use a different model than
 * Meta's user_data). Only event name + lightweight categorical params are sent.
 */

import { LeadCategory, CompleteFormData } from '@/types/form';
import { determineLeadCategory } from '@/lib/leadCategorization';
import { debugLog } from '@/lib/logger';

const EVENT_SOURCE = 'apply_lp';

// Environment suffix for event names (independent of Meta code, same convention)
const getEnvironmentSuffix = (): string => {
  const env = import.meta.env.VITE_ENVIRONMENT?.trim();
  return env === 'prod' ? 'prod' : 'stg';
};

// Spam detection — replicated locally so GA4 never depends on Meta code
const isSpamDetected = (gpaValue?: string, percentageValue?: string): boolean => {
  return gpaValue === '10' || percentageValue === '100';
};

// Simulate student qualification as if a parent filled the form
const simulateStudentQualification = (formData: Partial<CompleteFormData>): LeadCategory => {
  return determineLeadCategory(
    formData.currentGrade || '',
    'parent',
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

/**
 * Generic GA4 event tracking. Safe no-op when gtag is unavailable.
 * Appends the environment suffix and a source param to every event.
 */
const trackGA4Event = (
  eventName: string,
  params?: Record<string, string | number | boolean>
): void => {
  const envSuffix = getEnvironmentSuffix();
  const fullEventName = `${eventName}_${envSuffix}`;

  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', fullEventName, {
        source: EVENT_SOURCE,
        ...(params || {}),
      });

      if (envSuffix === 'stg') {
        debugLog('📊 GA4 Event Fired:', {
          eventName: fullEventName,
          params: { source: EVENT_SOURCE, ...(params || {}) },
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      debugLog('GA4 gtag not available, event would have been:', fullEventName);
    }
  } catch (error) {
    debugLog('Error firing GA4 event:', error);
  }
};

// Build lightweight, non-PII params for a GA4 event from form data
const buildGA4Params = (
  formData: Partial<CompleteFormData>
): Record<string, string> => {
  const params: Record<string, string> = {};
  if (formData.lead_category) {
    params.lead_category = formData.lead_category;
  }
  if (formData.formFillerType) {
    params.form_filler_type = formData.formFillerType;
  }
  return params;
};

// PRIMARY LEAD CLASSIFICATION EVENTS
export const fireGA4LeadClassificationEvents = (
  formData: Partial<CompleteFormData>
): string[] => {
  const firedEvents: string[] = [];
  const params = buildGA4Params(formData);
  const isSpam = isSpamDetected(formData.gpaValue, formData.percentageValue);
  const isParent = formData.formFillerType === 'parent';
  const isStudent = formData.formFillerType === 'student';
  const leadCategory = formData.lead_category;
  const isQualified = ['bch', 'lum-l1', 'lum-l2'].includes(leadCategory || '');

  if (isParent) {
    trackGA4Event('apply_prnt_event', params);
    firedEvents.push('apply_prnt_event');

    if (isSpam) {
      trackGA4Event('apply_spam_prnt', params);
      firedEvents.push('apply_spam_prnt');
    } else if (isQualified) {
      trackGA4Event('apply_qualfd_prnt', params);
      firedEvents.push('apply_qualfd_prnt');
    } else {
      trackGA4Event('apply_disqualfd_prnt', params);
      firedEvents.push('apply_disqualfd_prnt');
    }

    const isNonSpamParent = !isSpam;
    if (isNonSpamParent) {
      trackGA4Event('apply_nonspam_prnt', params);
      firedEvents.push('apply_nonspam_prnt');
    }

    const isTamParent =
      isNonSpamParent &&
      ['7_below', '8', '9', '10', '11', '12'].includes(formData.currentGrade || '') &&
      formData.curriculumType !== 'State_Boards';
    if (isTamParent) {
      trackGA4Event('apply_tam_prnt', params);
      firedEvents.push('apply_tam_prnt');
    }
  } else if (isStudent) {
    trackGA4Event('apply_stdnt', params);
    firedEvents.push('apply_stdnt');

    if (isSpam) {
      trackGA4Event('apply_spam_stdnt', params);
      firedEvents.push('apply_spam_stdnt');
    } else {
      const simulatedCategory = simulateStudentQualification(formData);
      const wouldBeQualified = ['bch', 'lum-l1', 'lum-l2'].includes(simulatedCategory);

      if (wouldBeQualified) {
        trackGA4Event('apply_qualfd_stdnt', params);
        firedEvents.push('apply_qualfd_stdnt');
      } else {
        trackGA4Event('apply_disqualfd_stdnt', params);
        firedEvents.push('apply_disqualfd_stdnt');
      }
    }
  }

  return firedEvents;
};

// TAM PARENT LEVEL 2 — non-spam TAM parent enters email on Page 2A
export const fireGA4TamParentLevel2Event = (
  formData: Partial<CompleteFormData>
): string[] => {
  const firedEvents: string[] = [];
  const isSpam = isSpamDetected(formData.gpaValue, formData.percentageValue);
  const isParent = formData.formFillerType === 'parent';

  if (
    isParent &&
    !isSpam &&
    ['7_below', '8', '9', '10', '11', '12'].includes(formData.currentGrade || '') &&
    formData.curriculumType !== 'State_Boards' &&
    formData.email
  ) {
    trackGA4Event('apply_tam_prnt_level2', buildGA4Params(formData));
    firedEvents.push('apply_tam_prnt_level2');
  }

  return firedEvents;
};

// GENERAL FUNNEL EVENTS
export const fireGA4PageViewEvent = (): string[] => {
  trackGA4Event('apply_page_view');
  return ['apply_page_view'];
};

export const fireGA4HeroCTAEvent = (): string[] => {
  trackGA4Event('apply_cta_hero');
  return ['apply_cta_hero'];
};

export const fireGA4HeaderCTAEvent = (): string[] => {
  trackGA4Event('apply_cta_header');
  return ['apply_cta_header'];
};

export const fireGA4CTAClickEvent = (ctaLocation: 'hero' | 'header'): string[] => {
  return ctaLocation === 'hero' ? fireGA4HeroCTAEvent() : fireGA4HeaderCTAEvent();
};

// CATEGORY-SPECIFIC EVENTS (bch, lum_l1, lum_l2)
const fireGA4CategorySpecificEvents = (
  eventType: 'page_1_continue' | 'page_2_view' | 'page_2_submit' | 'form_complete',
  leadCategory: string,
  formData: Partial<CompleteFormData>
): string[] => {
  const firedEvents: string[] = [];

  if (['bch', 'lum-l1', 'lum-l2'].includes(leadCategory)) {
    const categoryPrefix = leadCategory.replace('-', '_'); // lum-l1 → lum_l1
    const eventName = `apply_${categoryPrefix}_${eventType}`;
    trackGA4Event(eventName, buildGA4Params(formData));
    firedEvents.push(eventName);
  }

  return firedEvents;
};

// QUALIFIED LEAD SPECIFIC EVENTS (parent/student)
const fireGA4QualifiedLeadEvents = (
  eventType: 'page_1_continue' | 'page_2_view' | 'page_2_submit' | 'form_complete',
  formData: Partial<CompleteFormData>
): string[] => {
  const firedEvents: string[] = [];
  const params = buildGA4Params(formData);
  const isQualified = ['bch', 'lum-l1', 'lum-l2'].includes(formData.lead_category || '');
  const isParent = formData.formFillerType === 'parent';
  const isStudent = formData.formFillerType === 'student';

  if (isParent && isQualified) {
    const eventName = `apply_qualfd_prnt_${eventType}`;
    trackGA4Event(eventName, params);
    firedEvents.push(eventName);
  } else if (isStudent) {
    const simulatedCategory = simulateStudentQualification(formData);
    const wouldBeQualified = ['bch', 'lum-l1', 'lum-l2'].includes(simulatedCategory);

    if (wouldBeQualified) {
      const eventName = `apply_qualfd_stdnt_${eventType}`;
      trackGA4Event(eventName, params);
      firedEvents.push(eventName);
    }
  }

  return firedEvents;
};

// COMPREHENSIVE FORM PROGRESSION (mirrors fireFormProgressionEvents)
export const fireGA4FormProgressionEvents = (
  stage: 'page_1_complete' | 'page_2_view' | 'page_2_submit' | 'form_complete',
  formData: Partial<CompleteFormData>
): string[] => {
  let allFiredEvents: string[] = [];

  switch (stage) {
    case 'page_1_complete':
      allFiredEvents = allFiredEvents.concat(fireGA4LeadClassificationEvents(formData));
      trackGA4Event('apply_page_1_continue', buildGA4Params(formData));
      allFiredEvents.push('apply_page_1_continue');
      if (formData.lead_category) {
        allFiredEvents = allFiredEvents.concat(
          fireGA4CategorySpecificEvents('page_1_continue', formData.lead_category, formData)
        );
      }
      allFiredEvents = allFiredEvents.concat(
        fireGA4QualifiedLeadEvents('page_1_continue', formData)
      );
      break;

    case 'page_2_view':
      trackGA4Event('apply_page_2_view', buildGA4Params(formData));
      allFiredEvents.push('apply_page_2_view');
      if (formData.lead_category) {
        allFiredEvents = allFiredEvents.concat(
          fireGA4CategorySpecificEvents('page_2_view', formData.lead_category, formData)
        );
      }
      allFiredEvents = allFiredEvents.concat(
        fireGA4QualifiedLeadEvents('page_2_view', formData)
      );
      break;

    case 'page_2_submit':
      trackGA4Event('apply_page_2_submit', buildGA4Params(formData));
      allFiredEvents.push('apply_page_2_submit');
      if (formData.lead_category) {
        allFiredEvents = allFiredEvents.concat(
          fireGA4CategorySpecificEvents('page_2_submit', formData.lead_category, formData)
        );
      }
      allFiredEvents = allFiredEvents.concat(
        fireGA4QualifiedLeadEvents('page_2_submit', formData)
      );
      break;

    case 'form_complete':
      trackGA4Event('apply_form_complete', buildGA4Params(formData));
      allFiredEvents.push('apply_form_complete');
      if (formData.lead_category) {
        allFiredEvents = allFiredEvents.concat(
          fireGA4CategorySpecificEvents('form_complete', formData.lead_category, formData)
        );
      }
      allFiredEvents = allFiredEvents.concat(
        fireGA4QualifiedLeadEvents('form_complete', formData)
      );
      break;
  }

  return allFiredEvents;
};

// ENRICHMENT EVENTS
export const fireGA4PhoneCapturedEvent = (): string[] => {
  trackGA4Event('apply_phone_captured');
  return ['apply_phone_captured'];
};

export const fireGA4EmailCapturedEvent = (): string[] => {
  trackGA4Event('apply_email_captured');
  return ['apply_email_captured'];
};
