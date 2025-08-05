/**
 * Form Utilities Library
 * 
 * Purpose: Centralized helper functions for form validation, error handling, and field focusing.
 * Provides reusable utilities for consistent form behavior across all form components.
 * 
 * Changes made:
 * - Created centralized form utility functions
 * - Extracted field focusing and error handling logic
 * - Made functions generic to work with any form type
 */

import { debugLog, warnLog, errorLog } from './logger';

// Define the correct field order for validation error focusing
export const getFirstErrorField = <T extends Record<string, any>>(
  errorFields: string[],
  fieldOrder: (keyof T)[]
): keyof T | null => {
  debugLog('🔍 Error fields detected:', errorFields);
  
  // Find the first field in fieldOrder that has an error
  for (const fieldName of fieldOrder) {
    if (errorFields.includes(fieldName as string)) {
      debugLog('🎯 First error field found:', fieldName);
      return fieldName;
    }
  }
  
  // Fallback to first error field if not found in order
  const fallbackField = errorFields[0] as keyof T;
  debugLog('⚠️ Using fallback field:', fallbackField);
  return fallbackField;
};

// Enhanced field focusing with better error handling
export const focusField = async <T extends Record<string, any>>(
  fieldName: keyof T
): Promise<boolean> => {
  debugLog('📍 Attempting to focus field:', fieldName);
  
  try {
    // Wait a bit for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try multiple selectors to find the element
    const selectors = [
      `[data-field="${fieldName}"]`,
      `#${fieldName}`,
      `input[name="${fieldName}"]`,
      `select[name="${fieldName}"]`,
      `[name="${fieldName}"]`
    ];
    
    let element: HTMLElement | null = null;
    for (const selector of selectors) {
      element = document.querySelector(selector);
      if (element) {
        debugLog(`✅ Element found with selector: ${selector}`);
        break;
      }
    }
    
    if (element) {
      // Scroll into view with optimal positioning
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Add visual highlight effect
      element.style.transition = 'all 0.3s ease';
      element.style.boxShadow = '0 0 0 3px rgba(255, 199, 54, 0.5)';
      element.style.borderColor = '#FFC736';
      
      // Try to focus the element
      if ('focus' in element && typeof element.focus === 'function') {
        element.focus();
        debugLog('✅ DOM focus set for:', fieldName);
      }
      
      // Remove highlight after 2.5 seconds
      setTimeout(() => {
        if (element) {
          element.style.boxShadow = '';
          element.style.borderColor = '';
        }
      }, 2500);
      
      return true;
    } else {
      warnLog(`❌ Could not find DOM element for field: ${fieldName}`);
      return false;
    }
  } catch (error) {
    errorLog('❌ Error in focusField:', error);
    return false;
  }
};