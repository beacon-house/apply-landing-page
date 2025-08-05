/**
 * Initial Lead Capture Form Component
 * 
 * Purpose: Simplified Page 1 form that captures all essential lead qualification data
 * in a single step. Combines personal details, academic info, and preferences.
 * 
 * Changes made:
 * - Created new simplified form combining all Page 1 fields
 * - Maintains existing validation and error handling
 * - Uses existing UI components and styling
 */

/**
 * Initial Lead Capture Form Component v8.1
 * 
 * Purpose: Simplified Page 1 form with sticky continue button to improve completion rates.
 * Now uses centralized form utilities for consistent error handling across all forms.
 * 
 * Changes made:
 * - Refactored to use centralized form utilities from formUtils.ts
 * - Maintained existing sticky button and validation behavior
 * - Added data-field attributes to all form inputs for proper focusing
 */

import React, { forwardRef, useImperativeHandle } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ChevronRight, User, GraduationCap, Trophy } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '@/lib/utils';
import { initialLeadCaptureSchema } from '@/schemas/form';
import { InitialLeadCaptureData } from '@/types/form';
import { trackFormSection } from '@/lib/formTracking';
import { useFormStore } from '@/store/formStore';
import { getFirstErrorField, focusField } from '@/lib/formUtils';
import { debugLog, errorLog, warnLog } from '@/lib/logger';

interface InitialLeadCaptureFormProps {
  onSubmit: (data: InitialLeadCaptureData) => void;
  defaultValues?: Partial<InitialLeadCaptureData>;
}

// Expose setFocus method to parent component
export interface InitialLeadCaptureFormRef {
  setFocus: (fieldName: keyof InitialLeadCaptureData) => void;
}

// Define the correct field order for validation error focusing
const FIELD_ORDER: (keyof InitialLeadCaptureData)[] = [
  'formFillerType',
  'studentName',
  'currentGrade',
  'countryCode',
  'phoneNumber',
  'curriculumType',
  'schoolName',
  'gradeFormat',
  'gpaValue',
  'percentageValue',
  'scholarshipRequirement',
  'targetGeographies'
];

