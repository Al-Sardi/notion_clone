"use client";

import { createClient, SupabaseClient, AuthFlowType } from "@supabase/supabase-js";
import { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

// Debug logging
console.log("Supabase Environment Variables:", {
  hasUrl: !!supabaseUrl,
  urlPrefix: supabaseUrl?.substring(0, 8),
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey?.substring(0, 8)
});

if (!supabaseUrl || !supabaseAnonKey) {
  const error = new Error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
  console.error(error.message, {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseAnonKey?.length
  });
  throw error;
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  const error = new Error(
    "Invalid Supabase URL format. URL should start with 'https://' and contain '.supabase.co'"
  );
  console.error(error.message, {
    url: supabaseUrl?.substring(0, 50) + '...',
    startsWithHttps: supabaseUrl.startsWith('https://'),
    includesSupabaseCo: supabaseUrl.includes('.supabase.co')
  });
  throw error;
}

// Validate anon key format (basic check)
if (!supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.length < 100) {
  const error = new Error(
    "Invalid Supabase anon key format. Key should start with 'eyJ' and be a long JWT token"
  );
  console.error(error.message, {
    keyLength: supabaseAnonKey.length,
    keyPrefix: supabaseAnonKey.substring(0, 10) + '...'
  });
  throw error;
}

// Initialize Supabase client instance
let supabaseInstance: SupabaseClient<Database>;

// Create the Supabase client options with proper typing
const options = {
  auth: {
    persistSession: true, // Enable session persistence
    autoRefreshToken: true, // Enable token auto-refresh
    detectSessionInUrl: true, // Detect session from URL
    flowType: 'pkce' as AuthFlowType,
    debug: process.env.NODE_ENV === 'development',
  },
  global: {
    headers: {
      'x-application-name': 'notion_clone',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  },
  db: {
    schema: 'public' as const,
  },
  // Disable realtime by default - we'll enable it only where needed
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

// Initialize Supabase client with proper typing
try {
  console.log("Initializing Supabase client...");
  
  // Create the client with explicit type parameters
  const client = createClient<Database, 'public'>(
    supabaseUrl,
    supabaseAnonKey,
    options
  );
  
  console.log("Supabase client initialized successfully");
  supabaseInstance = client as unknown as SupabaseClient<Database>;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error("Failed to initialize Supabase client:", {
    message: errorMessage,
    error,
    timestamp: new Date().toISOString()
  });
  throw new Error(`Failed to initialize Supabase: ${errorMessage}`);
}

// Export the Supabase client
const supabase = supabaseInstance;

export { supabase };

// Test the connection
const testConnection = async () => {
  try {
    await supabase.from('documents').select('count').limit(1).single();
    console.log("✅ Supabase connection test successful");
  } catch (error) {
    console.error("❌ Supabase connection test failed:", error);
  }
};

void testConnection();

/**
 * Updates the Supabase client's authentication header with the provided JWT token
 * @param token - The JWT token from Clerk
 * @returns Promise<boolean> - Whether the operation was successful
 */
/**
 * Updates the Supabase authentication header with the provided JWT token
 * @param token - The JWT token from Clerk
 * @returns Promise<boolean> - Whether the operation was successful
 */
export const updateSupabaseAuthHeader = async (token: string | null): Promise<boolean> => {
  const context = 'updateSupabaseAuthHeader';
  const timestamp = new Date().toISOString();
  
  const log = (message: string, data?: any) => {
    console.log(`[${timestamp}] ${context}: ${message}`, data || '');
  };
  
  const logError = (message: string, error: any) => {
    console.error(`[${timestamp}] ${context}: ${message}`, {
      error: error?.message || error,
      name: error?.name,
      code: error?.code,
      status: error?.status,
      timestamp
    });
  };

  try {
    if (!token) {
      log('No token provided, signing out from Supabase');
      try {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          logError('Failed to sign out', signOutError);
          return false;
        }
        log('Successfully signed out from Supabase');
        return true;
      } catch (signOutError) {
        logError('Error during sign out', signOutError);
        return false;
      }
    }

    // Basic token validation
    if (typeof token !== 'string' || !token.startsWith('eyJ')) {
      logError('Invalid token format', { token: token ? '***' + token.slice(-10) : 'undefined' });
      return false;
    }

    log('Setting up Supabase session...');
    
    try {
      // First try to sign out any existing session
      await supabase.auth.signOut();
      
      // Then set the new session
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: token,
      });

      if (sessionError) {
        logError('Failed to set session', sessionError);
        
        // If setting session fails, try to recover by refreshing the session
        log('Attempting to recover by refreshing session...');
        const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession.session) {
          logError('Failed to refresh session', refreshError);
          return false;
        }
        
        log('Successfully recovered session via refresh');
        return true;
      }

      if (!sessionData?.session) {
        logError('No session data returned', {});
        return false;
      }

      log('Successfully updated Supabase auth session');
      return true;
      
    } catch (sessionError) {
      logError('Error during session setup', sessionError);
      return false;
    }
    
  } catch (error) {
    logError('Unexpected error', error);
    return false;
  }
}; 