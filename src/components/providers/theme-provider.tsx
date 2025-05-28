"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type Attribute = 'class' | 'data-theme';

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: Attribute | Attribute[];
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  [key: string]: any;
};

export function ThemeProvider({ 
  children, 
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = true,
  ...props 
}: ThemeProviderProps) {
  // Cast the attribute to any to bypass the type error
  const attributeProp = attribute as any;

  return (
    <NextThemesProvider 
      attribute={attributeProp}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}