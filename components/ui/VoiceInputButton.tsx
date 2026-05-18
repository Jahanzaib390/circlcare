import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from '@/services/apiClient';
import { useTheme } from '@/hooks/useTheme';

interface VoiceInputButtonProps {
  onTranscript?: (text: string) => void;
  disabled?: boolean;
}

interface TranscribeResponse {
  text: string;
}

function mimeTypeForUri(uri: string) {
  if (uri.endsWith('.3gp')) return 'audio/3gpp';
  if (uri.endsWith('.webm')) return 'audio/webm';
  if (uri.endsWith('.wav')) return 'audio/wav';
  if (uri.endsWith('.mp3')) return 'audio/mpeg';
  return 'audio/m4a';
}

function fileNameForUri(uri: string) {
  return uri.split('/').pop() || 'voice-request.m4a';
}

export function VoiceInputButton({ disabled, onTranscript }: VoiceInputButtonProps) {
  const theme = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const [isTranscribing, setIsTranscribing] = useState(false);
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

  const pulse = () => {
    ringOpacity.value = 1;
    ringScale.value = 1;
    ringOpacity.value = withTiming(0, { duration: 600 });
    ringScale.value = withTiming(1.8, { duration: 600 });
  };

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Microphone Permission',
          'Microphone access is needed to record your care request.'
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      console.warn('[VoiceInputButton] Failed to start recording:', error);
      Alert.alert('Voice Input', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    setIsTranscribing(true);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const uri = recorder.uri ?? recorderState.url;
      if (!uri) {
        throw new Error('No recording file was created.');
      }

      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const response = await apiClient.post<TranscribeResponse>('/api/transcribe-request', {
        audioBase64,
        mimeType: mimeTypeForUri(uri),
        fileName: fileNameForUri(uri),
      });

      onTranscript?.(response.text);
    } catch (error) {
      console.warn('[VoiceInputButton] Failed to transcribe recording:', error);
      Alert.alert(
        'Voice Input',
        error instanceof Error && error.message
          ? error.message
          : 'Could not transcribe the recording. Please try again.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const handlePress = async () => {
    if (disabled || isTranscribing) return;
    pulse();
    if (recorderState.isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.ring, { borderColor: theme.colors.primary }, pulseStyle]} />
      <Animated.View style={buttonStyle}>
        <Pressable
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary },
            recorderState.isRecording && { backgroundColor: theme.colors.danger },
            (disabled || isTranscribing) && styles.disabled,
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isTranscribing}
          accessibilityLabel={recorderState.isRecording ? 'Stop voice input' : 'Start voice input'}
          accessibilityHint="Tap to start or stop recording your care request"
          accessibilityRole="button"
        >
          <Ionicons
            name={isTranscribing ? 'hourglass' : recorderState.isRecording ? 'stop' : 'mic'}
            size={22}
            color="#FFFFFF"
          />
        </Pressable>
      </Animated.View>
      {(recorderState.isRecording || isTranscribing) && (
        <View style={[styles.statusPill, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Text style={[styles.statusText, { color: theme.colors.textPrimary }]}>
            {isTranscribing
              ? 'Transcribing'
              : `${Math.max(1, Math.round(recorderState.durationMillis / 1000))}s`}
          </Text>
        </View>
      )}
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
  statusPill: {
    position: 'absolute',
    top: 56,
    minWidth: 42,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
