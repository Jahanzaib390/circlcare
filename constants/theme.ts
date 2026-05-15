/**
 * CirclCare AI — Design System Tokens
 * Single source of truth for all visual constants.
 */

// ─── Brand Colors ────────────────────────────────────────────────────────────
export const Colors = {
  // Brand palette
  primary: '#4F46E5', // Indigo — main brand
  primaryDark: '#3730A3', // Indigo dark
  primaryLight: '#818CF8', // Indigo light (tint on dark bg)
  accent: '#10B981', // Emerald — confirmed / success
  accentDark: '#059669',
  warning: '#F59E0B', // Amber — pending / caution
  danger: '#EF4444', // Red — cancelled / dispute
  dangerDark: '#B91C1C',

  // Neutral scale
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Surface (card / sheet backgrounds)
  surface: {
    light: '#FFFFFF',
    dark: '#1E1E2E',
    elevated: {
      light: '#F9FAFB',
      dark: '#2A2A3C',
    },
  },

  // Text
  text: {
    primary: { light: '#111827', dark: '#F9FAFB' },
    secondary: { light: '#4B5563', dark: '#9CA3AF' },
    muted: { light: '#9CA3AF', dark: '#6B7280' },
    inverse: { light: '#FFFFFF', dark: '#111827' },
  },

  // Background
  background: {
    light: '#F5F5FA',
    dark: '#13131E',
  },

  // Tab & header
  tabBar: {
    light: '#FFFFFF',
    dark: '#1A1A2A',
  },
} as const;

// ─── Spacing Scale ────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ─── Border Radii ─────────────────────────────────────────────────────────────
export const Radius = {
  xs: 4,
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
} as const;

// ─── Font Sizes ───────────────────────────────────────────────────────────────
export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 30,
  hero: 38,
} as const;

// ─── Font Families (loaded via expo-font) ─────────────────────────────────────
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
} as const;

// ─── Line Heights ─────────────────────────────────────────────────────────────
export const LineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// ─── Animation Durations ──────────────────────────────────────────────────────
export const Duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 450,
  xslow: 600,
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────────
export const ZIndex = {
  base: 0,
  card: 10,
  overlay: 100,
  modal: 200,
  toast: 300,
} as const;
