import 'next';

declare module 'next-themes' {
  type Theme = string;
  type BuiltInTheme = 'light' | 'dark' | 'system';
  type Attribute = 'class' | 'data-theme' | 'style';

  interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme | BuiltInTheme;
    forcedTheme?: Theme;
    attribute?: Attribute | Attribute[];
    enableSystem?: boolean;
    enableColorScheme?: boolean;
    disableTransitionOnChange?: boolean;
    storageKey?: string;
    themes?: Theme[];
    nonce?: string;
  }

  export const ThemeProvider: React.FC<ThemeProviderProps>;
  export function useTheme(): {
    theme: Theme | undefined;
    setTheme: (theme: Theme) => void;
    themes: Theme[];
  };
}
