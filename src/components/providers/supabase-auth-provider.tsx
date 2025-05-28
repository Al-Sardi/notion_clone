"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { updateSupabaseAuthHeader } from "@/lib/supabase/index";

export const SupabaseAuthProvider = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    const setupSupabaseAuth = async () => {
      try {
        const token = await getToken({ template: "supabase" });
        if (token) {
          updateSupabaseAuthHeader(token);
        }
      } catch (error) {
        console.error('Error setting up Supabase auth:', error);
      }
    };

    setupSupabaseAuth();
  }, [getToken]);

  return null;
}; 