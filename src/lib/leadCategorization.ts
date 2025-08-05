/**
 * Lead Categorization Logic
 * 
 * Purpose: Implements the new simplified lead categorization rules based on
 * form filler type, grade, scholarship requirements, and target geography.
 * 
 * Changes made:
 * - Implemented new lead categorization rules as specified
 * - Added global override rules (student forms, spam detection, etc.)
 * - Added qualified lead categorization (BCH, Luminaire L1, Luminaire L2)
 * - Default to nurture for all other cases
 */

import { LeadCategory } from '@/types/form';
import { validateLeadCategory, logLeadCategoryError } from './dataValidation';

/**
 * Determines the lead category based on new categorization logic
 * 
 * Categories:
 * 1. bch - High priority leads
 * 2. lum-l1 - Luminaire Level 1 leads
 * 3. lum-l2 - Luminaire Level 2 leads
 * 4. masters - Masters applicants
 * 5. nurture - Default category for development
 * 6. drop - Grade 7 or below
 */
export const determineLeadCategory = (
  currentGrade: string,
  formFillerType: string,
  scholarshipRequirement: string,
  curriculumType: string,
  targetUniversityRank?: string,
  gpaValue?: string,
  percentageValue?: string,
  intake?: string,
  applicationPreparation?: string,
  targetUniversities?: string,
  supportLevel?: string,
  extendedNurtureData?: any,
  targetGeographies?: string[]
): LeadCategory => {
  let determinedCategory: LeadCategory;
  
  // GLOBAL OVERRIDE RULES (checked first)
  
  // 1. Student form filler → nurture
  if (formFillerType === 'student') {
    determinedCategory = 'nurture';
  }
  // 2. Spam detection: GPA = 10 OR percentage = 100 → nurture
  else if (gpaValue === "10" || percentageValue === "100") {
    determinedCategory = 'nurture';
  }
  // 3. Full scholarship requirement → nurture
  else if (scholarshipRequirement === 'full_scholarship') {
    determinedCategory = 'nurture';
  }
  // 4. Grade 7 or below → drop
  else if (currentGrade === '7_below') {
    determinedCategory = 'drop';
  }
  // 5. Masters grade → masters
  else if (currentGrade === 'masters') {
    determinedCategory = 'masters';
  }
  
  // QUALIFIED LEADS (only for parent-filled forms that pass global overrides)
  else if (formFillerType === 'parent') {
    
    // BCH CATEGORY
    // Rule 1: Grades 8, 9, 10 + parent + scholarship optional/partial
    if (['8', '9', '10'].includes(currentGrade) && 
        ['scholarship_optional', 'partial_scholarship'].includes(scholarshipRequirement)) {
      determinedCategory = 'bch';
    }
    // Rule 2: Grade 11 + parent + scholarship optional/partial + target geography US
    else if (currentGrade === '11' && 
             ['scholarship_optional', 'partial_scholarship'].includes(scholarshipRequirement) &&
             targetGeographies?.includes('US')) {
      determinedCategory = 'bch';
    }
    
    // LUMINAIRE L1 CATEGORY
    // Rule 1: Grade 11 + parent + scholarship optional + target geography UK/Rest of World/Need Guidance
    else if (currentGrade === '11' && 
             scholarshipRequirement === 'scholarship_optional' &&
             targetGeographies?.some(geo => ['UK', 'Rest of World', 'Need Guidance'].includes(geo))) {
      determinedCategory = 'lum-l1';
    }
    // Rule 2: Grade 12 + parent + scholarship optional
    else if (currentGrade === '12' && 
             scholarshipRequirement === 'scholarship_optional') {
      determinedCategory = 'lum-l1';
    }
    
    // LUMINAIRE L2 CATEGORY
    // Rule 1: Grade 11 + parent + partial scholarship + target geography UK/Rest of World/Need Guidance
    else if (currentGrade === '11' && 
             scholarshipRequirement === 'partial_scholarship' &&
             targetGeographies?.some(geo => ['UK', 'Rest of World', 'Need Guidance'].includes(geo))) {
      determinedCategory = 'lum-l2';
    }
    // Rule 2: Grade 12 + parent + partial scholarship
    else if (currentGrade === '12' && 
             scholarshipRequirement === 'partial_scholarship') {
      determinedCategory = 'lum-l2';
    }
    
    // DEFAULT: All other parent-filled forms → nurture
    else {
      determinedCategory = 'nurture';
    }
  }
  
  // DEFAULT: All other cases → nurture
  else {
    determinedCategory = 'nurture';
  }
  
  // Validate the determined category
  const validation = validateLeadCategory(determinedCategory);
  if (!validation.isValid) {
    logLeadCategoryError(
      'Lead Categorization - Invalid Result',
      determinedCategory,
      undefined,
      {
        currentGrade,
        formFillerType,
        scholarshipRequirement,
        curriculumType,
        targetGeographies,
        gpaValue,
        percentageValue
      }
    );
    // Fallback to nurture if categorization fails
    return 'nurture';
  }
  
  return determinedCategory;
};