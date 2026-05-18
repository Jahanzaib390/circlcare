import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useRequestStore, type RecentRequest } from '@/hooks/useRequestStore';
import { useParseRequest } from '@/hooks/useParseRequest';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { CareAgentToast } from '@/components/ui/CareAgentToast';
import { ServiceCategory, ServiceDisplayNames, ServiceIcons } from '@/constants/ServiceCategories';
import { Colors } from '@/constants/theme';
import { apiClient } from '@/services/apiClient';
import { buildPredefinedServiceRequest } from '@/services/predefinedRequest';
import demoScenariosJson from '@/data/demo-scenarios.json';
import type { ParsedRequest } from '@/types/request';
import { DEMO_MODE_KEY } from '@/constants/StorageKeys';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Category data ──────────────────────────────────────────────────────────────
const QUICK_CATEGORIES: { category: ServiceCategory; color: string; bg: string }[] = [
  { category: ServiceCategory.ClinicVisit, color: '#4F46E5', bg: '#EEF2FF' },
  { category: ServiceCategory.HomeNurse, color: '#EC4899', bg: '#FDF2F8' },
  { category: ServiceCategory.Caregiver, color: '#10B981', bg: '#ECFDF5' },
  { category: ServiceCategory.Physiotherapy, color: '#F59E0B', bg: '#FFFBEB' },
  { category: ServiceCategory.MedicinePickup, color: '#3B82F6', bg: '#EFF6FF' },
  { category: ServiceCategory.LabSample, color: '#8B5CF6', bg: '#F5F3FF' },
  { category: ServiceCategory.MealPlan, color: '#EF4444', bg: '#FEF2F2' },
  { category: ServiceCategory.DailySupport, color: '#14B8A6', bg: '#F0FDFA' },
];

const STAGGER_DELAY = 60;

interface DemoScenario {
  id: string;
  title: string;
  request_text: string;
  expected_action: string;
  expected_outputs?: {
    parsed_request?: ParsedRequest;
    demo_notes?: string[];
    demo_seed?: {
      booking_id?: string;
      simulation?: string;
      replacement_discount?: number;
    };
  };
}

interface DemoScenariosResponse {
  scenarios: DemoScenario[];
  active_scenario_id: string | null;
}

const BUNDLED_DEMO_SCENARIOS = demoScenariosJson as DemoScenario[];

