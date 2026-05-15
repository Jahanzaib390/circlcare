import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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

const LANGUAGE_OPTIONS = [Language.Urdu, Language.English];

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ flexGrow: 1 }}
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
                  backgroundColor: theme.colors.surface,
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
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
              placeholder="Home Address (Optional)"
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
      
      <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.dots}>
          {[...SLIDES, { title: 'Setup' }].map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    slideIndex === index ? theme.colors.primary : theme.colors.border,
                  width: slideIndex === index ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        <View style={{ paddingHorizontal: 32, paddingBottom: 16 }}>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80, // Extra space to not collide with footer
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  inputContainer: {
    width: '100%',
    gap: 16,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    justifyContent: 'center',
  },
  languageChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  languageText: {
    fontSize: 15,
  },
  footer: {
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: 15,
    paddingVertical: 14,
    letterSpacing: 0.5,
  },
});
