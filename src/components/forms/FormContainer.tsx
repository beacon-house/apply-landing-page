/**
 * FormContainer Component v8.1
 * 
 * Purpose: Main orchestrator for the 2-page form with Meta Pixel event tracking.
 * 
 * Changes made:
 * - Added comprehensive Meta Pixel event tracking
 * - Integrated event firing throughout form flow
 */

import React, { useEffect, useState, useRef } from 'react';
import { Progress } from '../ui/progress';
import { InitialLeadCaptureForm, InitialLeadCaptureFormRef } from './InitialLeadCaptureForm';
import { QualifiedLeadForm } from './QualifiedLeadForm';
import { DisqualifiedLeadForm } from './DisqualifiedLeadForm';
import { SequentialLoadingAnimation } from '../ui/SequentialLoadingAnimation';
import { useFormStore } from '@/store/formStore';
import { trackFormView, trackFormStepComplete, trackFormAbandonment, trackFormError } from '@/lib/analytics';
import { submitFormData, validateForm, FormValidationError } from '@/lib/form';
import { determineLeadCategory } from '@/lib/leadCategorization';
import { fireFormProgressionEvents, firePageViewEvent } from '@/lib/metaPixelEvents';
import { toast } from '@/components/ui/toast';
import { trackStep } from '@/lib/formTracking';
import { 
  trackFormSection, 
  trackPageCompletion, 
  trackFormSubmission,
  saveFormDataIncremental 
} from '@/lib/formTracking';
import { InitialLeadCaptureData, QualifiedLeadData, DisqualifiedLeadData } from '@/types/form';
import { debugLog, errorLog } from '@/lib/logger';

