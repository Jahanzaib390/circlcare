import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/theme';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: Colors.danger + '20' }]}>
        <Ionicons name="warning-outline" size={32} color={Colors.danger} />
      </View>
      <Text
        style={[
          styles.title,
          { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
        ]}
      >
        Oops!
      </Text>
      <Text
        style={[
          styles.message,
          { color: theme.colors.textMuted, fontFamily: theme.fontFamily.regular },
        ]}
      >
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { fontFamily: theme.fontFamily.medium }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});