function getTimeGreeting(): { emoji: string; text: string } {
  const h = new Date().getHours();
  if (h < 12) return { emoji: '🌤️', text: 'Good morning' };
  if (h < 17) return { emoji: '☀️', text: 'Good afternoon' };
  return { emoji: '🌙', text: 'Good evening' };
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    rawRequest,
    isEmergency,
    recentRequests,
    setRawRequest,
    setParsedRequest,
    setIsEmergency,
    addRecentRequest,
  } = useRequestStore();
  const { mutate: parseRequest, isPending, isError, reset: resetMutation } = useParseRequest();

  const [inputHeight, setInputHeight] = useState(52);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoScenarios, setDemoScenarios] = useState<DemoScenario[]>(BUNDLED_DEMO_SCENARIOS);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(DEMO_MODE_KEY).then((val) => {
        if (val === 'true') {
          setIsDemoMode(true);
          apiClient
            .get<DemoScenariosResponse>('/api/demo/scenarios')
            .then((data) => {
              setDemoScenarios(data.scenarios.length > 0 ? data.scenarios : BUNDLED_DEMO_SCENARIOS);
            })
            .catch(() => setDemoScenarios(BUNDLED_DEMO_SCENARIOS));
        } else {
          setIsDemoMode(false);
          setDemoScenarios(BUNDLED_DEMO_SCENARIOS);
        }
      });
    }, [])
  );

  // Staggered fade-in for category tiles
  const tileAnims = useRef(QUICK_CATEGORIES.map(() => new Animated.Value(0))).current;
  const tileTranslates = useRef(QUICK_CATEGORIES.map(() => new Animated.Value(24))).current;

  // Emergency pulse animation
  const emergencyPulse = useRef(new Animated.Value(0)).current;

  // Hero float animation
  const heroFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = QUICK_CATEGORIES.map((_, i) =>
      Animated.parallel([
        Animated.timing(tileAnims[i], {
          toValue: 1,
          duration: 350,
          delay: 300 + i * STAGGER_DELAY,
          useNativeDriver: true,
        }),
        Animated.timing(tileTranslates[i], {
          toValue: 0,
          duration: 350,
          delay: 300 + i * STAGGER_DELAY,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(animations).start();

    // Floating orb animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(heroFloat, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, [tileAnims, tileTranslates, heroFloat]);

  useEffect(() => {
    if (isEmergency) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(emergencyPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(emergencyPulse, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      emergencyPulse.stopAnimation();
      emergencyPulse.setValue(0);
    }
  }, [emergencyPulse, isEmergency]);

  const handleSubmit = useCallback(() => {
    if (!rawRequest.trim() || isPending) return;
    Keyboard.dismiss();
    resetMutation();
    parseRequest({ text: rawRequest.trim(), isEmergency });
  }, [rawRequest, isEmergency, isPending, parseRequest, resetMutation]);

  const handleCategoryTap = (cat: ServiceCategory) => {
    const label = ServiceDisplayNames[cat];
    const text = `I need ${label.toLowerCase()} service for my family member`;
    const parsed = buildPredefinedServiceRequest(cat, isEmergency);
    setRawRequest(text);
    setParsedRequest(parsed);
    addRecentRequest({
      id: Date.now().toString(),
      text,
      timestamp: new Date().toISOString(),
      serviceBundle: parsed.service_bundle,
    });
    router.push('/request/understand');
  };

  const handleRecentTap = (item: RecentRequest) => {
    setRawRequest(item.text);
  };

  const handleDemoTap = (scenario: DemoScenario) => {
    setRawRequest(scenario.request_text);
    setParsedRequest(null);
    apiClient.post(`/api/demo/scenario/${scenario.id}`, {}).catch(() => {
      // Scenario selection still fills the request box; submit runs the live parser.
    });
  };

  const emergencyBorderColor = emergencyPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.danger, '#FF6B6B'],
  });

  const heroTranslateY = heroFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const canSubmit = rawRequest.trim().length >= 3;
  const isDark = theme.isDark;
  const greeting = getTimeGreeting();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Decoratite orb ─────────────────────────────────────────── */}
          <View style={s.orbContainer} pointerEvents="none">
            <Animated.View style={[s.orb1, { transform: [{ translateY: heroTranslateY }] }]} />
            <Animated.View
              style={[
                s.orb2,
                {
                  transform: [
                    {
                      translateY: heroTranslateY.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 10],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <View style={s.header}>
            <View>
              <Text
                style={[
                  s.greeting,
                  { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.medium },
                ]}
              >
                {greeting.text} {greeting.emoji}
              </Text>
              <Text
                style={[
                  s.headline,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
                ]}
              >
                What care is needed?
              </Text>
            </View>
            <TouchableOpacity
              style={[
                s.avatarBtn,
                {
                  backgroundColor: theme.colors.primary + '12',
                  borderColor: theme.colors.primary + '25',
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="person" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* ── AI Tag ──────────────────────────────────────────────────── */}
          <View style={[s.aiTag, { backgroundColor: theme.colors.primary + '10' }]}>
            <View style={[s.aiSpark, { backgroundColor: theme.colors.primary + '18' }]}>
              <Ionicons name="sparkles" size={12} color={theme.colors.primary} />
            </View>
            <Text
              style={[
                s.aiTagText,
                { color: theme.colors.primary, fontFamily: theme.fontFamily.medium },
              ]}
            >
              AI-powered — describe care in your own words
            </Text>
          </View>

          {isPending && (
            <CareAgentToast
              messages={[
                'Care agent is reading the request...',
                'Checking service type, urgency, and family preferences...',
                'Preparing a safe care plan...',
              ]}
            />
          )}

          {/* ── Input Card ───────────────────────────────────────────────── */}
          <Animated.View
            style={[
              s.inputCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: isEmergency ? emergencyBorderColor : theme.colors.border,
                borderWidth: isEmergency ? 2 : 1,
                shadowColor: isEmergency ? Colors.danger : Colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isEmergency ? 0.18 : 0.08,
                shadowRadius: 16,
                elevation: isEmergency ? 6 : 3,
              },
            ]}
          >
            {/* Subtle glow at top */}
            <View style={[s.inputGlow, { backgroundColor: theme.colors.primary + '06' }]} />

            <TextInput
              style={[
                s.textInput,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fontFamily.regular,
                  height: Math.max(64, inputHeight),
                },
              ]}
              placeholder="e.g. I need a female nurse for my mother tomorrow morning in Gulshan…"
              placeholderTextColor={theme.colors.textMuted}
              value={rawRequest}
              onChangeText={(t) => {
                setRawRequest(t);
                if (isError) resetMutation();
              }}
              multiline
              onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height + 16)}
              maxLength={1000}
              accessibilityLabel="Care request input"
              accessibilityHint="Describe the care you need in your own words"
            />

            {/* Input actions */}
            <View style={s.inputActions}>
              <View style={s.inputActionsLeft}>
                <VoiceInputButton
                  disabled={isPending}
                  onTranscript={(text) => {
                    setRawRequest(text);
                    if (isError) resetMutation();
                  }}
                />
              </View>
              <TouchableOpacity
                style={[
                  s.sendButton,
                  {
                    backgroundColor: canSubmit
                      ? theme.colors.primary
                      : theme.colors.surfaceElevated,
                    shadowColor: canSubmit ? theme.colors.primary : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  },
                ]}
                onPress={handleSubmit}
                disabled={!canSubmit || isPending}
                accessibilityLabel="Submit care request"
                accessibilityRole="button"
              >
                {isPending ? (
                  <Animated.View>
                    <Ionicons
                      name="hourglass"
                      size={22}
                      color={canSubmit ? '#fff' : theme.colors.textMuted}
                    />
                  </Animated.View>
                ) : (
                  <Ionicons
                    name="arrow-forward"
                    size={22}
                    color={canSubmit ? '#fff' : theme.colors.textMuted}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Error state */}
            {isError && (
              <View style={s.errorRow}>
                <Ionicons name="warning" size={14} color={theme.colors.danger} />
                <Text
                  style={[
                    s.errorText,
                    { color: theme.colors.danger, fontFamily: theme.fontFamily.regular },
                  ]}
                >
                  Something went wrong. Please try again.
                </Text>
              </View>
            )}
          </Animated.View>

          {/* ── Emergency Toggle ─────────────────────────────────────────── */}
          <Pressable
            style={[
              s.emergencyRow,
              {
                backgroundColor: isEmergency ? Colors.danger + '10' : theme.colors.surfaceElevated,
                borderColor: isEmergency ? Colors.danger + '30' : theme.colors.border,
              },
            ]}
            onPress={() => setIsEmergency(!isEmergency)}
            accessibilityLabel="Emergency toggle"
            accessibilityRole="switch"
            accessibilityState={{ checked: isEmergency }}
          >
            <View
              style={[
                s.emergencyIcon,
                { backgroundColor: isEmergency ? Colors.danger : theme.colors.border },
              ]}
            >
              <Ionicons
                name="warning"
                size={16}
                color={isEmergency ? '#fff' : theme.colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  s.emergencyLabel,
                  {
                    color: isEmergency ? Colors.danger : theme.colors.textPrimary,
                    fontFamily: theme.fontFamily.semiBold,
                  },
                ]}
              >
                Emergency / High Priority
              </Text>
              <Text
                style={[
                  s.emergencySubLabel,
                  { color: theme.colors.textMuted, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {isEmergency
                  ? 'Urgent matching enabled — providers alerted'
                  : 'Tap to mark as urgent'}
              </Text>
            </View>
            <Ionicons
              name={isEmergency ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={isEmergency ? Colors.danger : theme.colors.textMuted}
            />
          </Pressable>

          {/* ── Demo Scenarios ────────────────────────────────────────── */}
          {isDemoMode && demoScenarios.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={[
                  s.sectionTitle,
                  { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                Demo Scenarios
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {demoScenarios.map((scenario) => (
                  <TouchableOpacity
                    key={scenario.id}
                    style={[
                      s.demoTile,
                      {
                        backgroundColor: theme.colors.primary + '10',
                        borderColor: theme.colors.primary + '30',
                      },
                    ]}
                    onPress={() => handleDemoTap(scenario)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        s.demoTitle,
                        { color: theme.colors.primary, fontFamily: theme.fontFamily.bold },
                      ]}
                    >
                      {scenario.id}: {scenario.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Quick Categories ────────────────────────────────────────── */}
          <View style={s.sectionHeader}>
            <Text
              style={[
                s.sectionTitle,
                { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              Quick Select
            </Text>
            <View style={[s.sectionLine, { backgroundColor: theme.colors.border }]} />
          </View>
          <View style={s.categoryGrid}>
            {QUICK_CATEGORIES.map((item, i) => (
              <Animated.View
                key={item.category}
                style={{
                  opacity: tileAnims[i],
                  transform: [{ translateY: tileTranslates[i] }],
                  width: '23%',
                }}
              >
                <TouchableOpacity
                  style={[
                    s.categoryTile,
                    {
                      backgroundColor: isDark ? item.color + '15' : item.bg,
                      borderColor: isDark ? item.color + '30' : item.color + '15',
                    },
                  ]}
                  onPress={() => handleCategoryTap(item.category)}
                  activeOpacity={0.7}
                  accessibilityLabel={ServiceDisplayNames[item.category]}
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      s.iconContainer,
                      {
                        backgroundColor: item.color + '15',
                        shadowColor: item.color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 3,
                      },
                    ]}
                  >
                    <Ionicons
                      name={ServiceIcons[item.category] as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={item.color}
                    />
                  </View>
                  <Text
                    style={[
                      s.tileLabel,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.fontFamily.medium,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {ServiceDisplayNames[item.category]}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* ── Recent Requests ─────────────────────────────────────────── */}
          {recentRequests.length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <Text
                  style={[
                    s.sectionTitle,
                    { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semiBold },
                  ]}
                >
                  Recent Requests
                </Text>
                <View style={[s.sectionLine, { backgroundColor: theme.colors.border }]} />
              </View>
              <View style={s.recentList}>
                {recentRequests.slice(0, 5).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      s.recentItem,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => handleRecentTap(item)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Reuse request: ${item.text}`}
                    accessibilityRole="button"
                  >
                    <View style={[s.recentIcon, { backgroundColor: theme.colors.primary + '10' }]}>
                      <Ionicons name="time" size={16} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          s.recentText,
                          { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.regular },
                        ]}
                        numberOfLines={1}
                      >
                        {item.text}
                      </Text>
                      {item.serviceBundle.length > 0 && (
                        <Text
                          style={[
                            s.recentTag,
                            { color: theme.colors.textMuted, fontFamily: theme.fontFamily.regular },
                          ]}
                        >
                          {item.serviceBundle.map((svc) => svc.replace(/_/g, ' ')).join(', ')}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },

  // ── Orbs ──
  orbContainer: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    top: 0,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary + '0A',
  },
  orb2: {
    position: 'absolute',
    top: 80,
    right: 40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent + '08',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 4,
  },
  greeting: { fontSize: 14, marginBottom: 4, letterSpacing: 0.2 },
  headline: { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  avatarBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── AI Tag ──
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  aiSpark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTagText: { fontSize: 12, letterSpacing: 0.2 },
  // ── Input Card ──
  inputCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  inputGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  textInput: { fontSize: 16, lineHeight: 24, textAlignVertical: 'top' },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  inputActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  errorText: { fontSize: 14 },

  // ── Emergency ──
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 28,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyLabel: { fontSize: 15, marginBottom: 2 },
  emergencySubLabel: { fontSize: 13 },

  // ── Section ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1 },

  // ── Category Grid ──
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginBottom: 32,
  },
  categoryTile: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    height: 98,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontSize: 11, textAlign: 'center', lineHeight: 15 },

  // ── Recent ──
  recentList: { gap: 10, marginBottom: 12 },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: { fontSize: 15 },
  recentTag: { fontSize: 13, marginTop: 4, textTransform: 'capitalize' },

  // ── Demo ──
  demoTile: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  demoTitle: { fontSize: 14 },
});