export default function FormContainer() {
  const {
    currentStep,
    formData, // This is a snapshot, use getLatestFormData() for latest
    isSubmitting,
    isSubmitted,
    startTime,
    sessionId,
    triggeredEvents, // This is a snapshot, use getLatestFormData() for latest
    setStep,
    updateFormData,
    setSubmitting,
    setSubmitted,
    addTriggeredEvents,
    getLatestFormData // Import the new getter
  } = useFormStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // Ref for initial lead capture form to enable field focus
  const initialLeadFormRef = useRef<InitialLeadCaptureFormRef>(null);

  // State for the evaluation interstitial
  const [showEvaluationAnimation, setShowEvaluationAnimation] = useState(false);
  const [evaluatedLeadCategory, setEvaluatedLeadCategory] = useState<string | null>(null);
  
  // Track form start when component mounts
  useEffect(() => {
    const trackFormStart = async () => {
      try {
        // Use getLatestFormData to ensure we have the most current state for initial save
        const { formData: latestFormData, triggeredEvents: latestTriggeredEvents } = getLatestFormData();
        await saveFormDataIncremental(sessionId, 1, '01_form_start', {
          ...latestFormData, // Include any existing form data
          sessionId,
          startTime,
          triggeredEvents: latestTriggeredEvents // Pass the latest events
        });
      } catch (error) {
        debugLog('Form start tracking error:', error);
      }
    };
    
    trackFormStart();
  }, [sessionId, startTime, getLatestFormData]); // Add getLatestFormData to dependencies
  
  // Test database connectivity on mount
  useEffect(() => {
    const testConnectivity = async () => {
      try {
        debugLog('🔍 Testing database connectivity...');
        const { testDatabaseConnection } = await import('@/lib/database');
        
        const isConnected = await testDatabaseConnection();
        debugLog('Database connection test:', isConnected ? '✅ Success' : '❌ Failed');
      } catch (error) {
        errorLog('Database connectivity test error:', error);
      }
    };
    
    testConnectivity();
  }, []);

  const onSubmitPage1 = async (data: InitialLeadCaptureData) => {
    try {
      debugLog('📝 Page 1 submission started with data:', data);
      await validateForm(1, data);
      debugLog('✅ Page 1 validation passed');
      
      // Update form data in store first
      updateFormData(data);
      
      // Determine lead category using new logic
      const leadCategory = determineLeadCategory(
        data.currentGrade,
        data.formFillerType,
        data.scholarshipRequirement,
        data.curriculumType,
        undefined, // targetUniversityRank not used in new logic
        data.gpaValue,
        data.percentageValue,
        undefined, // intake not used in new logic
        undefined, // applicationPreparation not used in new logic
        undefined, // targetUniversities not used in new logic
        undefined, // supportLevel not used in new logic
        undefined, // extendedNurtureData not used in new logic
        data.targetGeographies
      );
      updateFormData({ lead_category: leadCategory }); // Update lead category in store
      
      // Get the absolute latest state from the store after all updates
      const { formData: latestFormDataAfterUpdates, triggeredEvents: latestTriggeredEventsAfterUpdates } = getLatestFormData();

      // If grade 7 or below, submit form immediately with DROP lead category
      if (data.currentGrade === '7_below') {
        setSubmitting(true);
        const finalData = { 
          ...latestFormDataAfterUpdates, // Use latest form data
          lead_category: 'drop', // Explicitly set drop category
          startTime
        };
        
        // Fire Meta Pixel events for form completion
        const formCompleteEvents = fireFormProgressionEvents('form_complete', finalData);
        addTriggeredEvents(formCompleteEvents); // Add events to store
        
        // Get the absolute latest triggered events after adding formCompleteEvents
        const { triggeredEvents: finalTriggeredEventsForSubmission } = getLatestFormData();

        // Track final submission for grade 7 below
        await trackFormSubmission(sessionId, finalData, true);
        
        // Submit form with lead category and all accumulated events
        await submitFormData(finalData, 1, startTime, true, finalTriggeredEventsForSubmission);
        setSubmitting(false);
        setSubmitted(true);
        return;
      }
      
      // Fire Meta Pixel events for Page 1 completion
      const page1Events = fireFormProgressionEvents('page_1_complete', latestFormDataAfterUpdates);
      addTriggeredEvents(page1Events); // Add events to store
      
      // Get the absolute latest triggered events after adding page1Events
      const { triggeredEvents: finalTriggeredEventsForPage1Save } = getLatestFormData();

      // Track page 1 submission with incremental save, passing the latest state
      await trackPageCompletion(sessionId, 1, '05_page1_complete', {
        ...latestFormDataAfterUpdates, // Use latest form data
        triggeredEvents: finalTriggeredEventsForPage1Save // Pass the latest events
      });
      trackFormStepComplete(1); // This tracks GA, not Meta Pixel
      
      // If form is filled by student, submit immediately regardless of other conditions
      if (data.formFillerType === 'student') {
        setSubmitting(true);
        
        // Fire Meta Pixel events for student direct submission
        const studentCompleteEvents = fireFormProgressionEvents('form_complete', latestFormDataAfterUpdates);
        addTriggeredEvents(studentCompleteEvents);
        
        // Get the absolute latest triggered events after adding studentCompleteEvents
        const { triggeredEvents: finalTriggeredEventsForStudentSubmission } = getLatestFormData();
        
        // Track student direct submission
        await trackFormSubmission(sessionId, latestFormDataAfterUpdates, true);
        
        await submitFormData(latestFormDataAfterUpdates, 1, startTime, true, finalTriggeredEventsForStudentSubmission);
        setSubmitting(false);
        setSubmitted(true);
        return;
      }
      
      // If qualified, show animation, else proceed to page 2
      const isQualified = ['bch', 'lum-l1', 'lum-l2'].includes(leadCategory);
      
      if (isQualified) {
        // Show evaluation animation before proceeding to counseling (Page 2A)
        window.scrollTo(0, 0);
        setSubmitting(true);
        setShowEvaluationAnimation(true);
        setTimeout(() => {
          handleEvaluationComplete();
        }, 10000); // 10 seconds for evaluation animation
      } else {
        // Disqualified leads go directly to Page 2B (contact info only)
        window.scrollTo(0, 0);
        setStep(2);
        
        // Fire Page 2 view events for disqualified leads
        const page2ViewEvents = fireFormProgressionEvents('page_2_view', latestFormDataAfterUpdates);
        addTriggeredEvents(page2ViewEvents); // Add events to store
        
        // No explicit incremental save here, as the useEffect below handles it
        // for disqualified leads when currentStep becomes 2.
        // The useEffect will use getLatestFormData() to get the most current state.
      }
      
    } catch (error) {
      debugLog('❌ Page 1 submission failed:', error);
      if (error instanceof FormValidationError) {
        // Get the first field with an error
        const errorFields = Object.keys(error.errors);
        
        debugLog('🔍 Form validation failed. Error fields:', errorFields);
        
        // The form component will handle the focusing internally
        // We just need to show the error messages
        let errorCount = 0;
        Object.values(error.errors).forEach(messages => {
          messages.forEach(message => {
            errorCount++;
            debugLog(`🚨 Error ${errorCount}:`, message);
            // Don't show toast errors as they're already shown in the form
            // toast.error(message);
          });
        });
        
        debugLog(`📊 Total validation errors: ${errorCount}`);
      } else {
        errorLog('❌ Unexpected error during submission:', error);
        // For non-validation errors, show a toast
        if (error instanceof Error) {
          errorLog('Error details:', error.message);
          // toast.error(error.message);
        } else {
          errorLog('Unknown error:', error);
          // toast.error('An unexpected error occurred. Please try again.');
        }
        trackFormError(1, 'submission_error');
      }
      setSubmitting(false);
    }
  };

  const onSubmitPage2A = async (data: QualifiedLeadData) => {
    try {
      // Update Zustand store FIRST with Page 2 data
      updateFormData(data);
      
      // Get the absolute latest state from the store after updates
      const { formData: latestFormDataAfterUpdates, triggeredEvents: latestTriggeredEventsAfterUpdates } = getLatestFormData();
      
      // Fire Page 2 submit events
      const page2SubmitEvents = fireFormProgressionEvents('page_2_submit', latestFormDataAfterUpdates);
      addTriggeredEvents(page2SubmitEvents);
      
      // Fire form complete events
      const formCompleteEvents = fireFormProgressionEvents('form_complete', latestFormDataAfterUpdates);
      addTriggeredEvents(formCompleteEvents);
      
      // Get the absolute latest triggered events after adding all events for this step
      const { triggeredEvents: finalTriggeredEventsForSubmission } = getLatestFormData();

      await validateForm(2, latestFormDataAfterUpdates); // Validate with latest data
      setSubmitting(true);
      
      // Track final submission to database
      await trackFormSubmission(sessionId, latestFormDataAfterUpdates, true);
      
      // Submit all form data including counselling details and all accumulated events
      await submitFormData(latestFormDataAfterUpdates, 2, startTime, true, finalTriggeredEventsForSubmission);
      
      setSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      errorLog('Error submitting form:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
      trackFormError(2, 'submission_error');
      setSubmitting(false);
    }
  };

  const onSubmitPage2B = async (data: DisqualifiedLeadData) => {
    try {
      // Update Zustand store FIRST with Page 2 data
      updateFormData(data);
      
      // Get the absolute latest state from the store after updates
      const { formData: latestFormDataAfterUpdates, triggeredEvents: latestTriggeredEventsAfterUpdates } = getLatestFormData();
      
      // Fire Page 2 submit events
      const page2SubmitEvents = fireFormProgressionEvents('page_2_submit', latestFormDataAfterUpdates);
      addTriggeredEvents(page2SubmitEvents);
      
      // Fire form complete events
      const formCompleteEvents = fireFormProgressionEvents('form_complete', latestFormDataAfterUpdates);
      addTriggeredEvents(formCompleteEvents);
      
      // Get the absolute latest triggered events after adding all events for this step
      const { triggeredEvents: finalTriggeredEventsForSubmission } = getLatestFormData();

      await validateForm(2, latestFormDataAfterUpdates); // Validate with latest data
      setSubmitting(true);
      
      // Track final submission to database
      await trackFormSubmission(sessionId, latestFormDataAfterUpdates, true);
      
      // Submit all form data and all accumulated events
      await submitFormData(latestFormDataAfterUpdates, 2, startTime, true, finalTriggeredEventsForSubmission);
      
      setSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      errorLog('Error submitting form:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
      trackFormError(2, 'submission_error');
      setSubmitting(false);
    }
  };

  // Handle completion of evaluation animation
  const handleEvaluationComplete = () => {
    setShowEvaluationAnimation(false);
    setSubmitting(false);
    setStep(2);
    
    // Get the absolute latest state from the store before firing page2ViewEvents
    const { formData: latestFormDataBeforePage2View, triggeredEvents: latestTriggeredEventsBeforePage2View } = getLatestFormData();

    // Fire Page 2 view events when moving to qualified lead form
    const page2ViewEvents = fireFormProgressionEvents('page_2_view', latestFormDataBeforePage2View);
    addTriggeredEvents(page2ViewEvents); // Add events to store
    
    // Get the absolute latest triggered events after adding page2ViewEvents
    const { triggeredEvents: finalTriggeredEventsForPage2ViewSave } = getLatestFormData();

    // Track that lead has been evaluated and save page 2 view data incrementally
    const trackLeadEvaluatedAndSavePage2View = async () => {
      try {
        await saveFormDataIncremental(sessionId, 2, '06_lead_evaluated', {
          ...latestFormDataBeforePage2View, // Use latest form data
          triggeredEvents: finalTriggeredEventsForPage2ViewSave // Pass the latest events
        });
      } catch (error) {
        debugLog('Lead evaluated tracking error:', error);
      }
    };
    trackLeadEvaluatedAndSavePage2View();
    
    trackFormStepComplete(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 1: return 50;
      case 2: return 100;
      default: return 0;
    }
  };
  
  useEffect(() => {
    // Track page view when component mounts or step changes
    trackFormView();
  }, [currentStep]);

  // Fire Page 2 view events when step 2 is reached
  useEffect(() => {
    if (currentStep === 2 && formData.lead_category && !['bch', 'lum-l1', 'lum-l2'].includes(formData.lead_category)) {
      // For disqualified leads, fire page 2 view events if not already fired
      // This useEffect handles the case where a disqualified lead goes directly to page 2.
      // We need to ensure the triggeredEvents are up-to-date for this incremental save.
      const trackPage2ViewForDisqualified = async () => {
        const { formData: latestFormData, triggeredEvents: latestTriggeredEvents } = getLatestFormData();
        await saveFormDataIncremental(sessionId, 2, 'page2_view', {
          ...latestFormData,
          triggeredEvents: latestTriggeredEvents
        });
      };
      trackPage2ViewForDisqualified();
    }
  }, [currentStep, formData.lead_category, sessionId, getLatestFormData]);

  // Evaluation steps for regular evaluation animation
  const evaluationSteps = [
    {
      message: `Analyzing your ${formData.currentGrade === 'masters' ? 'profile and program fit' : 'academic profile and curriculum fit'}`,
      duration: 3500
    },
    {
      message: `Processing ${formData.currentGrade === 'masters' ? 'graduate admission criteria' : 'admission criteria and program compatibility'}`,
      duration: 3500
    },
    {
      message: `Connecting you with our Beacon House admission experts`,
      duration: 3500
    }
  ];

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-primary mb-4">
          Thank You for Your Interest
        </h3>
        <div className="max-w-lg text-gray-600">
          {formData.currentGrade === '7_below' ? (
            <p>We appreciate you taking the time to share your profile with us. Our admissions team shall get in touch.</p>
          ) : formData.lead_category === 'nurture' || formData.lead_category === 'masters' ? (
            <p>Thank you for providing your details. Our admissions team will review your profile and reach out within 48 hours to discuss potential pathways that match your specific needs and requirements.</p>
          ) : (formData.selectedDate && formData.selectedSlot) ? (
            <p>We've scheduled your counselling session for {formData.selectedDate} at {formData.selectedSlot}. Our team will contact you soon to confirm.</p>
          ) : (
            <p>We appreciate you taking the time to share your profile with us. Our admissions team will reach out to you within the next 24 hours.</p>
          )}
        </div>
      </div>
    );
  }

  if (isSubmitting && !showEvaluationAnimation) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-pulse text-2xl font-semibold mb-4 text-primary">
          Processing Your Application
        </div>
        <p className="text-center text-gray-600 max-w-md">
          Please wait while we securely submit your application...
        </p>
      </div>
    );
  }

  return (
    <div id="qualification-form" className="animate-fade-in">
      {/* Progress Bar */}
      <div className="text-center mb-6">
        <Progress value={getStepProgress()} className="mb-4" />
      </div>

      {/* Loading animation */}
      {showEvaluationAnimation && (
        <SequentialLoadingAnimation
          steps={evaluationSteps}
          onComplete={handleEvaluationComplete}
        />
      )}
      
      {!showEvaluationAnimation && (
        <div 
          ref={containerRef}
          className={`relative space-y-8 transition-all duration-300 ease-in-out mx-auto px-4 sm:px-8 md:px-8 ${currentStep === 2 ? 'max-w-full' : 'max-w-full md:max-w-5xl'} bg-white md:bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-100 md:p-6`}
        >
          {currentStep === 1 && (
            <InitialLeadCaptureForm
              ref={initialLeadFormRef}
              onSubmit={onSubmitPage1}
              defaultValues={formData}
            />
          )}

          {currentStep === 2 && ['bch', 'lum-l1', 'lum-l2'].includes(formData.lead_category || '') && (
            <QualifiedLeadForm
              onSubmit={onSubmitPage2A}
              onBack={() => setStep(1)}
              leadCategory={formData.lead_category as any}
              defaultValues={formData}
            />
          )}

          {currentStep === 2 && !['bch', 'lum-l1', 'lum-l2'].includes(formData.lead_category || '') && (
            <DisqualifiedLeadForm
              onSubmit={onSubmitPage2B}
              onBack={() => setStep(1)}
              leadCategory={formData.lead_category as any}
              defaultValues={formData}
            />
          )}
        </div>
      )}
    </div>
  );
}