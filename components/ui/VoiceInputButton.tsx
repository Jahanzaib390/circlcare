import React from 'react';
import { Pressable, StyleSheet, View, Alert } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface VoiceInputButtonProps {
  /** Called when voice input is available (Phase 7). Currently unused. */
  onTranscript?: (text: string) => void;
  disabled?: boolean;
}

/**
 * VoiceInputButton — Phase 1 placeholder.
 * Renders an animated mic icon. Voice recording is implemented in Phase 7
 * when expo-dev-client / @react-native-voice is configured.
 */
export function VoiceInputButton({ disabled }: VoiceInputButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Animate the ring pulse to give visual feedback
    ringOpacity.value = 1;
    ringScale.value = 1;
    ringOpacity.value = withTiming(0, { duration: 600 });
    ringScale.value = withTiming(1.8, { duration: 600 });

    Alert.alert(
      '🎤 Voice Input',
      'Voice recording will be available in an upcoming update. For now, please type your request.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <View style={styles.wrapper}>
      {/* Pulse ring */}
      <Animated.View style={[styles.ring, { borderColor: theme.colors.primary }, pulseStyle]} />
      {/* Mic button */}
      <Animated.View style={buttonStyle}>
        <Pressable
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary },
            disabled && styles.disabled,
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessibilityLabel="Voice input (coming soon)"
          accessibilityHint="Tap to learn about voice input availability"
          accessibilityRole="button"
        >
          <Ionicons name="mic" size={22} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
