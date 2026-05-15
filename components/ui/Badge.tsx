import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'primary', icon, style }: BadgeProps) {
  const theme = useTheme();
  const { bg, text } = variantColors(variant, theme.colors);

  return (
    <View style={[styles.base, { backgroundColor: bg }, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

function variantColors(
  variant: BadgeVariant,
  colors: ReturnType<typeof useTheme>['colors']
): { bg: string; text: string } {
  switch (variant) {
    case 'primary':
      return { bg: `${colors.primary}20`, text: colors.primary };
    case 'success':
      return { bg: `${colors.accent}20`, text: colors.accent };
    case 'warning':
      return { bg: `${colors.warning}20`, text: colors.warning };
    case 'danger':
      return { bg: `${colors.danger}20`, text: colors.danger };
    case 'neutral':
      return { bg: colors.surfaceElevated, text: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
});
