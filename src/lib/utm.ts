/**
 * UTM Parameter Extraction Utility
 * 
 * Purpose: Extracts UTM parameters from the current URL for tracking campaign sources.
 * This helps track where users are coming from (Google Ads, Facebook, email campaigns, etc.)
 * 
 * Changes made:
 * - Created new utility to parse URL query parameters
 * - Extracts standard UTM parameters safely
 * - Returns clean UtmParameters object
 */

import { UtmParameters } from '@/types/form';
import { debugLog } from './logger';

/**
 * Extract UTM parameters from the current URL
 * @returns UtmParameters object with extracted UTM values
 */
export const getUtmParametersFromUrl = (): UtmParameters => {
  const utm: UtmParameters = {};
  
  try {
    const params = new URLSearchParams(window.location.search);
    
    // Extract standard UTM parameters
    if (params.has('utm_source')) utm.utm_source = params.get('utm_source') || undefined;
    if (params.has('utm_medium')) utm.utm_medium = params.get('utm_medium') || undefined;
    if (params.has('utm_campaign')) utm.utm_campaign = params.get('utm_campaign') || undefined;
    if (params.has('utm_term')) utm.utm_term = params.get('utm_term') || undefined;
    if (params.has('utm_content')) utm.utm_content = params.get('utm_content') || undefined;
    if (params.has('utm_id')) utm.utm_id = params.get('utm_id') || undefined;
    if (params.has('campaign_id')) utm.campaign_id = params.get('campaign_id') || undefined;
    if (params.has('utm_adset')) utm.utm_adset = params.get('utm_adset') || undefined;
    if (params.has('adset_id')) utm.adset_id = params.get('adset_id') || undefined;
    if (params.has('ad_id')) utm.ad_id = params.get('ad_id') || undefined;
    if (params.has('utm_placement')) utm.utm_placement = params.get('utm_placement') || undefined;
    
    // Log extracted UTM parameters for debugging
    const hasUtm = Object.keys(utm).length > 0;
    if (hasUtm) {
      debugLog('📊 UTM Parameters extracted:', utm);
    } else {
      debugLog('📊 No UTM parameters found in URL');
    }
    
    return utm;
  } catch (error) {
    console.error('Error extracting UTM parameters:', error);
    return {};
  }
};

/**
 * Check if any UTM parameters exist in the current URL
 * @returns boolean indicating if UTM parameters are present
 */
export const hasUtmParameters = (): boolean => {
  const utm = getUtmParametersFromUrl();
  return Object.keys(utm).length > 0;
};

/**
 * Get a formatted string representation of UTM parameters for logging
 * @param utm UtmParameters object
 * @returns formatted string
 */
export const formatUtmForLogging = (utm: UtmParameters): string => {
  const parts: string[] = [];
  
  if (utm.utm_source) parts.push(`source: ${utm.utm_source}`);
  if (utm.utm_medium) parts.push(`medium: ${utm.utm_medium}`);
  if (utm.utm_campaign) parts.push(`campaign: ${utm.utm_campaign}`);
  if (utm.utm_term) parts.push(`term: ${utm.utm_term}`);
  if (utm.utm_content) parts.push(`content: ${utm.utm_content}`);
  if (utm.utm_id) parts.push(`id: ${utm.utm_id}`);
  if (utm.campaign_id) parts.push(`campaign_id: ${utm.campaign_id}`);
  if (utm.utm_adset) parts.push(`adset: ${utm.utm_adset}`);
  if (utm.adset_id) parts.push(`adset_id: ${utm.adset_id}`);
  if (utm.ad_id) parts.push(`ad_id: ${utm.ad_id}`);
  if (utm.utm_placement) parts.push(`placement: ${utm.utm_placement}`);
  
  return parts.length > 0 ? parts.join(', ') : 'No UTM parameters';
};
