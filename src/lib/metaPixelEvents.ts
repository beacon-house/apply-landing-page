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
 * - Meta CAPI integration for server-side event tracking
 */

import { LeadCategory, CompleteFormData } from '@/types/form';
import { determineLeadCategory } from '@/lib/leadCategorization';
import { debugLog, errorLog } from '@/lib/logger';
import { generateEventId, sendCAPIEvent, formatPhoneE164, formatName, MetaUserData } from '@/lib/metaCAPI';
import { cookiePolling } from '@/lib/cookiePolling';
import { getClientIpAddress, getClientUserAgent } from '@/lib/clientInfo';
import { useFormStore } from '@/store/formStore';

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

    // Start cookie polling to wait for Meta cookies
    cookiePolling.startPolling(() => {
      processQueuedEvents();
    });

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

/**
 * Get Meta cookies (_fbp, _fbc)
 */
function getCookie(name: string): string | undefined {
  return cookiePolling.getCookie(name);
}

/**
 * Get automatic Meta parameters (cookies, IP, user agent)
 */
function getAutomaticMetaParams(): Partial<MetaUserData> {
  if (typeof window === 'undefined') {
    return {};
  }

  const params: Partial<MetaUserData> = {};

  const fbp = getCookie('_fbp');
  if (fbp) {
    params.fbp = fbp;
  }

  const fbc = getCookie('_fbc');
  if (fbc) {
    params.fbc = fbc;
  }

  const userAgent = getClientUserAgent();
  if (userAgent) {
    params.client_user_agent = userAgent;
  }

  const clientIp = getClientIpAddress();
  if (clientIp) {
    params.client_ip_address = clientIp;
  }

  return params;
}

/**
 * Build Meta user data from form state
 */
function buildMetaUserData(formData: Partial<CompleteFormData>): MetaUserData {
  const automaticParams = getAutomaticMetaParams();
  const userData: MetaUserData = { ...automaticParams };

  const formState = useFormStore.getState();
  if (formState.sessionId) {
    userData.external_id = formState.sessionId;
  }

  if (formData.countryCode && formData.phoneNumber) {
    userData.ph = formatPhoneE164(formData.countryCode, formData.phoneNumber);
  }

  if (formData.location) {
    userData.ct = formData.location.toLowerCase().trim().replace(/\s+/g, '');
  }

  if (formData.email) {
    userData.em = formData.email.toLowerCase().trim();
  }

  if (formData.parentName) {
    const { fn, ln } = formatName(formData.parentName);
    userData.fn = fn;
    if (ln) {
      userData.ln = ln;
    }
  }

  return userData;
}

/**
 * Process queued events when cookies become ready
 */
function processQueuedEvents(): void {
  const queuedEvents = cookiePolling.getQueuedEvents();
  if (queuedEvents.length === 0) {
    return;
  }

  const formState = useFormStore.getState();
  const formData = formState.formData;

  queuedEvents.forEach(queuedEvent => {
    // Merge queued userData with fresh automatic params (cookies, IP might be available now)
    const freshAutomaticParams = getAutomaticMetaParams();
    const queuedUserData = queuedEvent.userData || {};
    const userData: MetaUserData = {
      ...freshAutomaticParams, // Fresh cookies, IP, user agent
      ...queuedUserData, // Preserve form data (ph, em, fn, ln, ct, external_id)
    };
    
    // Ensure external_id is set
    if (!userData.external_id && formState.sessionId) {
      userData.external_id = formState.sessionId;
    }

    const sessionId = formState.sessionId;
    const counter = formState.incrementEventCounter();
    const eventId = sessionId ? generateEventId(sessionId, queuedEvent.eventName, counter) : undefined;

    // Send to Meta Pixel
    if (typeof window !== 'undefined' && window.fbq && eventId) {
      const pixelUserData = { ...userData, eventID: eventId };
      window.fbq('trackCustom', queuedEvent.eventName, {}, pixelUserData);
    }

    // Send to Meta CAPI
    if (eventId && sessionId) {
      sendCAPIEvent(queuedEvent.eventName, userData, eventId).catch(() => {});
    }
  });

  cookiePolling.clearQueue();
}

