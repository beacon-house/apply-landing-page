/**
 * Lead Categorization Logic
 *
 * Purpose: Implements lead categorization rules based on form filler type,
 * grade, scholarship requirements, curriculum type, and target geography.
 *
 * Changes made:
 * - Implemented lead categorization rules as specified
 * - Added global override rules (student forms, spam detection, etc.)
 * - Added qualified lead categorization (BCH, Luminaire L1, Luminaire L2)
 * - Added Indian curriculum (CBSE/ICSE/State_Boards) specific rules:
 *   - Grades 8-10 with partial scholarship → nurture
 *   - Grades 11-12 with optional/partial → BCH (bypasses Luminaire)
 * - IB, IGCSE, Others keep existing logic unchanged
 * - Default to nurture for all other cases
 */

import { LeadCategory } from '@/types/form';
import { validateLeadCategory, logLeadCategoryError } from './dataValidation';

/**
 * Helper function to check if curriculum is an Indian curriculum (CBSE, ICSE, or State Boards)
 * These curriculums have stricter lead qualification rules
 */
const isIndianCurriculum = (curriculumType: string): boolean => {
  return ['CBSE', 'ICSE', 'State_Boards'].includes(curriculumType);
};

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

    // CBSE/ICSE CURRICULUM-SPECIFIC RULES
    // These curriculums have stricter qualification criteria

    // CBSE/ICSE Grade 8-10 with partial scholarship → nurture
    // (scholarship_optional still qualifies for BCH)
    if (isIndianCurriculum(curriculumType) &&
        ['8', '9', '10'].includes(currentGrade) &&
        scholarshipRequirement === 'partial_scholarship') {
      determinedCategory = 'nurture';
    }

    // BCH CATEGORY
    // Rule 1: Grades 8, 9, 10 + parent + scholarship optional/partial
    // Note: CBSE/ICSE with partial_scholarship already filtered to nurture above
    else if (['8', '9', '10'].includes(currentGrade) &&
        ['scholarship_optional', 'partial_scholarship'].includes(scholarshipRequirement)) {
      determinedCategory = 'bch';
    }

    // CBSE/ICSE Grade 11-12 with optional/partial scholarship → BCH
    // (overrides Luminaire categorization for these curriculums)
    else if (isIndianCurriculum(curriculumType) &&
             ['11', '12'].includes(currentGrade) &&
             ['scholarship_optional', 'partial_scholarship'].includes(scholarshipRequirement)) {
      determinedCategory = 'bch';
    }

    // Rule 2: Grade 11 + parent + scholarship optional/partial + target geography US
    // (for non-CBSE/ICSE curriculums, since CBSE/ICSE already handled above)
    else if (currentGrade === '11' &&
             ['scholarship_optional', 'partial_scholarship'].includes(scholarshipRequirement) &&
             targetGeographies?.includes('US')) {
      determinedCategory = 'bch';
    }

    // LUMINAIRE L1 CATEGORY (only for non-CBSE/ICSE curriculums)
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

    // LUMINAIRE L2 CATEGORY (only for non-CBSE/ICSE curriculums)
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