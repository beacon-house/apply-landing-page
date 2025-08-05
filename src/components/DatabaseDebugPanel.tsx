/**
 * Database Debug Panel Component
 * 
 * Purpose: UI component to run database diagnostics and display results.
 * Shows detailed information about database connectivity and form submission issues.
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { debugDatabase, runDatabaseDiagnostics, validateEnvironment } from '../lib/databaseDebug';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface DebugResult {
  step: string;
  success: boolean;
  error?: string;
  data?: any;
}

export function DatabaseDebugPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DebugResult[]>([]);
  const [showDetails, setShowDetails] = useState<Record<number, boolean>>({});

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      // First validate environment
      const envValid = validateEnvironment();
      if (!envValid) {
        console.error('Environment validation failed');
      }
      
      // Run diagnostics
      const diagnosticResults = await runDatabaseDiagnostics();
      setResults(diagnosticResults);
      
      // Also log to console for debugging
      await debugDatabase();
      
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleDetails = (index: number) => {
    setShowDetails(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          Database Diagnostics
        </CardTitle>
        <p className="text-sm text-gray-600">
          Run comprehensive tests to identify database connection and form submission issues.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRunning ? 'Running Diagnostics...' : 'Run Database Diagnostics'}
          </Button>
          
          {results.length > 0 && (
            <div className="text-sm">
              <span className={`font-medium ${successCount === totalCount ? 'text-green-600' : 'text-red-600'}`}>
                {successCount}/{totalCount} tests passed
              </span>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Test Results:</h3>
            
            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {index + 1}. {result.step}
                    </span>
                  </div>
                  
                  {(result.error || result.data) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDetails(index)}
                    >
                      {showDetails[index] ? 'Hide Details' : 'Show Details'}
                    </Button>
                  )}
                </div>
                
                {showDetails[index] && (
                  <div className="mt-3 pl-8 space-y-2">
                    {result.error && (
                      <div className="text-sm text-red-700">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                    
                    {result.data && (
                      <div className="text-sm text-gray-700">
                        <strong>Data:</strong>
                        <pre className="mt-1 bg-white p-2 rounded border text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && successCount < totalCount && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Common Issues & Solutions:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Check that all environment variables are set correctly in Netlify</li>
              <li>• Ensure Supabase URL and keys are correct and not using placeholder values</li>
              <li>• Verify that the Supabase project is active and the database table exists</li>
              <li>• Check if the upsert_form_session function exists in your Supabase database</li>
              <li>• Verify that webhook URL is accessible and responds correctly</li>
              <li>• Ensure CORS is configured properly in Supabase</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}