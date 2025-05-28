"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { updateSupabaseAuthHeader } from "@/lib/supabase/index";
import { toast } from "sonner";

/**
 * Provider component that handles Supabase authentication using Clerk's JWT tokens
 */
export const SupabaseAuthProvider = () => {
  const { getToken, isLoaded, userId } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to handle the authentication flow
  const setupSupabaseAuth = useCallback(async () => {
    if (!isLoaded) {
      console.log(`[${new Date().toISOString()}] Auth not yet loaded`);
      return false;
    }

    const timestamp = new Date().toISOString();
    const log = (message: string, data?: any) => {
      console.log(`[${timestamp}] ${message}`, data || '');
    };
    
    const logError = (message: string, error?: any) => {
      console.error(`[${timestamp}] ${message}`, error || '');
    };

    // Don't proceed if we're already initializing
    if (isInitialized) {
      log('Auth already initialized');
      return true;
    }

    try {
      log('Setting up Supabase auth...');
      
      // Get the JWT token from Clerk
      log('Getting token from Clerk...');
      const token = await getToken({ template: "supabase" });
      
      if (!token) {
        log('No token available, signing out from Supabase...');
        await updateSupabaseAuthHeader(null);
        return false;
      }

      log('Updating Supabase auth with new token...');
      const success = await updateSupabaseAuthHeader(token);
      
      if (!success) {
        logError('Failed to update Supabase auth header');
        // Instead of refreshing, just show an error and let the user retry
        toast.error('Failed to authenticate. Please try refreshing the page.');
        return false;
      }

      log('Successfully updated Supabase auth');
      return true;
      
    } catch (error) {
      logError('Error in setupSupabaseAuth:', error);
      toast.error('An error occurred during authentication');
      return false;
    }
  }, [getToken, isLoaded]);

  // Set up the auth when the component mounts or when dependencies change
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      if (!isLoaded || isInitialized) {
        return;
      }
      
      try {
        const success = await setupSupabaseAuth();
        if (isMounted) {
          setIsInitialized(success);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error initializing auth:`, error);
        // If there's an error, retry after a delay
        if (isMounted) {
          timeoutId = setTimeout(initializeAuth, 2000); // Retry after 2 seconds
        }
      }
    };

    // Initial call
    void initializeAuth();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [setupSupabaseAuth, isLoaded, isInitialized]);

  // Don't render anything, this is just for side effects
  return null;
}; 