export const InitialLeadCaptureForm = forwardRef<InitialLeadCaptureFormRef, InitialLeadCaptureFormProps>(
  ({ onSubmit, defaultValues }, ref) => {
  const [showStickyButton, setShowStickyButton] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { sessionId } = useFormStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
    clearErrors,
    setFocus: reactHookFormSetFocus,
  } = useForm<InitialLeadCaptureData>({
    resolver: zodResolver(initialLeadCaptureSchema),
    defaultValues: {
      gradeFormat: 'gpa',
      countryCode: '+91',
      ...defaultValues
    }
  });

  const gradeFormat = watch('gradeFormat');
  
  // Watch all form fields for tracking
  const watchedFields = watch();
  
  // Expose setFocus method to parent component via ref
  useImperativeHandle(ref, () => ({
    setFocus: (fieldName: keyof InitialLeadCaptureData) => {
      console.log('🚀 External setFocus called for:', fieldName);
      // First try React Hook Form's setFocus
      reactHookFormSetFocus(fieldName);
      // Then enhance with DOM focusing
      focusField(fieldName);
    }
  }), []);

  // Enhanced form submission handler with proper error handling
  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (isSubmitting) {
      debugLog('⏳ Form already submitting, ignoring duplicate submission');
      return;
    }
    
    debugLog('🚀 Form submission initiated');
    setIsSubmitting(true);
    
    try {
      // Validate the form first
      const result = await handleSubmit(async (data) => {
        debugLog('✅ Form validation passed, submitting data');
        await onSubmit(data);
      }, async (errors) => {
        debugLog('❌ Form validation failed with errors:', errors);
        
        // Get error field names
        const errorFields = Object.keys(errors);
        
        if (errorFields.length > 0) {
          // Find the first error field in the correct order
          const firstErrorField = getFirstErrorField<InitialLeadCaptureData>(errorFields, FIELD_ORDER);
          
          if (firstErrorField) {
            debugLog('🎯 Focusing on first error field:', firstErrorField);
            
            // Use a longer delay to ensure DOM is ready and stable
            setTimeout(async () => {
              // First try React Hook Form's setFocus
              reactHookFormSetFocus(firstErrorField);
              // Then enhance with DOM focusing
              const success = await focusField(firstErrorField);
              if (!success) {
                warnLog('⚠️ Failed to focus field, trying fallback approach');
                // Fallback: scroll to top of form
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }, 300);
          }
        }
      })();
      
      // The result will be undefined if validation fails, so we handle it here
      if (result === undefined) {
        debugLog('🛑 Form submission stopped due to validation errors');
      }
      
    } catch (error) {
      errorLog('❌ Unexpected error during form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  // Handle scroll detection for sticky button
  React.useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Show sticky button after scrolling down 200px
        setShowStickyButton(window.scrollY > 200);
      }, 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Helper function to handle numeric input with optional decimal point
  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, min: number, max: number, fieldName: 'gpaValue' | 'percentageValue') => {
    const value = e.target.value;
    
    // Allow empty input for user to type
    if (value === '') return;
    
    // Allow a single decimal point
    if (value === '.') {
      e.target.value = '.';
      return;
    }
    
    // Validate as a number with optional single decimal point
    const regex = /^\d*\.?\d*$/;
    if (!regex.test(value)) {
      e.target.value = value.slice(0, -1);
      return;
    }
    
    // Check if it's within range when it's a valid number
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue < min) {
        e.target.value = min.toString();
        setValue(fieldName, min.toString());
      } else if (numValue > max) {
        e.target.value = max.toString();
        setValue(fieldName, max.toString());
      } else {
        // Value is within range, update form state with the current value
        setValue(fieldName, e.target.value);
      }
    }
  };

  // Track form sections as user completes them
  const trackSectionCompletion = async (sectionName: string, sectionData: any) => {
    try {
      await trackFormSection(sessionId, sectionName, sectionData, 1);
    } catch (error) {
      console.error('Section tracking error:', error);
      // Don't break form flow
    }
  };

  // Watch for section completion and save incrementally
  React.useEffect(() => {
    const studentInfoComplete = !!(
      watchedFields.formFillerType &&
      watchedFields.studentName &&
      watchedFields.currentGrade &&
      watchedFields.countryCode &&
      watchedFields.phoneNumber
    );

    if (studentInfoComplete) {
      trackSectionCompletion('student_info_complete', {
        formFillerType: watchedFields.formFillerType,
        studentName: watchedFields.studentName,
        currentGrade: watchedFields.currentGrade,
        countryCode: watchedFields.countryCode,
        phoneNumber: watchedFields.phoneNumber,
        sessionId
      });
    }
  }, [watchedFields.formFillerType, watchedFields.studentName, watchedFields.currentGrade, watchedFields.countryCode, watchedFields.phoneNumber, sessionId]);

  React.useEffect(() => {
    const academicInfoComplete = !!(
      watchedFields.curriculumType &&
      watchedFields.schoolName &&
      watchedFields.gradeFormat &&
      (watchedFields.gradeFormat === 'gpa' ? watchedFields.gpaValue : watchedFields.percentageValue)
    );

    if (academicInfoComplete) {
      trackSectionCompletion('academic_info_complete', {
        curriculumType: watchedFields.curriculumType,
        schoolName: watchedFields.schoolName,
        gradeFormat: watchedFields.gradeFormat,
        gpaValue: watchedFields.gpaValue,
        percentageValue: watchedFields.percentageValue,
        sessionId
      });
    }
  }, [watchedFields.curriculumType, watchedFields.schoolName, watchedFields.gradeFormat, watchedFields.gpaValue, watchedFields.percentageValue, sessionId]);

  React.useEffect(() => {
    const preferencesComplete = !!(
      watchedFields.scholarshipRequirement &&
      watchedFields.targetGeographies?.length > 0
    );

    if (preferencesComplete) {
      trackSectionCompletion('preferences_complete', {
        scholarshipRequirement: watchedFields.scholarshipRequirement,
        targetGeographies: watchedFields.targetGeographies,
        sessionId
      });
    }
  }, [watchedFields.scholarshipRequirement, watchedFields.targetGeographies, sessionId]);

  const handleStickySubmit = () => {
    debugLog('📱 Sticky button clicked');
    handleFormSubmit();
  };

  return (
    <div className="relative">
    <form onSubmit={handleFormSubmit} className="space-y-8">
      {/* Form Filler & Student Info Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-6">
          <User className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-primary">Student Information</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Are you the parent or the student? <span className="text-red-500">*</span></Label>
            <Controller
              name="formFillerType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={cn(
                    "h-12 bg-white",
                    errors.formFillerType ? 'border-red-500 focus:border-red-500' : ''
                  )} data-field="formFillerType">
                    <SelectValue placeholder="Select who is filling the form" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">I am the Parent</SelectItem>
                    <SelectItem value="student">I am the Student</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.formFillerType && (
              <p className="text-sm text-red-500 italic">Please answer this question</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentName">Student's Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Enter student's full name"
              id="studentName"
              {...register('studentName')}
              className={cn(
                "h-12 bg-white",
                errors.studentName ? 'border-red-500 focus:border-red-500' : ''
              )}
              data-field="studentName"
            />
            {errors.studentName && (
              <p className="text-sm text-red-500 italic">Please enter the student's full name</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Grade in Academic Year 25-26 <span className="text-red-500">*</span></Label>
            <Controller
              name="currentGrade"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={cn(
                    "h-12 bg-white",
                    errors.currentGrade ? 'border-red-500 focus:border-red-500' : ''
                  )} data-field="currentGrade">
                    <SelectValue placeholder="Select Grade in Academic Year 25-26" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">Grade 12</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                    <SelectItem value="7_below">Grade 7 or below</SelectItem>
                    <SelectItem value="masters">Apply for Masters</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.currentGrade && (
              <p className="text-sm text-red-500 italic">Please answer this question</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Parent Phone Number <span className="text-red-500">*</span></Label>
            <div className="flex space-x-2 items-end">
              <div className="w-24 md:w-28">
                <Input
                  placeholder="+91"
                  id="countryCode"
                  type="tel"
                  {...register('countryCode')}
                  className={cn(
                    "h-12 bg-white",
                    errors.countryCode ? 'border-red-500 focus:border-red-500' : ''
                  )}
                  data-field="countryCode"
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="10 digit mobile number"
                  id="phoneNumber"
                  type="tel"
                  {...register('phoneNumber')}
                  className={cn(
                    "h-12 bg-white",
                    errors.phoneNumber ? 'border-red-500 focus:border-red-500' : ''
                  )}
                  data-field="phoneNumber"
                />
              </div>
            </div>
            {errors.countryCode && (
              <p className="text-sm text-red-500 italic">Please enter a valid country code</p>
            )}
            {errors.phoneNumber && (
              <p className="text-sm text-red-500 italic">Please enter a valid 10-digit phone number</p>
            )}
          </div>
        </div>
      </div>

      {/* Academic Information Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-6">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-primary">Academic Information</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Curriculum Type <span className="text-red-500">*</span></Label>
            <Controller
              name="curriculumType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={cn(
                    "h-12 bg-white",
                    errors.curriculumType ? 'border-red-500 focus:border-red-500' : ''
                  )} data-field="curriculumType">
                    <SelectValue placeholder="Select curriculum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IB">IB</SelectItem>
                    <SelectItem value="IGCSE">IGCSE</SelectItem>
                    <SelectItem value="CBSE">CBSE</SelectItem>
                    <SelectItem value="ICSE">ICSE</SelectItem>
                    <SelectItem value="State_Boards">State Boards</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.curriculumType && (
              <p className="text-sm text-red-500 italic">Please answer this question</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Enter your school name"
              id="schoolName"
              {...register('schoolName')}
              className={cn(
                "h-12 bg-white",
                errors.schoolName ? 'border-red-500 focus:border-red-500' : ''
              )}
              data-field="schoolName"
            />
            {errors.schoolName && (
              <p className="text-sm text-red-500 italic">Please answer this question</p>
            )}
          </div>

          {/* Academic Grade Format Selection */}
          <div className="space-y-2">
            <Label className="text-gray-700">What was the student's GPA/Percentage in the most recent exam? <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <button
                type="button"
                onClick={() => {
                  setValue('gradeFormat', 'gpa');
                  setValue('percentageValue', ''); // Clear the other field
                  clearErrors('gpaValue');
                }}
                className={cn(
                  "h-12 flex items-center justify-center border rounded-lg font-medium transition-colors",
                  gradeFormat === 'gpa'
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                )}
              >
                GPA Format
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('gradeFormat', 'percentage');
                  setValue('gpaValue', ''); // Clear the other field
                  clearErrors('percentageValue');
                }}
                className={cn(
                  "h-12 flex items-center justify-center border rounded-lg font-medium transition-colors",
                  gradeFormat === 'percentage'
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                )}
              >
                Percentage Format
              </button>
            </div>

            {/* Show appropriate input field based on selected format */}
            {gradeFormat === 'gpa' ? (
              <div className="space-y-2">
                <Label htmlFor="gpaValue" className="text-gray-700">GPA (out of 10) <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter GPA value (e.g. 8.5)"
                    id="gpaValue"
                    {...register('gpaValue')}
                    className={cn(
                      "h-12 bg-white",
                      errors.gpaValue ? 'border-red-500 focus:border-red-500' : ''
                    )}
                    suffix="/10"
                    onChange={(e) => handleNumericInput(e, 1, 10, 'gpaValue')}
                    data-field="gpaValue"
                  />
                {errors.gpaValue && (
                  <p className="text-sm text-red-500 italic">Please answer this question</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="percentageValue" className="text-gray-700">Percentage <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter percentage (e.g. 85)"
                    id="percentageValue"
                    {...register('percentageValue')}
                    className={cn(
                      "h-12 bg-white",
                      errors.percentageValue ? 'border-red-500 focus:border-red-500' : ''
                    )}
                    suffix="%"
                    onChange={(e) => handleNumericInput(e, 1, 100, 'percentageValue')}
                    data-field="percentageValue"
                  />
                {errors.percentageValue && (
                  <p className="text-sm text-red-500 italic">Please answer this question</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-6">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-primary">Study Preferences</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Level of scholarship needed <span className="text-red-500">*</span></Label>
            <p className="text-sm text-gray-600 mb-2 italic">
              Please select your scholarship requirements:
            </p>
            
            <div className="space-y-3" data-field="scholarshipRequirement" id="scholarshipRequirement">
              <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  {...register('scholarshipRequirement')}
                  value="full_scholarship"
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-medium">Full scholarship needed</span>
                  <p className="text-sm text-gray-600">I require 100% financial assistance to pursue my studies</p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  {...register('scholarshipRequirement')}
                  value="partial_scholarship"
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-medium">Partial scholarship needed</span>
                  <p className="text-sm text-gray-600">I can cover some costs but require partial financial support</p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  {...register('scholarshipRequirement')}
                  value="scholarship_optional"
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <span className="font-medium">Scholarship optional</span>
                  <p className="text-sm text-gray-600">I can pursue my studies without scholarship support</p>
                </div>
              </label>
            </div>
            
            {errors.scholarshipRequirement && (
              <p className="text-sm text-red-500 italic">Please answer this question</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Select your preferred destinations (includes typical budget ranges) <span className="text-red-500">*</span></Label>
            <p className="text-sm text-gray-600 mb-2 italic">
              Select your preferred study destinations
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-field="targetGeographies" id="targetGeographies">
              {[
                'US (Rs. 1.6-2 Cr)',
                'UK (Rs. 1.2-1.6 Cr)', 
                'Rest of World',
                'Need Guidance'
              ].map((geography) => (
                <label key={geography} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    {...register('targetGeographies')}
                    value={geography.includes('(') ? geography.split(' (')[0] : geography}
                    defaultChecked={defaultValues?.targetGeographies?.includes(geography.includes('(') ? geography.split(' (')[0] : geography)}
                    className="rounded border-gray-300 text-primary focus:ring-primary mt-1"
                  />
                  <span className="text-sm leading-tight">{geography}</span>
                </label>
              ))}
            </div>
            {errors.targetGeographies && (
              <p className="text-sm text-red-500 italic">Please answer this question</p>
            )}
          </div>
        </div>
      </div>

      </form>
      
      {/* Sticky Continue Button - Shows after scroll */}
      {showStickyButton && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg animate-slide-up">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleStickySubmit}
              disabled={false}
              className={cn(
                "w-full py-4 rounded-lg text-base md:text-lg font-bold transition-all duration-300 shadow-md flex items-center justify-center space-x-2",
                "bg-accent text-primary hover:bg-accent-light hover:shadow-lg"
              )}
            >
              <span>Continue</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {/* Progress hint */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-600">
                Step 1 of 2 • Takes less than 2 minutes
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Add bottom padding when sticky button is visible */}
      {showStickyButton && <div className="h-24" />}
    </div>
  );
});

InitialLeadCaptureForm.displayName = 'InitialLeadCaptureForm';