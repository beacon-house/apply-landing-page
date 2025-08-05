/**
 * Conditional Logging Utility
 * 
 * Purpose: Provides conditional console logging that only runs in staging environment.
 * Keeps console.error and console.warn always active for critical issues.
 * 
 * Changes made:
 * - Created conditional logging utility
 * - Only shows debug logs when VITE_ENVIRONMENT === 'stg'
 * - Always shows errors and warnings regardless of environment
 */

// Get environment from Vite environment variables
const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'stg';

/**
 * Conditional console.log - only runs in staging environment
 */
export const debugLog = (...args: any[]): void => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * Always runs - for critical errors
 */
export const errorLog = (...args: any[]): void => {
  console.error(...args);
};

/**
 * Always runs - for important warnings
 */
export const warnLog = (...args: any[]): void => {
  console.warn(...args);
};

/**
 * Group logging for better organization in staging
 */
export const debugGroup = (label: string, fn: () => void): void => {
  if (isDevelopment) {
    console.group(label);
    fn();
    console.groupEnd();
  }
};

/**
 * Table logging for complex data in staging
 */
export const debugTable = (data: any): void => {
  if (isDevelopment) {
    console.table(data);
  }
};