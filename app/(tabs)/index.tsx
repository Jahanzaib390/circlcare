import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useRequestStore, type RecentRequest } from '@/hooks/useRequestStore';
import { useParseRequest } from '@/hooks/useParseRequest';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { ServiceCategory, ServiceDisplayNames, ServiceIcons } from '@/constants/ServiceCategories';
import { Colors } from '@/constants/theme';

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

// ── Stagger animation delay per tile ──────────────────────────────────────────
const STAGGER_DELAY = 60;

export default function HomeScreen() {
  const theme = useTheme();
  const {
    rawRequest,
    isEmergency,
    recentRequests,
    setRawRequest,
    setParsedRequest,
    setIsEmergency,
  } = useRequestStore();
  const { mutate: parseRequest, isPending, isError, reset: resetMutation } = useParseRequest();

  const [inputHeight, setInputHeight] = useState(52);

  // Staggered fade-in for category tiles
  const tileAnims = useRef(QUICK_CATEGORIES.map(() => new Animated.Value(0))).current;
  const tileTranslates = useRef(QUICK_CATEGORIES.map(() => new Animated.Value(20))).current;

  // Emergency shake animation for input card
  const emergencyPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered tile entrance
    const animations = QUICK_CATEGORIES.map((_, i) =>
      Animated.parallel([
        Animated.timing(tileAnims[i], {
          toValue: 1,
          duration: 350,
          delay: 200 + i * STAGGER_DELAY,
          useNativeDriver: true,
        }),
        Animated.timing(tileTranslates[i], {
          toValue: 0,
          duration: 350,
          delay: 200 + i * STAGGER_DELAY,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(animations).start();
  }, [tileAnims, tileTranslates]);

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
    setRawRequest(text);
    setParsedRequest(null);
    parseRequest({ text, isEmergency });
  };

  const handleRecentTap = (item: RecentRequest) => {
    setRawRequest(item.text);
  };

  const emergencyBorderColor = emergencyPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.danger, '#FF6B6B'],
  });

  const canSubmit = rawRequest.trim().length >= 3;
  const isDark = theme.isDark;

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
          {/* ── Header ─────────────────────────────────────────────── */}
          <View style={s.header}>
            <View>
              <Text
                style={[
                  s.greeting,
                  { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                Good morning 👋
              </Text>
              <Text
                style={[
                  s.headline,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.extraBold },
                ]}
              >
                What care is needed?
              </Text>
            </View>
            <View style={[s.avatarPlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="person" size={22} color={theme.colors.primary} />
            </View>
          </View>

          {/* ── AI Tag ─────────────────────────────────────────────── */}
          <View style={[s.aiTag, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="sparkles" size={13} color={theme.colors.primary} />
            <Text
              style={[
                s.aiTagText,
                { color: theme.colors.primary, fontFamily: theme.fontFamily.medium },
              ]}
            >
              Powered by Gemini AI — describe in your own words
            </Text>
          </View>

          {/* ── Input Card ─────────────────────────────────────────── */}
          <Animated.View
            style={[
              s.inputCard,
              {
                backgroundColor: theme.colors.surface,
                ...theme.shadows.md,
                borderWidth: isEmergency ? 2 : 1,
                borderColor: isEmergency ? emergencyBorderColor : theme.colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                s.textInput,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fontFamily.regular,
                  height: Math.max(52, inputHeight),
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
              <VoiceInputButton disabled={isPending} />
              <TouchableOpacity
                style={[
                  s.sendButton,
                  { backgroundColor: canSubmit ? theme.colors.primary : theme.colors.border },
                ]}
                onPress={handleSubmit}
                disabled={!canSubmit || isPending}
                accessibilityLabel="Submit care request"
                accessibilityRole="button"
              >
                {isPending ? (
                  <Ionicons name="hourglass" size={20} color="#fff" />
                ) : (
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
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

          {/* ── Emergency Toggle ───────────────────────────────────── */}
          <Pressable
            style={[
              s.emergencyRow,
              {
                backgroundColor: isEmergency ? Colors.danger + '15' : theme.colors.surfaceElevated,
                borderColor: isEmergency ? Colors.danger : theme.colors.border,
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

          {/* ── Quick Categories ───────────────────────────────────── */}
          <Text
            style={[
              s.sectionTitle,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Quick Select
          </Text>
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
                      backgroundColor: isDark ? item.color + '22' : item.bg,
                      borderColor: isDark ? item.color + '44' : item.color + '30',
                    },
                  ]}
                  onPress={() => handleCategoryTap(item.category)}
                  activeOpacity={0.75}
                  accessibilityLabel={ServiceDisplayNames[item.category]}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={ServiceIcons[item.category] as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={item.color}
                  />
                  <Text
                    style={[
                      s.tileLabel,
                      {
                        color: isDark ? item.color : item.color,
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

          {/* ── Recent Requests ────────────────────────────────────── */}
          {recentRequests.length > 0 && (
            <>
              <Text
                style={[
                  s.sectionTitle,
                  { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                Recent Requests
              </Text>
              <View style={s.recentList}>
                {recentRequests.slice(0, 5).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      s.recentItem,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    ]}
                    onPress={() => handleRecentTap(item)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Reuse request: ${item.text}`}
                    accessibilityRole="button"
                  >
                    <View style={[s.recentIcon, { backgroundColor: theme.colors.primary + '15' }]}>
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
                          {item.serviceBundle.map((s) => s.replace(/_/g, ' ')).join(', ')}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Bottom padding */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  greeting: { fontSize: 13, marginBottom: 2 },
  headline: { fontSize: 26, lineHeight: 32 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  aiTagText: { fontSize: 12 },

  inputCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  textInput: { fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  errorText: { fontSize: 13 },

  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  emergencyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyLabel: { fontSize: 14 },
  emergencySubLabel: { fontSize: 12, marginTop: 1 },

  sectionTitle: { fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  categoryTile: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    minHeight: 88,
  },
  tileLabel: { fontSize: 11, textAlign: 'center', lineHeight: 14 },

  recentList: { gap: 8, marginBottom: 8 },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  recentIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: { fontSize: 14 },
  recentTag: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
});
