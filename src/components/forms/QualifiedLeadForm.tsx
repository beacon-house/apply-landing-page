/**
 * Qualified Lead Form Component (Page 2A) - Optimized for Mobile
 * 
 * Purpose: Handles counseling booking for qualified leads with optimized UX to reduce drop-offs.
 * Features sticky submit button, validation error focusing, and mobile-first design.
 * 
 * Changes made:
 * - Implemented consistent sticky submit button behavior like Page 1
 * - Added validation error focusing with field highlighting
 * - Centralized form utilities for consistent UX
 * - Always-active submit button with proper error handling
 */

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Calendar, Award, ChevronRight, Clock, Linkedin, ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '@/lib/utils';
import { qualifiedLeadSchema } from '@/schemas/form';
import { QualifiedLeadData, LeadCategory } from '@/types/form';
import { trackFormSection } from '@/lib/formTracking';
import { useFormStore } from '@/store/formStore';
import type { BookingFailureContext } from '@/types/form';
import { getFirstErrorField, focusField } from '@/lib/formUtils';
import { debugLog, errorLog, warnLog } from '@/lib/logger';
import { fireEmailCapturedEvent, fireTamParentLevel2Event } from '@/lib/metaPixelEvents';
import { fireGA4EmailCapturedEvent, fireGA4TamParentLevel2Event } from '@/lib/ga4Events';
import { scheduleDebouncedZohoUpdate } from '@/lib/zoho';

// Define the correct field order for validation error focusing
const FIELD_ORDER: (keyof QualifiedLeadData)[] = [
  'selectedDate',
  'selectedSlot', 
  'parentName',
  'email'
];

interface QualifiedLeadFormProps {
  onSubmit: (data: QualifiedLeadData) => void;
  onBack: () => void;
  leadCategory: LeadCategory;
  defaultValues?: Partial<QualifiedLeadData> & { studentName?: string };
}

// Define a slot interface with availability
interface TimeSlot {
  time: string;
  available: boolean;
  status: "available" | "booked";
}

interface AvailabilitySlot {
  label: string;
  startIso: string;
  endIso: string;
  status: "available" | "booked";
}

