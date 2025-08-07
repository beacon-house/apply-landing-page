/**
 * Database Connection Utility
 * 
 * Purpose: Provides database connection and query utilities using Supabase PostgreSQL.
 * This module handles database connections using environment variables and provides helper functions
 * for database operations.
 * 
 * Changes made:
 * - Switched from Neon to Supabase connection
 * - Updated environment variable configuration
 * - Maintained all existing functionality
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { debugLog, errorLog } from '@/lib/logger';

// Initialize the Supabase client
const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL environment variable is not configured');
  }
  
  if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY environment variable is not configured');
  }
  
  if (supabaseUrl === 'https://your-project.supabase.co') {
    throw new Error('Please configure your actual Supabase URL in VITE_SUPABASE_URL');
  }
  
  if (supabaseAnonKey === 'your-anon-key') {
    throw new Error('Please configure your actual Supabase anon key in VITE_SUPABASE_ANON_KEY');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Get Supabase client instance
export const supabase = getSupabaseClient();

/**
 * Test database connection
 * @returns Promise<boolean> - Returns true if connection is successful
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from('form_sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      errorLog('Database connection test failed:', error);
      return false;
    }
    
    debugLog('Database connection successful');
    return true;
  } catch (error) {
    errorLog('Database connection failed:', error);
    return false;
  }
};

/**
 * Execute a simple health check query
 * @returns Promise<any> - Database version and current timestamp
 */
export const getDatabaseInfo = async () => {
  try {
    // Use Supabase RPC for database info
    const { data, error } = await supabase.rpc('get_database_info');
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    errorLog('Failed to get database info:', error);
    // Fallback to simple connection test
    const isConnected = await testDatabaseConnection();
    return {
      connected: isConnected,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Check if database is accessible and ready
 * @returns Promise<{connected: boolean, info?: any, error?: string}>
 */
export const checkDatabaseHealth = async () => {
  try {
    const isConnected = await testDatabaseConnection();
    
    if (isConnected) {
      const info = await getDatabaseInfo();
      return {
        connected: true,
        info
      };
    } else {
      return {
        connected: false,
        error: 'Connection test failed'
      };
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Insert data into form_sessions table
 * @param data - Form tracking data
 * @returns Promise<any> - Insert result
 */
export const insertFormSession = async (data: any) => {
  try {
    const { data: result, error } = await supabase
      .from('form_sessions')
      .insert([data])
      .select();
    
    if (error) {
      throw error;
    }
    
    return result;
  } catch (error) {
    errorLog('Failed to insert form session:', error);
    throw error;
  }
};

/**
 * Test the upsert function
 * @returns Promise<boolean> - Returns true if upsert function works
 */
export const testUpsertFunction = async (): Promise<boolean> => {
  try {
    const testData = {
      session_id: `test_${Date.now()}`,
      environment: 'test',
      form_filler_type: 'parent',
      current_grade: '10',
      funnel_stage: 'test', // Note: 'test' is used specifically for testing purposes and should not appear in regular production data
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.rpc('upsert_form_session', {
      p_form_data: testData,
      p_session_id: testData.session_id
    });

    if (error) {
      errorLog('Upsert function test failed:', error);
      return false;
    }

    debugLog('✅ Upsert function test successful');
    
    // Clean up test data
    await supabase
      .from('form_sessions')
      .delete()
      .eq('session_id', testData.session_id);
      
    return true;
  } catch (error) {
    errorLog('Upsert function test error:', error);
    return false;
  }
};