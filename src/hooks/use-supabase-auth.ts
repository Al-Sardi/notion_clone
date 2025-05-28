"use client";
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { updateSupabaseAuthHeader } from '@/lib/supabase/index';

export const useSupabaseAuth = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    const setupSupabaseAuth = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        updateSupabaseAuthHeader(token);
      } catch (error) {
        console.error('Error setting up Supabase auth:', error);
      }
    };

    setupSupabaseAuth();
  }, [getToken]);
}; 