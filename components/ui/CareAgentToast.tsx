import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Radius, Shadows } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface CareAgentToastProps {
  messages: string[];
  active?: boolean;
  icon?: IoniconName;
  tone?: 'primary' | 'success' | 'warning';
}

export function CareAgentToast({
  messages,
  active = true,
  icon = 'sparkles',
  tone = 'primary',
}: CareAgentToastProps) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  const color =
    tone === 'success' ? Colors.accent : tone === 'warning' ? Colors.warning : theme.colors.primary;

  useEffect(() => {
    if (!active || messages.length === 0) return;

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
    ]).start();

    if (messages.length === 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 1800);

    return () => clearInterval(timer);
  }, [active, messages.length, opacity, translateY]);

  if (!active || messages.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: theme.colors.surface,
          borderColor: color + '35',
          opacity,
          transform: [{ translateY }],
        },
        Shadows.sm,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '14' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text
        style={[
          styles.text,
          { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.medium },
        ]}
        numberOfLines={2}
      >
        {messages[index]}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
