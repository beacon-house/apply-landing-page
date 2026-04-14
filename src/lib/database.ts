/**
 * Database Connection Utility
 *
 * Purpose: Provides database connection and query utilities using Supabase PostgreSQL.
 * Supabase is optional: missing or placeholder env yields a null client so the app can
 * boot for local UI work without touching a database.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { debugLog, errorLog } from '@/lib/logger';

const PLACEHOLDER_URL = 'https://your-project.supabase.co';
const PLACEHOLDER_KEY = 'your-anon-key';

function createSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    debugLog(
      'Supabase disabled: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is unset; funnel DB writes are skipped.'
    );
    return null;
  }

  if (supabaseUrl === PLACEHOLDER_URL || supabaseAnonKey === PLACEHOLDER_KEY) {
    debugLog('Supabase disabled: env matches template placeholders; funnel DB writes are skipped.');
    return null;
  }

  const isLegacyKey = supabaseAnonKey.startsWith('eyJ');
  const isPublishableKey = supabaseAnonKey.startsWith('sb_publishable_');

  if (!isLegacyKey && !isPublishableKey) {
    debugLog('⚠️ API key format warning: Key does not match expected format (legacy anon or publishable key)');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/** Null when Supabase env is missing or placeholder; otherwise the shared client. */
export const supabase: SupabaseClient | null = createSupabaseClient();

/**
 * Test database connection
 * @returns Promise<boolean> - Returns true if connection is successful
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  if (!supabase) {
    return false;
  }
  try {
    const { error } = await supabase
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
  if (!supabase) {
    return {
      connected: false,
      timestamp: new Date().toISOString()
    };
  }
  try {
    const { data, error } = await supabase.rpc('get_database_info');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    errorLog('Failed to get database info:', error);
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
    if (!supabase) {
      return {
        connected: false,
        error: 'Supabase is not configured'
      };
    }

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
  if (!supabase) {
    const err = new Error('Supabase is not configured');
    errorLog('insertFormSession:', err.message);
    throw err;
  }
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
