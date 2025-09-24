import { z } from 'zod';
import {
  GRADE_LEVELS,
  CURRICULUM_TYPES,
  SCHOLARSHIP_REQUIREMENTS,
  FORM_FILLER_TYPES,
  GRADE_FORMAT_OPTIONS
} from '@/types/form';

// Simplified Page 1: Initial Lead Capture Schema
export const initialLeadCaptureSchema = z.object({
  // Form filler and student info
  formFillerType: z.enum(FORM_FILLER_TYPES, { errorMap: () => ({ message: "Please answer this question" }) }),
  studentName: z.string().min(2, "Please enter the student's full name"),
  currentGrade: z.enum(GRADE_LEVELS, { errorMap: () => ({ message: "Please answer this question" }) }),
  location: z.string().min(2, "Please enter your current city/town/place of residence"),
  
  // Academic info
  curriculumType: z.enum(CURRICULUM_TYPES, { errorMap: () => ({ message: "Please answer this question" }) }),
  gradeFormat: z.enum(GRADE_FORMAT_OPTIONS, { 
    required_error: "Please answer this question",
    invalid_type_error: "Please answer this question"
  }),
  gpaValue: z.string().optional(),
  percentageValue: z.string().optional(),
  schoolName: z.string().min(2, "Please answer this question"),
  
  // Requirements and preferences
  scholarshipRequirement: z.enum(SCHOLARSHIP_REQUIREMENTS, { errorMap: () => ({ message: "Please answer this question" }) }),
  targetGeographies: z.array(z.string()).min(1, "Please answer this question"),
  
  // Contact info
  countryCode: z.string().min(1, "Please enter a country code").default("+91"),
  phoneNumber: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"),
}).refine((data) => {
  if (data.gradeFormat === 'gpa' && (!data.gpaValue || data.gpaValue.trim() === '')) {
    return false;
  }
  if (data.gradeFormat === 'percentage' && (!data.percentageValue || data.percentageValue.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Please answer this question",
  path: ['gpaValue', 'percentageValue']
});

// Page 2A: Qualified Leads (Counseling Booking) Schema
export const qualifiedLeadSchema = z.object({
  parentName: z.string().min(2, "Please answer this question"),
  email: z.string().email("Please enter a valid email address"),
  selectedDate: z.string().min(1, "Please select a date"),
  selectedSlot: z.string().min(1, "Please select a time slot"),
});

// Page 2B: Disqualified Leads (Contact Info) Schema
export const disqualifiedLeadSchema = z.object({
  parentName: z.string().min(2, "Please answer this question"),
  email: z.string().email("Please enter a valid email address"),
});

// Legacy schemas for backward compatibility
export const personalDetailsSchema = initialLeadCaptureSchema;
export const academicDetailsSchema = initialLeadCaptureSchema;
export const counsellingSchema = qualifiedLeadSchema;

// Complete Form Schema - Fixed to use proper z.object instead of .extend()
export const completeFormSchema = z.object({
  // Page 1 fields
  formFillerType: z.enum(FORM_FILLER_TYPES).optional(),
  studentName: z.string().optional(),
  currentGrade: z.enum(GRADE_LEVELS).optional(),
  curriculumType: z.enum(CURRICULUM_TYPES).optional(),
  gradeFormat: z.enum(GRADE_FORMAT_OPTIONS).optional(),
  gpaValue: z.string().optional(),
  percentageValue: z.string().optional(),
  schoolName: z.string().optional(),
  scholarshipRequirement: z.enum(SCHOLARSHIP_REQUIREMENTS).optional(),
  targetGeographies: z.array(z.string()).optional(),
  phoneNumber: z.string().optional(),
  
  // Page 2 fields
  parentName: z.string().optional(),
  email: z.string().email().optional(),
  selectedDate: z.string().optional(),
  selectedSlot: z.string().optional(),
  
  // System fields
  lead_category: z.string().optional(),
  sessionId: z.string().optional()
});