const MEASUREMENT_ID = 'G-ZRF7H5ZFXK';
const PRODUCTION_DOMAIN = 'admissions.beaconhouse.in';
import { debugLog, errorLog } from './logger';

interface GAEventParams {
  [key: string]: string | number | boolean;
}

export const initializeAnalytics = (): void => {
  try {
    // Check if the app is running on the production domain
    if (window.location.hostname === PRODUCTION_DOMAIN) {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(arguments);
      }
      
      // Properly encode document location and referrer
      const encodedLocation = encodeURIComponent(window.location.href);
      const encodedReferrer = encodeURIComponent(document.referrer || '');
      
      gtag('js', new Date());
      gtag('config', MEASUREMENT_ID, {
        'page_location': encodedLocation,
        'page_referrer': encodedReferrer
      });
      
      debugLog('Google Analytics initialized for production');
    } else {
      debugLog('Google Analytics not initialized - not on production domain');
    }
  } catch (error) {
    errorLog('Failed to initialize Google Analytics:', error);
  }
};

export const trackEvent = (
  eventName: string,
  params?: GAEventParams
): void => {
  try {
    // Only track events if we're on the production domain
    if (window.location.hostname === PRODUCTION_DOMAIN && window.gtag) {
      window.gtag('event', eventName, params);
    }
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

// Form-specific tracking functions
export const trackFormView = () => trackEvent('form_view');

export const trackFormStepComplete = (step: number) => {
  trackEvent('form_step_complete', { step });
};

export const trackFormAbandonment = (currentStep: number, startTime: number) => {
  trackEvent('form_abandonment', {
    last_step: currentStep,
    time_spent: Math.floor((Date.now() - startTime) / 1000)
  });
};

export const trackFormError = (step: number, error: string) => {
  trackEvent('form_error', { step, error });
};

// Type declarations for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}