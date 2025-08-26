/**
 * Header Component
 * 
 * Purpose: Navigation header with logo and CTA button.
* Features responsive design with sticky CTA for mobile/tablet.
 * 
 * Changes made:
* - Added responsive sticky CTA button for mobile/tablet
* - Implemented scroll detection for CTA visibility
* - Logo-only display for mobile/tablet screens
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormStore } from '@/store/formStore';
import { fireCTAClickEvent } from '@/lib/metaPixelEvents';

interface HeaderProps {
  showCTA?: boolean;
}

export function Header({ showCTA = true }: HeaderProps) {
  const navigate = useNavigate();
  const { addTriggeredEvents } = useFormStore();
  const [showMobileStickyCTA, setShowMobileStickyCTA] = useState(false);
  const [showHeaderCTA, setShowHeaderCTA] = useState(false);
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);

  const handleCTAClick = () => {
    // Fire Header CTA event
    const ctaEvents = fireCTAClickEvent('header');
    addTriggeredEvents(ctaEvents);
    
    navigate('/application-form');
  };

  // Scroll detection for CTA visibility logic
  useEffect(() => {
    const handleScroll = () => {
      // Get hero CTA button position
      const heroCTA = document.querySelector('.hero-cta');
      if (heroCTA) {
        const heroRect = heroCTA.getBoundingClientRect();
        const hasPassedHero = heroRect.bottom < 0;
        
        const isMobile = window.innerWidth < 577; // Mobile breakpoint
        const isTabletOrDesktop = window.innerWidth >= 577; // Tablet and desktop
        
        if (hasPassedHero && !hasScrolledPastHero) {
          setHasScrolledPastHero(true);
        }
        
        // Mobile: Show sticky CTA after scroll
        setShowMobileStickyCTA(hasPassedHero && isMobile && showCTA);
        
        // Tablet & Desktop: Show header CTA after scroll
        setShowHeaderCTA(hasPassedHero && isTabletOrDesktop && showCTA);
      }
    };

    // Throttle scroll events for performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    // Also check on resize
    window.addEventListener('resize', handleScroll);
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [showCTA, hasScrolledPastHero]);
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/bh ig logo.png" 
              alt="Beacon House" 
                className="h-8 w-auto sm:h-10 md:h-12"
            />
          </div>
          
          {/* Navigation Menu - Hidden on mobile, visible on tablet/desktop */}
          <nav className="hidden sm:flex items-center space-x-8">
            <a 
              href="#why-us" 
              className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('why-us')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Why Us
            </a>
            <a 
              href="#success-rates" 
              className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('success-rates')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Our Results
            </a>
            <a 
              href="#process" 
              className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Our Blueprint
            </a>
            <a 
              href="#services" 
              className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              What We Do
            </a>
          </nav>

            {/* CTA Button - Hidden on mobile/tablet, shown on desktop */}
          {showCTA && (
            <button
             onClick={handleCTAClick}
              className={`hidden sm:${showHeaderCTA ? 'block' : 'hidden'} bg-accent text-primary px-6 py-2 rounded-lg font-semibold hover:bg-accent-light transition-all duration-300 shadow-md hover:shadow-lg text-sm md:text-base`}
            >
              Request an Evaluation
            </button>
          )}
        </div>
      </div>
      </header>

      {/* Sticky CTA Button for Mobile Only */}
      {showMobileStickyCTA && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 p-3 sm:hidden animate-slide-down">
          <div className="max-w-7xl mx-auto px-4">
            <button
              onClick={handleCTAClick}
              className="w-full bg-accent text-primary py-3 rounded-lg font-bold hover:bg-accent-light transition-all duration-300 shadow-md hover:shadow-lg text-base"
            >
              Request an Evaluation
            </button>
          </div>
        </div>
      )}
    </>
  );
}