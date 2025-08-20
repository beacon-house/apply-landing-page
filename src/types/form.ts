import { z } from 'zod';

// Shared enums for form validation
export const GRADE_LEVELS = ['7_below', '8', '9', '10', '11', '12', 'masters'] as const;
export const CURRICULUM_TYPES = ['IB', 'IGCSE', 'CBSE', 'ICSE', 'State_Boards', 'Others'] as const;
export const SCHOLARSHIP_REQUIREMENTS = ['scholarship_optional', 'partial_scholarship', 'full_scholarship'] as const;
export const FORM_FILLER_TYPES = ['parent', 'student'] as const;
export const GRADE_FORMAT_OPTIONS = ['gpa', 'percentage'] as const;

// Simplified target geographies
export const TARGET_GEOGRAPHIES = ['US', 'UK', 'Rest of World', 'Need Guidance'] as const;

// Lead Categories
export const LEAD_CATEGORIES = ['bch', 'lum-l1', 'lum-l2', 'nurture', 'masters', 'drop'] as const;
export type LeadCategory = typeof LEAD_CATEGORIES[number];

// UTM Parameters interface
export interface UtmParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_id?: string;
}

// Base form interfaces
export interface FormStep {
  currentStep: number;
  startTime: number;
}

// Page 1: Initial Lead Capture Data
export interface InitialLeadCaptureData {
  formFillerType: typeof FORM_FILLER_TYPES[number];
  studentName: string;
  currentGrade: typeof GRADE_LEVELS[number];
  curriculumType: typeof CURRICULUM_TYPES[number];
  gradeFormat: typeof GRADE_FORMAT_OPTIONS[number];
  gpaValue?: string;
  percentageValue?: string;
  schoolName: string;
  scholarshipRequirement: typeof SCHOLARSHIP_REQUIREMENTS[number];
  targetGeographies: string[];
  phoneNumber: string;
  countryCode?: string;
}

// Page 2A: Qualified Leads (Counseling Booking)
export interface QualifiedLeadData {
  parentName: string;
  email: string;
  selectedDate: string;
  selectedSlot: string;
}

// Page 2B: Disqualified Leads (Contact Info)
export interface DisqualifiedLeadData {
  parentName: string;
  email: string;
}

// Combined form data type
export type CompleteFormData = InitialLeadCaptureData & {
  lead_category?: LeadCategory;
  parentName?: string;
  email?: string;
  selectedDate?: string;
  selectedSlot?: string;
  eventId?: string;
  utmParameters?: UtmParameters;
};

// Form submission response
export interface FormSubmissionResponse {
  success: boolean;
  error?: string;
  category?: LeadCategory;
}

// Legacy types for backward compatibility
export type BaseFormData = InitialLeadCaptureData;
export type AcademicFormData = InitialLeadCaptureData;
export type CounsellingFormData = QualifiedLeadData;