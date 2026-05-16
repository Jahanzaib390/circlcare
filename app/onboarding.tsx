import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Language } from '@/constants/Languages';
import { Colors } from '@/constants/theme';
import { ONBOARDING_KEY, USER_PROFILE_KEY } from '@/constants/StorageKeys';

const { width: SW } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Multilingual Elder-Care',
    description:
      'Describe what you need in English, Urdu, or Roman Urdu. We understand the context and urgency.',
    icon: 'language-outline' as const,
    color: '#4F46E5',
  },
  {
    title: 'Trusted Local Providers',
    description:
      'We match you with verified nurses, caregivers, and transport that fit your specific safety and language preferences.',
    icon: 'shield-checkmark-outline' as const,
    color: '#10B981',
  },
  {
    title: 'Transparent & Coordinated',
    description:
      'See clear pricing breakdowns, track live status, and keep your family informed every step of the way.',
    icon: 'cash-outline' as const,
    color: '#F59E0B',
  },
];

const LANGUAGE_OPTIONS = [Language.Urdu, Language.English];

function AnimatedDot({ active, color }: { active: boolean; color: string; delay: number }) {
  const widthAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: active ? 1 : 0,
      friction: 6,
      tension: 100,
      useNativeDriver: false,
    }).start();
  }, [active, widthAnim]);

  return (
    <Animated.View
      style={{
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        width: widthAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 24],
        }),
      }}
    />
  );
}

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [slideIndex, setSlideIndex] = useState(0);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(Language.Urdu);

  const scrollRef = useRef<ScrollView>(null);
  const setupSlideAnim = useRef(new Animated.Value(0)).current;
  const orb1Float = useRef(new Animated.Value(0)).current;
  const orb2Float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1Float, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(orb1Float, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2Float, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(orb2Float, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, [orb1Float, orb2Float]);

  useEffect(() => {
    if (slideIndex === SLIDES.length) {
      Animated.spring(setupSlideAnim, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      setupSlideAnim.setValue(0);
    }
  }, [slideIndex, setupSlideAnim]);

  const goToSlide = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * SW, animated: true });
    setSlideIndex(idx);
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

  const orb1Y = orb1Float.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const orb2Y = orb2Float.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ── Floating orbs ── */}
      <Animated.View
        style={[
          styles.bgOrb,
          { backgroundColor: '#4F46E5' + '08', transform: [{ translateY: orb1Y }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bgOrb2,
          { backgroundColor: '#10B981' + '06', transform: [{ translateY: orb2Y }] },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
            setSlideIndex(idx);
          }}
          scrollEventThrottle={16}
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
        >
          {SLIDES.map((slide, index) => (
            <View key={index} style={[styles.slide, { width: SW }]}>
              <View style={[styles.iconBox, { backgroundColor: slide.color + '15' }]}>
                <Ionicons name={slide.icon} size={56} color={slide.color} />
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
          <View style={[styles.slide, { width: SW }]}>
            <Animated.View
              style={{
                width: '100%',
                paddingHorizontal: 32,
                opacity: setupSlideAnim,
                transform: [
                  {
                    translateY: setupSlideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              }}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: Colors.primary + '15', marginBottom: 24 },
                ]}
              >
                <Ionicons name="person-add-outline" size={56} color={Colors.primary} />
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
                      borderColor: name.length > 0 ? Colors.primary + '40' : theme.colors.border,
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
                            backgroundColor: selected ? Colors.primary : theme.colors.surface,
                            borderColor: selected ? Colors.primary : theme.colors.border,
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
            </Animated.View>
          </View>
        </Animated.ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.dots}>
            {SLIDES.map((slide, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToSlide(index)}
                hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
              >
                <AnimatedDot active={slideIndex === index} color={slide.color} delay={index * 60} />
              </TouchableOpacity>
            ))}
            <View style={{ width: 8 }} />
            <AnimatedDot
              active={slideIndex === SLIDES.length}
              color={Colors.primary}
              delay={SLIDES.length * 60}
            />
          </View>
          <View style={styles.footerActions}>
            {slideIndex === SLIDES.length ? (
              <Button
                label="Get Started"
                onPress={finishOnboarding}
                variant="primary"
                size="lg"
                fullWidth
                disabled={!name.trim()}
              />
            ) : (
              <View style={styles.swipeArea}>
                <Text
                  style={[
                    styles.swipeHint,
                    { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
                  ]}
                >
                  Swipe to explore
                </Text>
                <TouchableOpacity
                  style={styles.nextBtn}
                  onPress={() => goToSlide(slideIndex + 1)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="arrow-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
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

  bgOrb: {
    position: 'absolute',
    top: -100,
    left: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  bgOrb2: {
    position: 'absolute',
    bottom: '30%',
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
  },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  iconBox: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
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
  languageText: { fontSize: 15 },

  footer: {
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },

  footerActions: {
    paddingHorizontal: 32,
    paddingBottom: 8,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  swipeHint: {
    fontSize: 15,
    letterSpacing: 0.5,
  },
  nextBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00000008',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
