"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { EdgeStoreProvider } from "@/lib/edgestore";
import { SupabaseAuthProvider } from "@/components/providers/supabase-auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="notion-theme"
      >
        <EdgeStoreProvider>
          <SupabaseAuthProvider />
          {children}
        </EdgeStoreProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}