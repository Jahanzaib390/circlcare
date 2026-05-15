import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  DimensionValue,
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useRequestStore } from '@/hooks/useRequestStore';
import { useParseRequest } from '@/hooks/useParseRequest';
import { Button } from '@/components/ui/Button';
import type { ParsedRequest } from '@/types/request';
import { Colors } from '@/constants/theme';
import { ServiceCategory, ServiceDisplayNames, ServiceIcons } from '@/constants/ServiceCategories';
import { ALL_LANGUAGES, Language } from '@/constants/Languages';

// ── Skeleton block component ───────────────────────────────────────────────────
function SkeletonBlock({ width, height = 18 }: { width: DimensionValue; height?: number }) {
  const opacity = React.useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);
  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: 6,
        backgroundColor: '#9CA3AF',
        opacity,
        marginVertical: 3,
      }}
    />
  );
}

// ── Skeleton card for loading state ───────────────────────────────────────────
function SkeletonCard({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View
      style={[
        sc.fieldCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <SkeletonBlock width="40%" height={14} />
      <SkeletonBlock width="70%" height={20} />
    </View>
  );
}

// ── Field display card ─────────────────────────────────────────────────────────
function FieldCard({
  icon,
  label,
  value,
  color,
  editable,
  onEdit,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string;
  editable?: boolean;
  onEdit?: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      style={[
        sc.fieldCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
      onPress={editable ? onEdit : undefined}
      accessibilityLabel={`${label}: ${value}${editable ? ' — tap to edit' : ''}`}
      accessibilityRole={editable ? 'button' : 'text'}
    >
      <View style={sc.fieldHeader}>
        <Ionicons name={icon} size={14} color={color ?? theme.colors.textMuted} />
        <Text
          style={[
            sc.fieldLabel,
            { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
          ]}
        >
          {label}
        </Text>
        {editable && (
          <Ionicons
            name="create-outline"
            size={14}
            color={theme.colors.primary}
            style={{ marginLeft: 'auto' }}
          />
        )}
      </View>
      <Text
        style={[
          sc.fieldValue,
          { color: color ?? theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
        ]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

// ── Confidence meter ───────────────────────────────────────────────────────────
function ConfidenceMeter({
  confidence,
  theme,
}: {
  confidence: number;
  theme: ReturnType<typeof useTheme>;
}) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 85 ? Colors.accent : pct >= 65 ? Colors.warning : Colors.danger;
  const label =
    pct >= 85 ? 'High confidence' : pct >= 65 ? 'Moderate confidence' : 'Low confidence';

  return (
    <View
      style={[
        sc.fieldCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={sc.fieldHeader}>
        <Ionicons name="analytics" size={14} color={color} />
        <Text
          style={[
            sc.fieldLabel,
            { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
          ]}
        >
          AI Confidence
        </Text>
        <Text
          style={[
            sc.confidencePct,
            { color, fontFamily: theme.fontFamily.bold, marginLeft: 'auto' },
          ]}
        >
          {pct}%
        </Text>
      </View>
      <View style={[sc.meterTrack, { backgroundColor: theme.colors.border }]}>
        <View
          style={[sc.meterFill, { width: `${pct}%` as DimensionValue, backgroundColor: color }]}
        />
      </View>
      <Text style={[sc.confidenceLabel, { color, fontFamily: theme.fontFamily.regular }]}>
        {label}
      </Text>
    </View>
  );
}

// ── Edit overlay ───────────────────────────────────────────────────────────────
function EditOverlay({
  label,
  value,
  onSave,
  onDismiss,
  theme,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  onDismiss: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <View
      style={[
        sc.editOverlay,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Text
        style={[
          sc.editLabel,
          { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
        ]}
      >
        Edit {label}
      </Text>
      <TextInput
        style={[
          sc.editInput,
          {
            color: theme.colors.textPrimary,
            borderColor: theme.colors.border,
            fontFamily: theme.fontFamily.regular,
          },
        ]}
        value={draft}
        onChangeText={setDraft}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => onSave(draft)}
      />
      <View style={sc.editActions}>
        <Button label="Cancel" variant="ghost" size="sm" onPress={onDismiss} />
        <Button label="Save" variant="primary" size="sm" onPress={() => onSave(draft)} />
      </View>
    </View>
  );
}

function ToggleChip({
  label,
  selected,
  onPress,
  icon,
  theme,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      style={[
        sc.chip,
        {
          backgroundColor: selected ? theme.colors.primary + '18' : theme.colors.surfaceElevated,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon && (
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={12}
          color={selected ? theme.colors.primary : theme.colors.textMuted}
        />
      )}
      <Text
        style={[
          sc.chipText,
          {
            color: selected ? theme.colors.primary : theme.colors.textPrimary,
            fontFamily: theme.fontFamily.medium,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const SERVICE_OPTIONS = [
  ServiceCategory.ClinicVisit,
  ServiceCategory.HomeNurse,
  ServiceCategory.Caregiver,
  ServiceCategory.Physiotherapy,
  ServiceCategory.MedicinePickup,
  ServiceCategory.LabSample,
  ServiceCategory.MealPlan,
  ServiceCategory.DailySupport,
];

const MOBILITY_OPTIONS = ['wheelchair', 'stretcher', 'oxygen support'];

// ── Main screen ────────────────────────────────────────────────────────────────
export default function UnderstandScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { parsedRequest, rawRequest, setParsedRequest, setRawRequest } = useRequestStore();
  const { mutate: reparse, isPending } = useParseRequest();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [clarificationText, setClarificationText] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  const handleLooksRight = () => {
    router.push('/request/match');
  };

  const handleEditRequest = () => {
    router.back();
  };

  const handleAnswerClarification = () => {
    if (!clarificationText.trim()) return;
    const combined = `${rawRequest} — ${clarificationText.trim()}`;
    setRawRequest(combined);
    setIsAnswering(true);
    reparse(
      { text: combined },
      {
        onSettled: () => setIsAnswering(false),
        onSuccess: () => setClarificationText(''),
      }
    );
  };

  const handleFieldSave = useCallback(
    (field: keyof ParsedRequest, value: string) => {
      if (!parsedRequest) return;
      setParsedRequest({ ...parsedRequest, [field]: value });
      setEditingField(null);
    },
    [parsedRequest, setParsedRequest]
  );

  const updateParsed = useCallback(
    (patch: Partial<ParsedRequest>) => {
      if (!parsedRequest) return;
      setParsedRequest({ ...parsedRequest, ...patch });
    },
    [parsedRequest, setParsedRequest]
  );

  const toggleService = (service: ServiceCategory) => {
    if (!parsedRequest) return;
    const current = parsedRequest.service_bundle;
    const next = current.includes(service)
      ? current.filter((item) => item !== service)
      : [...current, service];
    updateParsed({
      service_bundle: next,
      clarification_needed: parsedRequest.location_from === 'not specified' || next.length === 0,
      clarification_question:
        parsedRequest.location_from === 'not specified'
          ? 'Could you share the location where care is needed?'
          : next.length === 0
            ? 'Which care service should we arrange?'
            : undefined,
      confidence:
        next.length > 0 ? Math.max(parsedRequest.confidence, 0.72) : parsedRequest.confidence,
    });
  };

  const toggleMobilityNeed = (need: string) => {
    if (!parsedRequest) return;
    const current = parsedRequest.mobility_needs;
    updateParsed({
      mobility_needs: current.includes(need)
        ? current.filter((item) => item !== need)
        : [...current, need],
    });
  };

  const toggleLanguage = (language: Language) => {
    if (!parsedRequest) return;
    const current = parsedRequest.provider_preferences.language ?? [];
    updateParsed({
      provider_preferences: {
        ...parsedRequest.provider_preferences,
        language: current.includes(language)
          ? current.filter((item) => item !== language)
          : [...current, language],
      },
    });
  };

  const setGenderPreference = (gender: ParsedRequest['provider_preferences']['gender']) => {
    if (!parsedRequest) return;
    updateParsed({
      provider_preferences: {
        ...parsedRequest.provider_preferences,
        gender,
      },
    });
  };

  const setVerifiedOnly = (verified_only: boolean) => {
    if (!parsedRequest) return;
    updateParsed({
      provider_preferences: {
        ...parsedRequest.provider_preferences,
        verified_only,
      },
    });
  };

  const setLanguageRequired = (language_required: boolean) => {
    if (!parsedRequest) return;
    updateParsed({
      provider_preferences: {
        ...parsedRequest.provider_preferences,
        language_required,
      },
    });
  };

  const urgencyColor = (u: ParsedRequest['urgency']) => {
    switch (u) {
      case 'emergency':
        return Colors.danger;
      case 'high':
        return '#F97316';
      case 'medium':
        return Colors.warning;
      default:
        return Colors.accent;
    }
  };

  const riskColor = (r: ParsedRequest['risk_level']) => {
    switch (r) {
      case 'high':
        return Colors.danger;
      case 'medium':
        return Colors.warning;
      default:
        return Colors.accent;
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isPending || (!parsedRequest && !isPending)) {
    return (
      <SafeAreaView style={[sc.root, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[sc.topBar, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={sc.backBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={[
              sc.topTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Understanding Request
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={sc.skeletonContent}>
          <View style={sc.loadingHeader}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                sc.loadingText,
                { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
              ]}
            >
              Gemini AI is analysing your request…
            </Text>
          </View>
          {[1, 2, 3, 4, 5].map((k) => (
            <SkeletonCard key={k} theme={theme} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const pr = parsedRequest!;

  return (
    <SafeAreaView style={[sc.root, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* ── Top bar ─────────────────────────────────────────────── */}
        <View style={[sc.topBar, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={sc.backBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={[
              sc.topTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            We understood this
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={sc.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Clarification banner ─────────────────────────────── */}
          {(pr.confidence === 0 || pr.service_bundle.length === 0) && (
            <View
              style={[
                sc.manualCard,
                { backgroundColor: Colors.warning + '12', borderColor: Colors.warning },
              ]}
            >
              <View style={sc.clarifyHeader}>
                <Ionicons name="create" size={20} color={Colors.warning} />
                <Text
                  style={[
                    sc.clarifyTitle,
                    { color: Colors.warning, fontFamily: theme.fontFamily.semiBold },
                  ]}
                >
                  Manual confirmation needed
                </Text>
              </View>
              <Text
                style={[
                  sc.clarifyQuestion,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                The AI could not confidently identify the service. Pick one or more categories
                below.
              </Text>
              <View style={sc.chipsRow}>
                {SERVICE_OPTIONS.map((service) => (
                  <ToggleChip
                    key={service}
                    label={ServiceDisplayNames[service]}
                    icon={ServiceIcons[service]}
                    selected={pr.service_bundle.includes(service)}
                    onPress={() => toggleService(service)}
                    theme={theme}
                  />
                ))}
              </View>
            </View>
          )}

          {pr.clarification_needed && pr.clarification_question && (
            <View
              style={[
                sc.clarifyCard,
                { backgroundColor: Colors.warning + '15', borderColor: Colors.warning },
              ]}
            >
              <View style={sc.clarifyHeader}>
                <Ionicons name="help-circle" size={20} color={Colors.warning} />
                <Text
                  style={[
                    sc.clarifyTitle,
                    { color: Colors.warning, fontFamily: theme.fontFamily.semiBold },
                  ]}
                >
                  Quick question
                </Text>
              </View>
              <Text
                style={[
                  sc.clarifyQuestion,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {pr.clarification_question}
              </Text>
              <TextInput
                style={[
                  sc.clarifyInput,
                  {
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                    fontFamily: theme.fontFamily.regular,
                  },
                ]}
                placeholder="Your answer…"
                placeholderTextColor={theme.colors.textMuted}
                value={clarificationText}
                onChangeText={setClarificationText}
                returnKeyType="send"
                onSubmitEditing={handleAnswerClarification}
              />
              {pr.location_from === 'not specified' && (
                <Button
                  label="Choose Location"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onPress={() => router.push('/modals/location-picker')}
                  style={{ marginTop: 8 }}
                />
              )}
              <Button
                label={isAnswering ? 'Sending…' : 'Re-analyse with answer'}
                variant="primary"
                size="sm"
                fullWidth
                loading={isAnswering}
                onPress={handleAnswerClarification}
                style={{ marginTop: 8 }}
              />
            </View>
          )}

          {/* ── Inline field edit overlay ────────────────────────── */}
          {editingField &&
            ['patient', 'time_preference', 'location_from'].includes(editingField) && (
              <EditOverlay
                label={editingField}
                value={String(
                  pr[editingField as 'patient' | 'time_preference' | 'location_from'] ?? ''
                )}
                onSave={(v) => handleFieldSave(editingField as keyof ParsedRequest, v)}
                onDismiss={() => setEditingField(null)}
                theme={theme}
              />
            )}

          {/* ── Services detected ────────────────────────────────── */}
          <Pressable
            style={[
              sc.fieldCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            onPress={() =>
              setEditingField(editingField === 'service_bundle' ? null : 'service_bundle')
            }
            accessibilityRole="button"
            accessibilityLabel="Services detected. Tap to edit"
          >
            <View style={sc.fieldHeader}>
              <Ionicons name="medical" size={14} color={theme.colors.primary} />
              <Text
                style={[
                  sc.fieldLabel,
                  { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
                ]}
              >
                Services Detected
              </Text>
              <Ionicons
                name="create-outline"
                size={14}
                color={theme.colors.primary}
                style={{ marginLeft: 'auto' }}
              />
            </View>
            <View style={sc.chipsRow}>
              {pr.service_bundle.length > 0 ? (
                pr.service_bundle.map((svc) => (
                  <View
                    key={svc}
                    style={[
                      sc.chip,
                      {
                        backgroundColor: theme.colors.primary + '15',
                        borderColor: theme.colors.primary + '30',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        sc.chipText,
                        { color: theme.colors.primary, fontFamily: theme.fontFamily.medium },
                      ]}
                    >
                      {svc.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))
              ) : (
                <Text
                  style={[
                    sc.fieldValue,
                    { color: theme.colors.textMuted, fontFamily: theme.fontFamily.regular },
                  ]}
                >
                  Not detected — please edit
                </Text>
              )}
            </View>
            {editingField === 'service_bundle' && (
              <View style={sc.inlineEditor}>
                {SERVICE_OPTIONS.map((service) => (
                  <ToggleChip
                    key={service}
                    label={ServiceDisplayNames[service]}
                    icon={ServiceIcons[service]}
                    selected={pr.service_bundle.includes(service)}
                    onPress={() => toggleService(service)}
                    theme={theme}
                  />
                ))}
              </View>
            )}
          </Pressable>

          {/* ── Patient ──────────────────────────────────────────── */}
          <FieldCard
            icon="person"
            label="Patient"
            value={pr.patient || 'Not specified'}
            editable
            onEdit={() => setEditingField('patient')}
            theme={theme}
          />

          {/* ── Time ─────────────────────────────────────────────── */}
          <FieldCard
            icon="time"
            label="When"
            value={pr.time_preference || 'Flexible'}
            editable
            onEdit={() => setEditingField('time_preference')}
            theme={theme}
          />

          {/* ── Location ─────────────────────────────────────────── */}
          <FieldCard
            icon="location"
            label="Location"
            value={
              pr.location_to
                ? `${pr.location_from} → ${pr.location_to}`
                : pr.location_from || 'Not specified'
            }
            editable
            onEdit={() => setEditingField('location_from')}
            theme={theme}
          />

          {/* ── Provider preferences ─────────────────────────────── */}
          <Pressable
            style={[
              sc.fieldCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            onPress={() =>
              setEditingField(
                editingField === 'provider_preferences' ? null : 'provider_preferences'
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Provider preferences. Tap to edit"
          >
            <View style={sc.fieldHeader}>
              <Ionicons name="options" size={14} color={theme.colors.textMuted} />
              <Text
                style={[
                  sc.fieldLabel,
                  { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
                ]}
              >
                Provider Preferences
              </Text>
              <Ionicons
                name="create-outline"
                size={14}
                color={theme.colors.primary}
                style={{ marginLeft: 'auto' }}
              />
            </View>
            <View style={sc.chipsRow}>
              {pr.provider_preferences.gender && pr.provider_preferences.gender !== 'any' && (
                <View
                  style={[
                    sc.chip,
                    { backgroundColor: '#EC4899' + '15', borderColor: '#EC4899' + '30' },
                  ]}
                >
                  <Ionicons name="person" size={11} color="#EC4899" />
                  <Text
                    style={[sc.chipText, { color: '#EC4899', fontFamily: theme.fontFamily.medium }]}
                  >
                    {pr.provider_preferences.gender.replace(/_/g, ' ')}
                  </Text>
                </View>
              )}
              {pr.provider_preferences.verified_only && (
                <View
                  style={[
                    sc.chip,
                    { backgroundColor: Colors.accent + '15', borderColor: Colors.accent + '30' },
                  ]}
                >
                  <Ionicons name="shield-checkmark" size={11} color={Colors.accent} />
                  <Text
                    style={[
                      sc.chipText,
                      { color: Colors.accent, fontFamily: theme.fontFamily.medium },
                    ]}
                  >
                    Verified only
                  </Text>
                </View>
              )}
              {pr.provider_preferences.language?.map((lang) => (
                <View
                  key={lang}
                  style={[
                    sc.chip,
                    { backgroundColor: '#8B5CF6' + '15', borderColor: '#8B5CF6' + '30' },
                  ]}
                >
                  <Text
                    style={[sc.chipText, { color: '#8B5CF6', fontFamily: theme.fontFamily.medium }]}
                  >
                    {lang}
                  </Text>
                </View>
              ))}
              {pr.provider_preferences.language_required && (
                <View
                  style={[
                    sc.chip,
                    { backgroundColor: Colors.warning + '15', borderColor: Colors.warning + '30' },
                  ]}
                >
                  <Ionicons name="alert-circle" size={11} color={Colors.warning} />
                  <Text
                    style={[
                      sc.chipText,
                      { color: Colors.warning, fontFamily: theme.fontFamily.medium },
                    ]}
                  >
                    Language required
                  </Text>
                </View>
              )}
              {!pr.provider_preferences.gender && !pr.provider_preferences.verified_only && (
                <Text
                  style={[
                    sc.fieldValue,
                    { color: theme.colors.textMuted, fontFamily: theme.fontFamily.regular },
                  ]}
                >
                  No specific preferences
                </Text>
              )}
            </View>
            {editingField === 'provider_preferences' && (
              <View style={sc.inlineEditor}>
                <Text
                  style={[
                    sc.inlineLabel,
                    { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
                  ]}
                >
                  Gender
                </Text>
                <View style={sc.chipsRow}>
                  {[
                    ['any', 'Any'],
                    ['female_required', 'Female required'],
                    ['male_required', 'Male required'],
                    ['female_preferred', 'Female preferred'],
                  ].map(([value, label]) => (
                    <ToggleChip
                      key={value}
                      label={label}
                      selected={pr.provider_preferences.gender === value}
                      onPress={() =>
                        setGenderPreference(
                          value as ParsedRequest['provider_preferences']['gender']
                        )
                      }
                      theme={theme}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    sc.inlineLabel,
                    { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
                  ]}
                >
                  Languages
                </Text>
                <View style={sc.chipsRow}>
                  {ALL_LANGUAGES.map((language) => (
                    <ToggleChip
                      key={language}
                      label={language}
                      selected={(pr.provider_preferences.language ?? []).includes(language)}
                      onPress={() => toggleLanguage(language)}
                      theme={theme}
                    />
                  ))}
                </View>
                <ToggleChip
                  label="Verified providers only"
                  selected={pr.provider_preferences.verified_only}
                  onPress={() => setVerifiedOnly(!pr.provider_preferences.verified_only)}
                  icon="shield-checkmark"
                  theme={theme}
                />
                <ToggleChip
                  label="Language is required"
                  selected={Boolean(pr.provider_preferences.language_required)}
                  onPress={() =>
                    setLanguageRequired(!Boolean(pr.provider_preferences.language_required))
                  }
                  icon="alert-circle"
                  theme={theme}
                />
              </View>
            )}
          </Pressable>

          {/* ── Mobility needs ───────────────────────────────────── */}
          <Pressable
            style={[
              sc.fieldCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            onPress={() =>
              setEditingField(editingField === 'mobility_needs' ? null : 'mobility_needs')
            }
            accessibilityRole="button"
            accessibilityLabel="Mobility needs. Tap to edit"
          >
            <View style={sc.fieldHeader}>
              <Ionicons name="accessibility" size={14} color={theme.colors.warning} />
              <Text
                style={[
                  sc.fieldLabel,
                  { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
                ]}
              >
                Mobility Needs
              </Text>
              <Ionicons
                name="create-outline"
                size={14}
                color={theme.colors.primary}
                style={{ marginLeft: 'auto' }}
              />
            </View>
            <View style={sc.chipsRow}>
              {pr.mobility_needs.length > 0 ? (
                pr.mobility_needs.map((m) => (
                  <View
                    key={m}
                    style={[
                      sc.chip,
                      {
                        backgroundColor: Colors.warning + '15',
                        borderColor: Colors.warning + '30',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        sc.chipText,
                        { color: Colors.warning, fontFamily: theme.fontFamily.medium },
                      ]}
                    >
                      {m}
                    </Text>
                  </View>
                ))
              ) : (
                <Text
                  style={[
                    sc.fieldValue,
                    { color: theme.colors.textMuted, fontFamily: theme.fontFamily.regular },
                  ]}
                >
                  No mobility needs
                </Text>
              )}
            </View>
            {editingField === 'mobility_needs' && (
              <View style={sc.inlineEditor}>
                {MOBILITY_OPTIONS.map((need) => (
                  <ToggleChip
                    key={need}
                    label={need}
                    selected={pr.mobility_needs.includes(need)}
                    onPress={() => toggleMobilityNeed(need)}
                    theme={theme}
                  />
                ))}
              </View>
            )}
          </Pressable>

          {/* ── Urgency + Risk row ───────────────────────────────── */}
          <View style={sc.twoCol}>
            <Pressable
              style={[
                sc.fieldCard,
                sc.halfCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={() => setEditingField(editingField === 'urgency' ? null : 'urgency')}
              accessibilityRole="button"
              accessibilityLabel="Urgency. Tap to edit"
            >
              <View style={sc.fieldHeader}>
                <Ionicons name="flash" size={14} color={urgencyColor(pr.urgency)} />
                <Text
                  style={[
                    sc.fieldLabel,
                    { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
                  ]}
                >
                  Urgency
                </Text>
              </View>
              <Text
                style={[
                  sc.fieldValue,
                  {
                    color: urgencyColor(pr.urgency),
                    fontFamily: theme.fontFamily.semiBold,
                    textTransform: 'capitalize',
                  },
                ]}
              >
                {pr.urgency}
              </Text>
              {editingField === 'urgency' && (
                <View style={sc.inlineEditor}>
                  {(['low', 'medium', 'high', 'emergency'] as ParsedRequest['urgency'][]).map(
                    (urgency) => (
                      <ToggleChip
                        key={urgency}
                        label={urgency}
                        selected={pr.urgency === urgency}
                        onPress={() =>
                          updateParsed({
                            urgency,
                            risk_level: urgency === 'emergency' ? 'high' : pr.risk_level,
                          })
                        }
                        theme={theme}
                      />
                    )
                  )}
                </View>
              )}
            </Pressable>
            <Pressable
              style={[
                sc.fieldCard,
                sc.halfCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={() => setEditingField(editingField === 'risk_level' ? null : 'risk_level')}
              accessibilityRole="button"
              accessibilityLabel="Risk level. Tap to edit"
            >
              <View style={sc.fieldHeader}>
                <Ionicons name="warning" size={14} color={riskColor(pr.risk_level)} />
                <Text
                  style={[
                    sc.fieldLabel,
                    { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
                  ]}
                >
                  Risk Level
                </Text>
              </View>
              <Text
                style={[
                  sc.fieldValue,
                  {
                    color: riskColor(pr.risk_level),
                    fontFamily: theme.fontFamily.semiBold,
                    textTransform: 'capitalize',
                  },
                ]}
              >
                {pr.risk_level}
              </Text>
              {editingField === 'risk_level' && (
                <View style={sc.inlineEditor}>
                  {(['low', 'medium', 'high'] as ParsedRequest['risk_level'][]).map(
                    (risk_level) => (
                      <ToggleChip
                        key={risk_level}
                        label={risk_level}
                        selected={pr.risk_level === risk_level}
                        onPress={() => updateParsed({ risk_level })}
                        theme={theme}
                      />
                    )
                  )}
                </View>
              )}
            </Pressable>
          </View>

          {/* ── Confidence meter ─────────────────────────────────── */}
          <ConfidenceMeter confidence={pr.confidence} theme={theme} />

          {/* ── CTAs ─────────────────────────────────────────────── */}
          <View style={sc.ctaContainer}>
            <Button
              label="✓  Looks right — Find Providers"
              variant="primary"
              size="lg"
              fullWidth
              disabled={pr.service_bundle.length === 0 || pr.location_from === 'not specified'}
              onPress={handleLooksRight}
              style={{ marginBottom: 10 }}
            />
            <Button
              label="✏️  Edit my request"
              variant="outline"
              size="lg"
              fullWidth
              onPress={handleEditRequest}
            />
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17 },

  content: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  skeletonContent: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },

  loadingHeader: { alignItems: 'center', paddingVertical: 20, gap: 12 },
  loadingText: { fontSize: 15, textAlign: 'center' },

  fieldCard: { padding: 14, borderRadius: 14, borderWidth: 1 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  fieldLabel: { fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase' },
  fieldValue: { fontSize: 16, lineHeight: 22 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 12 },

  twoCol: { flexDirection: 'row', gap: 10 },
  halfCard: { flex: 1 },

  meterTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  meterFill: { height: '100%', borderRadius: 4 },
  confidencePct: { fontSize: 16 },
  confidenceLabel: { fontSize: 12 },

  clarifyCard: { padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 8 },
  manualCard: { padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 10 },
  clarifyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clarifyTitle: { fontSize: 15 },
  clarifyQuestion: { fontSize: 15, lineHeight: 22 },
  clarifyInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 4,
  },

  editOverlay: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  editLabel: { fontSize: 14 },
  editInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  inlineEditor: { marginTop: 12, gap: 8 },
  inlineLabel: { fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 4 },

  ctaContainer: { marginTop: 8 },
});
