"use client";

import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging
console.log("Supabase Environment Variables:", {
  hasUrl: !!supabaseUrl,
  urlPrefix: supabaseUrl?.substring(0, 8),
  urlLength: supabaseUrl?.length,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  keyPrefix: supabaseAnonKey?.substring(0, 8),
  fullUrl: supabaseUrl // Safe to log in development
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseAnonKey?.length
  });
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error("Invalid Supabase URL format:", {
    url: supabaseUrl,
    startsWithHttps: supabaseUrl.startsWith('https://'),
    includesSupabaseCo: supabaseUrl.includes('.supabase.co')
  });
  throw new Error(
    "Invalid Supabase URL format. URL should start with 'https://' and contain '.supabase.co'"
  );
}

// Validate anon key format (basic check)
if (!supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.length < 100) {
  console.error("Invalid Supabase anon key format:", {
    keyLength: supabaseAnonKey.length,
    startsWithEyJ: supabaseAnonKey.startsWith('eyJ')
  });
  throw new Error(
    "Invalid Supabase anon key format. Key should start with 'eyJ' and be a long JWT token"
  );
}

console.log("Creating Supabase client...");

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false, // We don't want to persist as we're using Clerk
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-application-name': 'notion_clone',
      },
    },
  }
);

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

// Create a function to update the Supabase client's auth header
export const updateSupabaseAuthHeader = (token: string | null) => {
  if (token) {
    supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
      expires_in: 3600,
    });
  }
}; 