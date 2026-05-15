import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  noPadding?: boolean;
}

export function Card({ children, style, elevated = false, noPadding = false }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface },
        elevated ? theme.shadows.card : theme.shadows.sm,
        { borderColor: theme.colors.border },
        !noPadding && styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  padding: {
    padding: 16,
  },
});
