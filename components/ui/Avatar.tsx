import React from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface AvatarProps {
  name: string;
  photoUrl?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Simple deterministic color from name string */
function nameToColor(name: string): string {
  const palette = [
    '#6366F1',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F59E0B',
    '#10B981',
    '#3B82F6',
    '#EF4444',
    '#F97316',
    '#84CC16',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ name, photoUrl, size = 48, style }: AvatarProps) {
  const theme = useTheme();
  const initials = getInitials(name);
  const bg = nameToColor(name);
  const fontSize = Math.round(size * 0.38);

  if (photoUrl) {
    return (
      <View
        style={[styles.imageFrame, { width: size, height: size, borderRadius: size / 2 }, style]}
      >
        <Image
          source={{ uri: photoUrl }}
          style={styles.image}
          accessibilityLabel={`${name} avatar`}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize, color: theme.isDark ? '#FFF' : '#FFF' }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageFrame: {
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
});
