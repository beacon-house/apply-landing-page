/**
 * Data Validation Utility
 * 
 * Purpose: Basic data validation functions. Lead category specific validation
 * has been removed and will be replaced with new implementation.
 * 
 * Changes made:
 * - Removed all lead category validation logic
 * - Kept basic validation structure for future implementation
 */

import { LeadCategory, LEAD_CATEGORIES } from '@/types/form';
import { errorLog } from './logger';

// Basic validation interface
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Basic validation placeholder
 */
export const validateLeadCategory = (category: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic null check
  if (!category) {
    errors.push('Lead category is required');
    return {
      isValid: false,
      errors,
      warnings
    };
  }
  
  // Basic type check
  if (typeof category !== 'string') {
    errors.push('Lead category must be a string');
    return {
      isValid: false,
      errors,
      warnings
    };
  }
  
  // Basic category validation
  if (!LEAD_CATEGORIES.includes(category as LeadCategory)) {
    errors.push(`Invalid lead category: ${category}`);
    return {
      isValid: false,
      errors,
      warnings
    };
  }
  
  return {
    isValid: true,
    errors,
    warnings
  };
};

/**
 * Sanitize lead category
 */
export const sanitizeLeadCategory = (category: any): string | null => {
  if (!category) return null;
  
  const stringCategory = String(category).trim().toLowerCase();
  
  // Find matching category (case-insensitive)
  const validCategory = LEAD_CATEGORIES.find(
    cat => cat.toLowerCase() === stringCategory
  );
  
  return validCategory || null;
};

/**
 * Log validation errors
 */
export const logLeadCategoryError = (
  context: string,
  category: any,
  sessionId?: string,
  additionalData?: any
): void => {
  const errorData = {
    context,
    sessionId,
    category,
    additionalData,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };
  
  errorLog('Lead Category Error:', errorData);
};

/**
 * Validate form data consistency
 */
export const validateFormDataConsistency = (formData: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation placeholder
  const categoryValidation = validateLeadCategory(formData.lead_category);
  if (!categoryValidation.isValid) {
    errors.push(...categoryValidation.errors);
  }
  warnings.push(...categoryValidation.warnings);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Compare lead categories
 */
export const compareLeadCategories = (
  webhookCategory: any,
  databaseCategory: any
): any => {
  return {
    webhookPayload: { category: webhookCategory },
    databaseRecord: { category: databaseCategory },
    leadCategoryMatch: webhookCategory === databaseCategory,
    encodingConsistent: true,
    validationErrors: [],
    recommendations: []
  };
};

/**
 * Generate data integrity report
 */
export const generateDataIntegrityReport = (
  webhookData: any,
  databaseData: any,
  sessionId: string
): any => {
  return compareLeadCategories(
    webhookData.lead_category,
    databaseData.lead_category
  );
};