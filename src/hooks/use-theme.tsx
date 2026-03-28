'use client';

import { useTheme as useNextTheme } from 'next-themes';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Shim: keeps the same API as the old custom ThemeProvider
// Actual ThemeProvider is now next-themes in src/components/layout/Providers.tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useTheme(): ThemeContextValue {
  const { resolvedTheme, setTheme } = useNextTheme();

  const theme: Theme = resolvedTheme === 'dark' ? 'dark' : 'light';

  return {
    theme,
    setTheme: (t: Theme) => setTheme(t),
    toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light'),
  };
}
