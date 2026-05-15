import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface DividerProps {
  style?: ViewStyle;
  vertical?: boolean;
  spacing?: number;
}

export function Divider({ style, vertical = false, spacing = 0 }: DividerProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        { backgroundColor: theme.colors.border },
        spacing > 0 && (vertical ? { marginHorizontal: spacing } : { marginVertical: spacing }),
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    height: '100%',
  },
});
