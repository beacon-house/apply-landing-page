/**
 * Debug Page Component
 * 
 * Purpose: Standalone page for debugging database and form submission issues.
 * Useful for troubleshooting deployment problems.
 */

import React from 'react';
import { DatabaseDebugPanel } from './DatabaseDebugPanel';
import { Header } from './Header';

export function DebugPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showCTA={false} />
      
      <main className="flex-grow pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-4">Database Diagnostics</h1>
            <p className="text-gray-600">
              Use this page to debug database connectivity and form submission issues. 
              This is especially useful when forms are not saving data to the database.
            </p>
          </div>
          
          <DatabaseDebugPanel />
          
          <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Current Environment:</strong> {import.meta.env.VITE_ENVIRONMENT || 'Not Set'}
              </div>
              <div>
                <strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set'}
              </div>
              <div>
                <strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set'}
              </div>
              <div>
                <strong>Webhook URL:</strong> {import.meta.env.VITE_REGISTRATION_WEBHOOK_URL ? 'Set' : 'Not Set'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}