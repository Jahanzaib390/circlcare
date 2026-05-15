import React, { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Shadows, Spacing } from '@/constants/theme';

type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  scheme: ColorScheme;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    accent: string;
    warning: string;
    danger: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    tabBar: string;
  };
  spacing: typeof Spacing;
  radius: typeof Radius;
  fontSize: typeof FontSize;
  fontFamily: typeof FontFamily;
  shadows: typeof Shadows;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = (useColorScheme() ?? 'light') as ColorScheme;
  const isDark = colorScheme === 'dark';

  const value: ThemeContextValue = {
    scheme: colorScheme,
    isDark,
    colors: {
      primary: Colors.primary,
      primaryDark: Colors.primaryDark,
      primaryLight: Colors.primaryLight,
      accent: Colors.accent,
      warning: Colors.warning,
      danger: Colors.danger,
      background: isDark ? Colors.background.dark : Colors.background.light,
      surface: isDark ? Colors.surface.dark : Colors.surface.light,
      surfaceElevated: isDark ? Colors.surface.elevated.dark : Colors.surface.elevated.light,
      textPrimary: isDark ? Colors.text.primary.dark : Colors.text.primary.light,
      textSecondary: isDark ? Colors.text.secondary.dark : Colors.text.secondary.light,
      textMuted: isDark ? Colors.text.muted.dark : Colors.text.muted.light,
      border: isDark ? Colors.neutral[700] : Colors.neutral[200],
      tabBar: isDark ? Colors.tabBar.dark : Colors.tabBar.light,
    },
    spacing: Spacing,
    radius: Radius,
    fontSize: FontSize,
    fontFamily: FontFamily,
    shadows: Shadows,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
