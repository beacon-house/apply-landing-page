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

interface HeaderProps {
  showCTA?: boolean;
}

export function Header({ showCTA = true }: HeaderProps) {
  const navigate = useNavigate();
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);

  const handleCTAClick = () => {
    navigate('/application-form');
  };

  // Scroll detection for sticky CTA button
  useEffect(() => {
    const handleScroll = () => {
      // Get hero CTA button position
      const heroCTA = document.querySelector('.hero-cta');
      if (heroCTA) {
        const heroRect = heroCTA.getBoundingClientRect();
        const hasPassedHero = heroRect.bottom < 0;
        
        // Only show sticky CTA after scrolling past hero and on mobile/tablet
        const isMobileTablet = window.innerWidth < 1025; // Using md breakpoint
        
        if (hasPassedHero && !hasScrolledPastHero) {
          setHasScrolledPastHero(true);
        }
        
        setShowStickyCTA(hasPassedHero && isMobileTablet && showCTA);
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
            {/* CTA Button - Hidden on mobile/tablet, shown on desktop */}
          {showCTA && (
            <button
             onClick={handleCTAClick}
                className="hidden md:block bg-accent text-primary px-6 py-2 rounded-lg font-semibold hover:bg-accent-light transition-all duration-300 shadow-md hover:shadow-lg text-sm md:text-base"
             className="hidden md:block bg-accent text-primary px-6 py-2 rounded-lg font-semibold hover:bg-accent-light transition-all duration-300 shadow-md hover:shadow-lg text-sm md:text-base"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
      </header>

      {/* Sticky CTA Button for Mobile/Tablet */}
      {showStickyCTA && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 p-3 md:hidden animate-slide-down">
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