// Generic event tracking function
const trackMetaPixelEvent = (eventName: string, parameters?: Record<string, any>): void => {
  const envSuffix = getEnvironmentSuffix();
  const fullEventName = `${eventName}_${envSuffix}`;
  
  try {
    const formState = useFormStore.getState();
    const sessionId = formState.sessionId;
    const counter = formState.incrementEventCounter();
    const eventId = sessionId ? generateEventId(sessionId, fullEventName, counter) : undefined;

    // Console logging for staging environment
    if (envSuffix === 'stg') {
      debugLog('🎯 Meta Pixel Event Fired:', {
        eventName: fullEventName,
        eventId: eventId || 'N/A',
        parameters: parameters || {},
        timestamp: new Date().toISOString()
      });
    }

    // Build user data from form data if parameters provided
    const userData = parameters ? buildMetaUserData(parameters as Partial<CompleteFormData>) : buildMetaUserData({});

    // Check if cookies are ready
    if (!cookiePolling.isCookiesReady()) {
      cookiePolling.queueEvent(fullEventName, userData);
      return;
    }

    // Fire the actual Meta Pixel event with eventID
    if (typeof window !== 'undefined' && window.fbq) {
      if (eventId) {
        const pixelUserData = { ...userData, eventID: eventId };
        window.fbq('trackCustom', fullEventName, {}, pixelUserData);
      } else {
        if (parameters) {
          window.fbq('trackCustom', fullEventName, parameters);
        } else {
          window.fbq('trackCustom', fullEventName);
        }
      }
    } else {
      debugLog('Meta Pixel not available, event would have been:', fullEventName);
    }

    // Send to Meta CAPI (server-side)
    if (eventId && sessionId) {
      sendCAPIEvent(fullEventName, userData, eventId)
        .then(success => {
          if (success) {
            debugLog(`✅ CAPI event sent: ${fullEventName} (${eventId})`);
          } else {
            debugLog(`❌ CAPI event failed: ${fullEventName} (${eventId})`);
          }
        })
        .catch(error => {
          errorLog('CAPI event error:', error);
        });
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
    trackMetaPixelEvent('apply_prnt_event', formData);
    firedEvents.push('apply_prnt_event');

    if (isSpam) {
      trackMetaPixelEvent('apply_spam_prnt', formData);
      firedEvents.push('apply_spam_prnt');
    } else if (isQualified) {
      trackMetaPixelEvent('apply_qualfd_prnt', formData);
      firedEvents.push('apply_qualfd_prnt');
    } else {
      trackMetaPixelEvent('apply_disqualfd_prnt', formData);
      firedEvents.push('apply_disqualfd_prnt');
    }
  } else if (isStudent) {
    // Student events
    trackMetaPixelEvent('apply_stdnt', formData);
    firedEvents.push('apply_stdnt');

    if (isSpam) {
      trackMetaPixelEvent('apply_spam_stdnt', formData);
      firedEvents.push('apply_spam_stdnt');
    } else {
      // Simulate student qualification as parent
      const simulatedCategory = simulateStudentQualification(formData);
      const wouldBeQualified = ['bch', 'lum-l1', 'lum-l2'].includes(simulatedCategory);
      
      if (wouldBeQualified) {
        trackMetaPixelEvent('apply_qualfd_stdnt', formData);
        firedEvents.push('apply_qualfd_stdnt');
      } else {
        trackMetaPixelEvent('apply_disqualfd_stdnt', formData);
        firedEvents.push('apply_disqualfd_stdnt');
      }
    }
  }

  return firedEvents;
};

// GENERAL FUNNEL EVENTS (7 events)
export const firePageViewEvent = (): string[] => {
  trackMetaPixelEvent('apply_page_view');
  return ['apply_page_view'];
};

export const fireHeroCTAEvent = (): string[] => {
  trackMetaPixelEvent('apply_cta_hero');
  return ['apply_cta_hero'];
};

export const fireHeaderCTAEvent = (): string[] => {
  trackMetaPixelEvent('apply_cta_header');
  return ['apply_cta_header'];
};

export const firePage1ContinueEvent = (formData: Partial<CompleteFormData>): string[] => {
  trackMetaPixelEvent('apply_page_1_continue', formData);
  return ['apply_page_1_continue'];
};

export const firePage2ViewEvent = (formData: Partial<CompleteFormData>): string[] => {
  trackMetaPixelEvent('apply_page_2_view', formData);
  return ['apply_page_2_view'];
};

export const firePage2SubmitEvent = (formData: Partial<CompleteFormData>): string[] => {
  trackMetaPixelEvent('apply_page_2_submit', formData);
  return ['apply_page_2_submit'];
};

export const fireFormCompleteEvent = (formData: Partial<CompleteFormData>): string[] => {
  trackMetaPixelEvent('apply_form_complete', formData);
  return ['apply_form_complete'];
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
    const eventName = `apply_${categoryPrefix}_${eventType}`;
    
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
    const eventName = `apply_qualfd_prnt_${eventType}`;
    trackMetaPixelEvent(eventName, formData);
    firedEvents.push(eventName);
  } else if (isStudent) {
    // Check if student would qualify as parent
    const simulatedCategory = simulateStudentQualification(formData);
    const wouldBeQualified = ['bch', 'lum-l1', 'lum-l2'].includes(simulatedCategory);
    
    if (wouldBeQualified) {
      const eventName = `apply_qualfd_stdnt_${eventType}`;
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

// ENRICHMENT EVENTS - Fire as soon as user data becomes available
export const firePhoneCapturedEvent = (data: {
  phoneNumber: string;
  countryCode: string;
  location?: string;
}): string[] => {
  trackMetaPixelEvent('apply_phone_captured', data);
  return ['apply_phone_captured'];
};

export const fireEmailCapturedEvent = (data: {
  email: string;
  parentName?: string;
  phoneNumber?: string;
  countryCode?: string;
}): string[] => {
  trackMetaPixelEvent('apply_email_captured', data);
  return ['apply_email_captured'];
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