export function QualifiedLeadForm({ onSubmit, onBack, leadCategory, defaultValues }: QualifiedLeadFormProps) {
  const { sessionId, formData: storeFormData, triggeredEvents, zohoLeadId, setBookingFailureContext, isSubmitted: isFormSubmitted } = useFormStore();

  // All qualified leads (bch, lum-l1, lum-l2) route to Viswanathan
  const isBCH = ['bch', 'lum-l1', 'lum-l2'].includes(leadCategory);
  const counselorName = "Viswanathan Ramakrishnan";
  const counselorImage = "/vishy.png";
  const counselorTitle = "Managing Partner";
  const linkedinUrl = "https://www.linkedin.com/in/viswanathan-r-8504182/";

  const counselorBio = "IIT-IIM alum with 20+ yrs in education - built Manipal schools, founded Magic Crate (acquired by BYJU'S). Dedicated to helping your child thrive in tomorrow's world.";

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showStickyButton] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasEmailCaptureEventFired, setHasEmailCaptureEventFired] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotErrorMessage, setSlotErrorMessage] = useState<string | null>(null);
  const [usedFallbackSlots, setUsedFallbackSlots] = useState(false);

  // Prevent incremental tracking after form submission to avoid stale "didnotsubmit" overwrites
  const submissionStartedRef = React.useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
    getValues
  } = useForm<QualifiedLeadData>({
    resolver: zodResolver(qualifiedLeadSchema),
    defaultValues
  });

  const selectedSlot = watch('selectedSlot');
  const parentName = watch('parentName');
  const email = watch('email');
  const formSelectedDate = watch('selectedDate');

  // Check if form is ready for submission — slot must be available
  const selectedSlotAvailable = availabilitySlots.find((s) => s.label === selectedSlot)?.status === "available";
  const isFormReady = selectedSlot && selectedSlotAvailable && parentName && email;

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate the 7-day calendar starting from today
  useEffect(() => {
    const today = new Date();
    const nextSevenDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date;
    });
    
    setCalendarDates(nextSevenDays);
    
    // Default to selecting today and register it with React Hook Form
    setSelectedDate(today);
    
    // Format the date and register it with the form
    const formattedDate = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    setValue('selectedDate', formattedDate);
  }, []);

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getStaticFallbackSlots = (date: Date): AvailabilitySlot[] => {
    const dayOfWeek = date.getDay();
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const minHour = isToday ? currentHour + 2 : 10;
    const slots: AvailabilitySlot[] = [];

    const hourRanges: { start: number; end: number }[] = [];
    let isOffDay = false;

    if (isBCH) {
      if (dayOfWeek === 1) {
        // Monday — off day for Vishy, but show slots as all booked
        isOffDay = true;
        hourRanges.push({ start: 11, end: 19 });
      } else if (dayOfWeek === 0) {
        hourRanges.push({ start: 11, end: 15 });
      } else {
        hourRanges.push({ start: 11, end: 19 });
      }
    } else {
      if (dayOfWeek === 0) {
        // Sunday — off day for Karthik, but show slots as all booked
        isOffDay = true;
        hourRanges.push({ start: 11, end: 13 }, { start: 16, end: 19 });
      } else {
        hourRanges.push({ start: 11, end: 13 }, { start: 16, end: 19 });
      }
    }

    for (const range of hourRanges) {
      for (let hour = range.start; hour <= range.end; hour++) {
        if (hour === 14) continue; // Skip 2 PM
        if (isToday && hour < minHour) continue;
        const label = hour === 12 ? "12 PM" : (hour > 12 ? `${hour - 12} PM` : `${hour} AM`);
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
        slots.push({
          label,
          startIso: slotStart.toISOString(),
          endIso: slotEnd.toISOString(),
          status: isOffDay ? "booked" : "available",
        });
      }
    }

    return slots;
  };

  const fetchAvailabilitySlots = async (date: Date) => {
    setIsLoadingSlots(true);
    setSlotErrorMessage(null);
    setUsedFallbackSlots(false);

    const dateKey = formatDateKey(date);
    const failureContext: BookingFailureContext = {
      failureType: null,
      failureReason: null,
      lastAttemptedDate: dateKey,
      lastAttemptedSlot: null,
    };

    try {
      const response = await fetch('/.netlify/functions/gcal-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadCategory,
          date: dateKey
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to load slots: ${response.status}`);
      }

      const payload = await response.json();
      const slots: AvailabilitySlot[] = Array.isArray(payload?.slots) ? payload.slots : [];
      setAvailabilitySlots(slots);

      const hasAvailableSlots = slots.some((s) => s.status === "available");

      if (!hasAvailableSlots && slots.length > 0) {
        // All slots are booked — this is fine, just show the "booked" UI
        // No failure context needed — the user can see the schedule and pick another date
        failureContext.failureType = 'no_slots_available';
        failureContext.failureReason = 'All candidate slots are booked for this day';
      } else if (slots.length === 0) {
        // No slots at all (date out of range, etc.) — use static fallback
        const fallback = getStaticFallbackSlots(date);
        setAvailabilitySlots(fallback);
        setUsedFallbackSlots(true);
        setSlotErrorMessage("We couldn't confirm live availability for this day. Please pick your preferred time, and our team will confirm with you within a few hours.");
        failureContext.failureType = 'no_slots_available';
        failureContext.failureReason = 'Google Calendar returned no candidate slots; using static fallback';
      } else {
        // Some slots available — clear failure context
        failureContext.failureType = null;
        failureContext.failureReason = null;
      }

      if (selectedSlot && !slots.some((slot) => slot.label === selectedSlot && slot.status === "available")) {
        setValue('selectedSlot', '');
      }

      setBookingFailureContext(failureContext);
    } catch (error) {
      errorLog('❌ Failed to fetch counselor availability:', error);
      // Fallback to static slot rules
      const fallback = getStaticFallbackSlots(date);
      setAvailabilitySlots(fallback);
      setUsedFallbackSlots(true);
      setSlotErrorMessage("We're having trouble checking live availability. Please pick your preferred date and time, and our team will confirm with you within a few hours.");
      failureContext.failureType = 'availability_fetch_failed';
      failureContext.failureReason = error instanceof Error ? error.message : 'Unknown error fetching availability';
      setBookingFailureContext(failureContext);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const timeSlots: TimeSlot[] = availabilitySlots.map((slot) => ({
    time: slot.label,
    available: slot.status === "available",
    status: slot.status,
  }));

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    void fetchAvailabilitySlots(selectedDate);
  }, [selectedDate, leadCategory]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setValue('selectedSlot', '');

    if (date) {
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setValue('selectedDate', formattedDate);
    }
  };

  const handleTimeSlotSelect = (slot: string) => {
    setValue('selectedSlot', slot);
    // Update failure context with the slot the user actually picked
    const currentFailure = useFormStore.getState().bookingFailureContext;
    if (currentFailure.failureType) {
      setBookingFailureContext({
        ...currentFailure,
        lastAttemptedSlot: slot,
      });
    }
  };

  // Track form sections as user completes them
  // Guard: skip incremental saves once submission has started to prevent
  // stale "didnotsubmit" overwrites after the final webhook is sent
  const trackSectionCompletion = async (sectionName: string, sectionData: any) => {
    if (submissionStartedRef.current || isFormSubmitted) return;
    try {
      const snapshotFormData = { ...storeFormData, ...sectionData, triggeredEvents };
      await trackFormSection(sessionId, sectionName, 2, snapshotFormData);
    } catch (error) {
      console.error('Section tracking error:', error);
    }
  };

  // Track counseling slot selection
  React.useEffect(() => {
    if (formSelectedDate && selectedSlot) {
      trackSectionCompletion('counseling_slot_selected', {
        selectedDate: formSelectedDate,
        selectedSlot,
        counselorName,
        leadCategory,
        sessionId
      });
    }
  }, [formSelectedDate, selectedSlot, counselorName, leadCategory, sessionId]);

  // Track parent details completion
  React.useEffect(() => {
    if (parentName && email) {
      trackSectionCompletion('contact_details_entered', {
        parentName,
        email,
        sessionId
      });
    }
  }, [parentName, email, sessionId]);

  // Debounced incremental Zoho update on key field changes
  React.useEffect(() => {
    if (submissionStartedRef.current || isFormSubmitted) return;
    if (!zohoLeadId) return;

    // Only trigger when user has actually filled something meaningful
    const hasMeaningfulData = selectedSlot || parentName || email;
    if (!hasMeaningfulData) return;

    const incrementalData = {
      ...storeFormData,
      selected_date: formSelectedDate || undefined,
      selected_slot: selectedSlot || undefined,
      parent_name: parentName || undefined,
      parent_email: email || undefined,
      lead_category: leadCategory,
    };

    scheduleDebouncedZohoUpdate(incrementalData, zohoLeadId, 3000);
  }, [formSelectedDate, selectedSlot, parentName, email, zohoLeadId, leadCategory, storeFormData, isFormSubmitted]);

  // Fire email captured event when user leaves email field with valid data
  const handleEmailBlur = () => {
    const emailValue = getValues('email');
    const parentNameValue = getValues('parentName');

    // Validate email format
    const isValidEmail = emailValue?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    if (isValidEmail && !hasEmailCaptureEventFired) {
      fireEmailCapturedEvent({
        email: emailValue,
        parentName: parentNameValue || undefined,
        // Include phone from store (collected on Page 1)
        phoneNumber: storeFormData.phoneNumber,
        countryCode: storeFormData.countryCode
      });
      fireGA4EmailCapturedEvent();

      // Fire TAM parent level2 event — non-spam TAM parent entered email on Page 2A (DT-001)
      const level2Events = fireTamParentLevel2Event({
        ...storeFormData,
        email: emailValue,
        parentName: parentNameValue || undefined,
      });
      fireGA4TamParentLevel2Event({
        ...storeFormData,
        email: emailValue,
        parentName: parentNameValue || undefined,
      });
      if (level2Events.length > 0) {
        debugLog('🎯 TAM parent level2 event fired:', { email: emailValue });
      }

      setHasEmailCaptureEventFired(true);
      debugLog('📧 Email captured event fired:', { email: emailValue, parentName: parentNameValue });
    }
  };

  const handleBack = () => {
    window.scrollTo(0, 0);
    onBack();
  };

  // Enhanced form submission handler with proper error handling
  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (isSubmitting) {
      debugLog('⏳ Form already submitting, ignoring duplicate submission');
      return;
    }
    
    debugLog('🚀 Page 2A form submission initiated');
    submissionStartedRef.current = true; // Block further incremental tracking
    setIsSubmitting(true);
    
    try {
      // Validate the form first
      const result = await handleSubmit(async (data) => {
        debugLog('✅ Page 2A form validation passed, submitting data');

        window.scrollTo(0, 0);
        await onSubmit(data);
      }, async (errors) => {
        debugLog('❌ Page 2A form validation failed with errors:', errors);
        
        // Get error field names
        const errorFields = Object.keys(errors);
        
        if (errorFields.length > 0) {
          // Find the first error field in the correct order
          const firstErrorField = getFirstErrorField<QualifiedLeadData>(errorFields, FIELD_ORDER);
          
          if (firstErrorField) {
            debugLog('🎯 Focusing on first error field:', firstErrorField);
            
            // Use a longer delay to ensure DOM is ready and stable
            setTimeout(async () => {
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
        debugLog('🛑 Page 2A form submission stopped due to validation errors');
      }
      
    } catch (error) {
     errorLog('❌ Unexpected error during Page 2A form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' })
    };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="relative">
      {/* Back Button - Top Left */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Shortened Header for Mobile */}
        <div className="text-center space-y-4 mb-8">
          {/* Mobile - Very Short Message */}
          <div className="block md:hidden">
            <h3 className="text-xl font-bold text-primary">
              {defaultValues?.studentName ? `Great news about ${defaultValues.studentName.split(' ')[0]}! 🎉` : 'Congratulations! 🎉'}
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {defaultValues?.studentName 
                ? `${defaultValues.studentName.split(' ')[0]} has a strong potential for elite university admissions! Book a strategy session with our Managing Partner.`
                : 'You have a strong potential for elite university admissions! Book a strategy session with our Managing Partner.'
              }
            </p>
          </div>
          
          {/* Desktop - Full Message */}
          <div className="hidden md:block max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-primary mb-3">
              {defaultValues?.studentName ? `Great news about ${defaultValues.studentName.split(' ')[0]}! 🎉` : 'Congratulations! 🎉'}
            </h3>
            <p className="text-gray-700 text-base leading-relaxed">
              {defaultValues?.studentName 
                ? `${defaultValues.studentName.split(' ')[0]} has a strong potential for elite university admissions! Book a strategy session with our Managing Partner.`
                : `You have a strong potential for elite university admissions! Book a strategy session with our Managing Partner.`
              }
            </p>
          </div>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          void handleFormSubmit();
        }}>
          {/* Mobile Layout */}
          {isMobile ? (
            <>
              {/* Counselor Profile - Mobile */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 shadow-md border border-primary/10 mb-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={counselorImage} 
                      alt={counselorName} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-accent text-primary p-1 rounded-full shadow-sm">
                      <Award className="w-3 h-3" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <h4 className="text-lg font-bold text-primary">{counselorName}</h4>
                      <a 
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-sm font-medium text-primary/80">{counselorTitle}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{counselorBio}</p>
                  </div>
                </div>
              </div>

              {/* Slot Selection - Mobile */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                <h4 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Select Your Session
                </h4>
                
                <div className="space-y-4">
                  {/* Date Selection */}
                  <div>
                    <Label className="text-base font-medium text-gray-700 mb-3 block">
                      Choose Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDates.map((date, index) => {
                        const { day, date: dateNum, month } = formatDateDisplay(date);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleDateSelect(date)}
                            className={cn(
                              "flex flex-col items-center justify-center p-1 rounded-lg border-2 transition-all text-xs",
                              selectedDate && date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth()
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-gray-300",
                              isToday(date) && "ring-1 ring-accent/30"
                            )}
                            data-field="selectedDate"
                          >
                            <span className="font-semibold">{day}</span>
                            <span className="text-sm font-bold">{dateNum}</span>
                            <span className="text-xs">{month}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.selectedDate && (
                      <p className="text-sm text-red-500 italic mt-2">Please select a date</p>
                    )}
                    {slotErrorMessage && (
                      <p className="text-sm text-amber-600 mt-2">{slotErrorMessage}</p>
                    )}
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      <Label className="text-base font-medium text-gray-700 mb-3 block">
                        Choose Time <span className="text-red-500">*</span>
                      </Label>
                      {isLoadingSlots ? (
                        <p className="text-sm text-gray-500 text-center py-4">Loading available slots...</p>
                      ) : timeSlots.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No slots available for this day</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((slot, index) => (
                            <button
                              key={index}
                              type="button"
                              disabled={slot.status === "booked"}
                              onClick={() => {
                                if (slot.status === "available") {
                                  setValue('selectedSlot', slot.time);
                                  handleTimeSlotSelect(slot.time);
                                }
                              }}
                              className={cn(
                                "p-2 rounded-lg border-2 text-xs font-medium transition-all relative",
                                slot.status === "booked"
                                  ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                                  : selectedSlot === slot.time
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              )}
                              data-field="selectedSlot"
                            >
                              {slot.time}
                              {slot.status === "booked" && (
                                <span className="block text-[10px] text-gray-300 font-normal mt-0.5">Booked</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {errors.selectedSlot && (
                        <p className="text-sm text-red-500 italic mt-2">Please select a time slot</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information - Mobile */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                <h4 className="text-lg font-medium text-primary mb-4">Parent Details</h4>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">Parent's Name <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Enter parent's full name"
                      id="parentName"
                      {...register('parentName')}
                      className={cn(
                        "h-12 bg-white",
                        errors.parentName ? 'border-red-500 focus:border-red-500' : ''
                      )}
                      data-field="parentName"
                    />
                    {errors.parentName && (
                      <p className="text-sm text-red-500 italic">Please answer this question</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Parent's Email <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Enter parent's email address"
                      id="email"
                      type="email"
                      {...register('email')}
                      onBlur={handleEmailBlur}
                      className={cn(
                        "h-12 bg-white",
                        errors.email ? 'border-red-500 focus:border-red-500' : ''
                      )}
                      data-field="email"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 italic">Please enter a valid email address</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Desktop Layout - Compact Rounded Rectangle */
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Top Section: Counselor Profile */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b border-gray-100">
                <div className="flex items-center space-x-6">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={counselorImage} 
                      alt={counselorName} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-accent text-primary p-1 rounded-full shadow-sm">
                      <Award className="w-3 h-3" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xl font-bold text-primary">{counselorName}</h4>
                      <a 
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-sm font-medium text-primary/80 mb-2">{counselorTitle}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{counselorBio}</p>
                  </div>
                </div>
              </div>
              
              {/* Middle Section: Date and Time Selection */}
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Select Your Session
                </h4>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Date Selection */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Choose Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDates.map((date, index) => {
                        const { day, date: dateNum, month } = formatDateDisplay(date);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleDateSelect(date)}
                            className={cn(
                              "flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all text-xs",
                              selectedDate && date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth()
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-gray-300",
                              isToday(date) && "ring-2 ring-accent/30"
                            )}
                            data-field="selectedDate"
                          >
                            <span className="font-semibold">{day}</span>
                            <span className="text-sm font-bold">{dateNum}</span>
                            <span className="text-xs">{month}</span>
                            {isToday(date) && <span className="text-xs bg-accent text-primary px-1 rounded mt-0.5">Today</span>}
                          </button>
                        );
                      })}
                    </div>
                    {errors.selectedDate && (
                      <p className="text-sm text-red-500 italic mt-2">Please select a date</p>
                    )}
                    {slotErrorMessage && (
                      <p className="text-sm text-amber-600 mt-2">{slotErrorMessage}</p>
                    )}
                  </div>

                  {/* Time Selection */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Available Times <span className="text-red-500">*</span>
                    </Label>
                    {!selectedDate ? (
                      <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Please select a date first</p>
                    ) : isLoadingSlots ? (
                      <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Loading available slots...</p>
                    ) : timeSlots.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No slots available</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot, index) => (
                          <button
                            key={index}
                            type="button"
                            disabled={slot.status === "booked"}
                            onClick={() => {
                              if (slot.status === "available") {
                                setValue('selectedSlot', slot.time);
                                handleTimeSlotSelect(slot.time);
                              }
                            }}
                            className={cn(
                              "p-2 rounded-lg border-2 text-xs font-medium transition-all relative",
                              slot.status === "booked"
                                ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                                : selectedSlot === slot.time
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            )}
                            data-field="selectedSlot"
                          >
                            {slot.time}
                            {slot.status === "booked" && (
                              <span className="block text-[10px] text-gray-300 font-normal mt-0.5">Booked</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.selectedSlot && (
                      <p className="text-sm text-red-500 italic mt-2">Please select a time slot</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Bottom Section: Contact Information */}
              <div className="p-6">
                <h4 className="text-lg font-medium text-primary mb-4">Parent Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">Parent's Name <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Enter parent's full name"
                      id="parentName"
                      {...register('parentName')}
                      className={cn(
                        "h-12 bg-white",
                        errors.parentName ? 'border-red-500 focus:border-red-500' : ''
                      )}
                      data-field="parentName"
                    />
                    {errors.parentName && (
                      <p className="text-sm text-red-500 italic">Please answer this question</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Parent's Email <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Enter parent's email address"
                      id="email"
                      type="email"
                      {...register('email')}
                      onBlur={handleEmailBlur}
                      className={cn(
                        "h-12 bg-white",
                        errors.email ? 'border-red-500 focus:border-red-500' : ''
                      )}
                      data-field="email"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 italic">Please enter a valid email address</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Sticky Submit Button - Shows after scroll (consistent with Page 1) */}
      {showStickyButton && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg animate-slide-up">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleFormSubmit}
              disabled={!isFormReady || isSubmitting}
              className={cn(
                "w-full py-4 rounded-lg text-base md:text-lg font-bold transition-all duration-300 shadow-md flex items-center justify-center space-x-2",
                isFormReady 
                  ? "bg-accent text-primary hover:bg-accent-light hover:shadow-lg" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <span>
                {!isFormReady 
                  ? "Fill in all details to continue" 
                  : isSubmitting 
                  ? "Submitting..." 
                  : "Submit Application"
                }
              </span>
              {isFormReady && !isSubmitting && <ChevronRight className="w-5 h-5" />}
            </button>
            
            {/* Progress hint */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-600">
                Step 2 of 2 • Almost done!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Add bottom padding when sticky button is visible */}
      {showStickyButton && <div className="h-24" />}
    </div>
  );
}