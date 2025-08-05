/**
 * Header Component
 * 
 * Purpose: Navigation header with logo and CTA button.
 * Features responsive design.
 * 
 * Changes made:
 * - Removed CAPI and Meta Pixel event tracking
 * - Simplified to basic navigation functionality
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  showCTA?: boolean;
}

export function Header({ showCTA = true }: HeaderProps) {
  const navigate = useNavigate();

  const handleCTAClick = () => {
    navigate('/application-form');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/bh ig logo.png" 
              alt="Beacon House" 
              className="h-12 w-auto"
            />
          </div>

          {/* CTA Button */}
          {showCTA && (
            <button
              onClick={handleCTAClick}
              className="bg-accent text-primary px-6 py-2 rounded-lg font-semibold hover:bg-accent-light transition-all duration-300 shadow-md hover:shadow-lg text-sm md:text-base"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </header>
  );
}