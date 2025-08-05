/**
 * Database Debug Utility
 * 
 * Purpose: Comprehensive debugging tool to identify database connection issues
 * and test all database operations to ensure proper data flow.
 * 
 * Changes made:
 * - Created comprehensive database testing utility
 * - Added step-by-step debugging for all database operations
 * - Included environment variable validation
 * - Added network connectivity tests
 */

import { supabase } from './database';
import { debugLog, errorLog, warnLog } from './logger';

interface DebugResult {
  step: string;
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Comprehensive database debug function
 * Tests all aspects of database connectivity and operations
 */
export const runDatabaseDiagnostics = async (): Promise<DebugResult[]> => {
  const results: DebugResult[] = [];
  
  // Step 1: Check Environment Variables
  debugLog('🔍 Step 1: Checking Environment Variables...');
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const webhookUrl = import.meta.env.VITE_REGISTRATION_WEBHOOK_URL;
    const environment = import.meta.env.VITE_ENVIRONMENT;
    
    const envCheck = {
      VITE_SUPABASE_URL: supabaseUrl ? '✅ Set' : '❌ Missing',
      VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ Set' : '❌ Missing',
      VITE_REGISTRATION_WEBHOOK_URL: webhookUrl ? '✅ Set' : '❌ Missing',
      VITE_ENVIRONMENT: environment ? '✅ Set' : '❌ Missing'
    };
    
    debugLog('Environment Variables:', envCheck);
    
    const allEnvVarsSet = supabaseUrl && supabaseAnonKey && webhookUrl && environment;
    results.push({
      step: 'Environment Variables Check',
      success: allEnvVarsSet,
      error: allEnvVarsSet ? undefined : 'Some environment variables are missing',
      data: envCheck
    });
  } catch (error) {
    results.push({
      step: 'Environment Variables Check',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
  
  // Step 2: Test Basic Supabase Connection
  debugLog('🔍 Step 2: Testing Basic Supabase Connection...');
  try {
    const { data, error } = await supabase
      .from('form_sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    debugLog('✅ Basic Supabase connection successful');
    results.push({
      step: 'Basic Supabase Connection',
      success: true,
      data: data
    });
  } catch (error) {
    errorLog('❌ Basic Supabase connection failed:', error);
    results.push({
      step: 'Basic Supabase Connection',
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    });
  }
  
  // Step 3: Test Table Schema
  debugLog('🔍 Step 3: Testing Table Schema...');
  try {
    const { data, error } = await supabase
      .from('form_sessions')
      .select('*')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    debugLog('✅ Table schema accessible');
    results.push({
      step: 'Table Schema Check',
      success: true,
      data: data
    });
  } catch (error) {
    errorLog('❌ Table schema check failed:', error);
    results.push({
      step: 'Table Schema Check',
      success: false,
      error: error instanceof Error ? error.message : 'Schema check failed'
    });
  }
  
  // Step 4: Test Direct Insert
  debugLog('🔍 Step 4: Testing Direct Insert...');
  try {
    const testData = {
      session_id: `debug_test_${Date.now()}`,
      environment: 'debug',
      form_filler_type: 'parent',
      current_grade: '10',
      funnel_stage: 'test',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('form_sessions')
      .insert([testData])
      .select();
    
    if (error) {
      throw error;
    }
    
    debugLog('✅ Direct insert successful:', data);
    results.push({
      step: 'Direct Insert Test',
      success: true,
      data: data
    });
    
    // Clean up test data
    await supabase
      .from('form_sessions')
      .delete()
      .eq('session_id', testData.session_id);
      
  } catch (error) {
    errorLog('❌ Direct insert failed:', error);
    results.push({
      step: 'Direct Insert Test',
      success: false,
      error: error instanceof Error ? error.message : 'Insert failed'
    });
  }
  
  // Step 5: Test Upsert Function (if exists)
  debugLog('🔍 Step 5: Testing Upsert Function...');
  try {
    const testData = {
      session_id: `debug_upsert_${Date.now()}`,
      environment: 'debug',
      form_filler_type: 'parent',
      current_grade: '10',
      funnel_stage: 'test',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase.rpc('upsert_form_session', {
      p_form_data: testData,
      p_session_id: testData.session_id
    });
    
    if (error) {
      throw error;
    }
    
    debugLog('✅ Upsert function successful:', data);
    results.push({
      step: 'Upsert Function Test',
      success: true,
      data: data
    });
    
    // Clean up test data
    await supabase
      .from('form_sessions')
      .delete()
      .eq('session_id', testData.session_id);
      
  } catch (error) {
    errorLog('❌ Upsert function failed:', error);
    results.push({
      step: 'Upsert Function Test',
      success: false,
      error: error instanceof Error ? error.message : 'Upsert function failed or does not exist'
    });
  }
  
  // Step 6: Test Webhook URL
  debugLog('🔍 Step 6: Testing Webhook URL...');
  try {
    const webhookUrl = import.meta.env.VITE_REGISTRATION_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }
    
    const testPayload = {
      session_id: `debug_webhook_${Date.now()}`,
      environment: 'debug',
      form_filler_type: 'parent',
      current_grade: '10',
      created_at: new Date().toISOString()
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
    
    debugLog('✅ Webhook test successful');
    results.push({
      step: 'Webhook URL Test',
      success: true,
      data: { status: response.status, statusText: response.statusText }
    });
    
  } catch (error) {
    errorLog('❌ Webhook test failed:', error);
    results.push({
      step: 'Webhook URL Test',
      success: false,
      error: error instanceof Error ? error.message : 'Webhook test failed'
    });
  }
  
  // Step 7: Test Form Data Flow
  debugLog('🔍 Step 7: Testing Complete Form Data Flow...');
  try {
    const { saveFormDataIncremental } = await import('./formTracking');
    
    const testSessionId = `debug_flow_${Date.now()}`;
    const testFormData = {
      formFillerType: 'parent',
      studentName: 'Debug Test Student',
      currentGrade: '10',
      phoneNumber: '1234567890',
      curriculumType: 'CBSE',
      schoolName: 'Debug Test School',
      gradeFormat: 'percentage',
      percentageValue: '85',
      scholarshipRequirement: 'scholarship_optional',
      targetGeographies: ['US'],
      lead_category: 'debug'
    };
    
    await saveFormDataIncremental(
      testSessionId,
      1,
      'initial_capture',
      testFormData
    );
    
    // Verify the data was saved
    const { data: savedData, error } = await supabase
      .from('form_sessions')
      .select('*')
      .eq('session_id', testSessionId)
      .single();
    
    if (error) {
      throw error;
    }
    
    debugLog('✅ Complete form data flow successful:', savedData);
    results.push({
      step: 'Complete Form Data Flow',
      success: true,
      data: savedData
    });
    
    // Clean up test data
    await supabase
      .from('form_sessions')
      .delete()
      .eq('session_id', testSessionId);
      
  } catch (error) {
    errorLog('❌ Complete form data flow failed:', error);
    results.push({
      step: 'Complete Form Data Flow',
      success: false,
      error: error instanceof Error ? error.message : 'Form data flow failed'
    });
  }
  
  return results;
};

/**
 * Simple function to run diagnostics and display results in console
 */
export const debugDatabase = async (): Promise<void> => {
  debugLog('🚀 Starting Database Diagnostics...');
  
  try {
    const results = await runDatabaseDiagnostics();
    
    debugLog('📊 Database Diagnostics Results:');
    debugLog('================================');
    
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      debugLog(`${index + 1}. ${status} ${result.step}`);
      
      if (!result.success && result.error) {
        errorLog(`   Error: ${result.error}`);
      }
      
      if (result.data) {
        debugLog(`   Data:`, result.data);
      }
    });
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    debugLog('================================');
    debugLog(`📈 Summary: ${successCount}/${totalCount} tests passed`);
    
    if (successCount < totalCount) {
      errorLog('❌ Some tests failed. Please check the errors above and fix the issues.');
    } else {
      debugLog('✅ All tests passed! Database integration is working correctly.');
    }
    
  } catch (error) {
    errorLog('❌ Database diagnostics failed:', error);
  }
};

/**
 * Function to check if the current environment is properly configured
 */
export const validateEnvironment = (): boolean => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY', 
    'VITE_REGISTRATION_WEBHOOK_URL',
    'VITE_ENVIRONMENT'
  ];
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    errorLog('❌ Missing environment variables:', missing);
    return false;
  }
  
  debugLog('✅ All required environment variables are present');
  return true;
};