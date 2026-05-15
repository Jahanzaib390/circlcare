import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  TouchableOpacity,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Language } from '@/constants/Languages';
import { ONBOARDING_KEY, USER_PROFILE_KEY } from '@/constants/StorageKeys';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Multilingual Elder-Care',
    description:
      'Describe what you need in English, Urdu, or Roman Urdu. We understand the context and urgency.',
    icon: 'language-outline' as const,
  },
  {
    title: 'Trusted Local Providers',
    description:
      'We match you with verified nurses, caregivers, and transport that fit your specific safety and language preferences.',
    icon: 'shield-checkmark-outline' as const,
  },
  {
    title: 'Transparent & Coordinated',
    description:
      'See clear pricing breakdowns, track live status, and keep your family informed every step of the way.',
    icon: 'cash-outline' as const,
  },
];

const LANGUAGE_OPTIONS = [Language.Urdu, Language.English, Language.Punjabi];

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [slideIndex, setSlideIndex] = useState(0);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(Language.Urdu);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const i = Math.round(offsetX / width);
    setSlideIndex(i);
  };

  const finishOnboarding = async () => {
    const profile = {
      id: 'demo-user-123',
      name: name.trim(),
      saved_locations: address.trim()
        ? [
            {
              id: 'home',
              label: 'Home',
              area: address.trim(),
              city: 'Karachi',
              address: address.trim(),
            },
          ]
        : [],
      preferences: {
        preferred_language: preferredLanguage,
        notifications_enabled: true,
        demo_mode: false,
      },
      created_at: new Date().toISOString(),
    };

    await AsyncStorage.multiSet([
      [USER_PROFILE_KEY, JSON.stringify(profile)],
      [ONBOARDING_KEY, 'true'],
    ]);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name={slide.icon} size={64} color={theme.colors.primary} />
            </View>
            <Text
              style={[
                styles.title,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {slide.title}
            </Text>
            <Text
              style={[
                styles.description,
                { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
              ]}
            >
              {slide.description}
            </Text>
          </View>
        ))}

        {/* Profile Setup Slide */}
        <View style={[styles.slide, { width }]}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: theme.colors.primary + '20', marginBottom: 24 },
            ]}
          >
            <Ionicons name="person-add-outline" size={64} color={theme.colors.primary} />
          </View>
          <Text
            style={[
              styles.title,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Quick Setup
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
              placeholder="Your Name"
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
              placeholder="Saved Home Address (Optional)"
              placeholderTextColor={theme.colors.textMuted}
              value={address}
              onChangeText={setAddress}
            />
            <View style={styles.languageRow}>
              {LANGUAGE_OPTIONS.map((language) => {
                const selected = preferredLanguage === language;
                return (
                  <TouchableOpacity
                    key={language}
                    style={[
                      styles.languageChip,
                      {
                        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => setPreferredLanguage(language)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        {
                          color: selected ? '#fff' : theme.colors.textPrimary,
                          fontFamily: theme.fontFamily.medium,
                        },
                      ]}
                    >
                      {language}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {[...SLIDES, { title: 'Setup' }].map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    slideIndex === index ? theme.colors.primary : theme.colors.border,
                },
              ]}
            />
          ))}
        </View>
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          {slideIndex === SLIDES.length ? (
            <Button
              label="Get Started"
              onPress={finishOnboarding}
              variant="primary"
              size="lg"
              disabled={!name.trim()}
            />
          ) : (
            <Text style={[styles.swipeHint, { color: theme.colors.textMuted }]}>
              Swipe to continue
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    gap: 16,
    marginTop: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  languageText: {
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 14,
  },
});
