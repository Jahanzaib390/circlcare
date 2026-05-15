import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  DimensionValue,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useRequestStore } from '@/hooks/useRequestStore';
import { useMatchResults } from '@/hooks/useMatchResults';
import { useMatchStore } from '@/hooks/useMatchStore';
import { Button } from '@/components/ui/Button';
import type { MatchResult } from '@/types/match';
import { Colors } from '@/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Trust badge ────────────────────────────────────────────────────────────────
function TrustBadge({
  icon,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}) {
  return (
    <View style={[tb.badge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Ionicons name={icon} size={11} color={color} />
      <Text style={[tb.label, { color }]}>{label}</Text>
    </View>
  );
}

const tb = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  label: { fontSize: 11, fontWeight: '600' },
});

// ── Star rating row ────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < full ? 'star' : half && i === full ? 'star-half' : 'star-outline'}
          size={13}
          color="#F59E0B"
        />
      ))}
      <Text style={{ fontSize: 12, color: '#F59E0B', marginLeft: 2, fontWeight: '700' }}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

// ── Provider card ──────────────────────────────────────────────────────────────
function ProviderCard({
  match,
  isHero,
  onViewProfile,
  onBook,
  theme,
  animValue,
}: {
  match: MatchResult;
  isHero: boolean;
  onViewProfile: () => void;
  onBook: () => void;
  theme: ReturnType<typeof useTheme>;
  animValue: Animated.Value;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(match.score.total * 100);
  const p = match.provider;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const rankColor =
    match.rank === 1 ? Colors.accent : match.rank === 2 ? Colors.primary : Colors.warning;

  const slideStyle = {
    opacity: animValue,
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [60, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={slideStyle}>
      <Pressable
        style={[
          s.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isHero ? rankColor + '60' : theme.colors.border,
            borderWidth: isHero ? 1.5 : 1,
          },
        ]}
        onPress={onViewProfile}
        accessibilityLabel={`View ${p.name}`}
        accessibilityRole="button"
      >
        {/* ── Header gradient band ── */}
        <View style={[s.cardHeader, { backgroundColor: rankColor + '15' }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <View style={[s.rankBadge, { backgroundColor: rankColor }]}>
                <Text style={s.rankText}>#{match.rank}</Text>
              </View>
              <Text
                style={[
                  s.providerName,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
                ]}
                numberOfLines={1}
              >
                {p.name}
              </Text>
            </View>
            <StarRating rating={p.rating} />
          </View>
          <View style={[s.scorePill, { backgroundColor: rankColor }]}>
            <Text style={s.scorePct}>{pct}%</Text>
            <Text style={s.scoreLabel}>match</Text>
          </View>
        </View>

        {/* ── Trust badges ── */}
        <View style={s.badgeRow}>
          {p.verified && (
            <TrustBadge icon="shield-checkmark" label="Verified" color={Colors.accent} />
          )}
          <TrustBadge
            icon="person"
            label={p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}
            color={p.gender === 'female' ? '#EC4899' : '#3B82F6'}
          />
          {p.languages.slice(0, 2).map((l) => (
            <TrustBadge key={l} icon="globe-outline" label={l} color={Colors.primary} />
          ))}
          <TrustBadge
            icon="time-outline"
            label={`${Math.round(p.on_time_score * 100)}% on-time`}
            color={p.on_time_score >= 0.9 ? Colors.accent : Colors.warning}
          />
        </View>

        {/* ── Distance + travel ── */}
        <View style={[s.travelRow, { borderColor: theme.colors.border }]}>
          <View style={s.travelItem}>
            <Ionicons name="location-outline" size={13} color={theme.colors.textMuted} />
            <Text style={[s.travelText, { color: theme.colors.textMuted }]}>
              {match.distance_km.toFixed(1)} km away
            </Text>
          </View>
          <View style={s.travelItem}>
            <Ionicons name="car-outline" size={13} color={theme.colors.textMuted} />
            <Text style={[s.travelText, { color: theme.colors.textMuted }]}>
              ~{match.suggested_arrival_buffer_minutes} min incl. elder buffer
            </Text>
          </View>
        </View>

        {/* ── Why selected accordion ── */}
        {match.explanation && (
          <>
            <Pressable style={s.accordionToggle} onPress={toggleExpand} accessibilityRole="button">
              <Ionicons name="sparkles" size={14} color={Colors.primary} />
              <Text
                style={[
                  s.accordionLabel,
                  { color: Colors.primary, fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                Why selected
              </Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={Colors.primary}
                style={{ marginLeft: 'auto' }}
              />
            </Pressable>
            {expanded && (
              <Text
                style={[
                  s.explanationText,
                  { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {match.explanation}
              </Text>
            )}
          </>
        )}

        {/* ── Select CTA (hero only) ── */}
        {isHero && (
          <Button
            label="Book this Provider"
            variant="primary"
            size="md"
            fullWidth
            onPress={onBook}
            style={{ marginTop: 12 }}
          />
        )}
        {!isHero && (
          <Button
            label="Choose Provider"
            variant="secondary"
            size="sm"
            fullWidth
            onPress={onBook}
            style={{ marginHorizontal: 14, marginBottom: 14 }}
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Rejected provider row ──────────────────────────────────────────────────────
function RejectedRow({
  name,
  reason,
  theme,
}: {
  name: string;
  reason: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[s.rejectedRow, { borderColor: theme.colors.border }]}>
      <Ionicons name="close-circle" size={16} color={Colors.danger} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text
          style={[
            s.rejectedName,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          {name}
        </Text>
        <Text
          style={[
            s.rejectedReason,
            { color: theme.colors.textMuted, fontFamily: theme.fontFamily.regular },
          ]}
        >
          {reason}
        </Text>
      </View>
    </View>
  );
}

// ── Skeleton card ──────────────────────────────────────────────────────────────
function SkeletonCard({ theme }: { theme: ReturnType<typeof useTheme> }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);
  const block = (w: number | string, h = 14) => (
    <Animated.View
      style={{
        width: w as DimensionValue,
        height: h,
        borderRadius: 6,
        backgroundColor: '#9CA3AF',
        opacity,
        marginVertical: 4,
      }}
    />
  );
  return (
    <View
      style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={[s.cardHeader, { backgroundColor: theme.colors.border + '30' }]}>
        {block('60%', 18)}
        {block('40%', 12)}
      </View>
      <View style={{ padding: 12 }}>
        {block('80%', 12)}
        {block('60%', 12)}
        {block('90%', 12)}
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function MatchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { parsedRequest } = useRequestStore();
  const { matchResponse, setSelectedMatch } = useMatchStore();
  const { mutate: runMatch, isPending, isError } = useMatchResults();

  const [showRejected, setShowRejected] = useState(false);
  const didRunMatchRef = useRef(false);

  // Animated values for each card slot
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Trigger match on mount
  useEffect(() => {
    if (parsedRequest && !didRunMatchRef.current) {
      didRunMatchRef.current = true;
      runMatch({ parsedRequest });
    }
  }, [parsedRequest, runMatch]);

  // Stagger card entrance animation once results arrive
  useEffect(() => {
    if (matchResponse && matchResponse.top_matches.length > 0) {
      Animated.stagger(
        120,
        cardAnims.map((anim) =>
          Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 })
        )
      ).start();
    }
  }, [cardAnims, matchResponse]);

  const handleViewProfile = (match: MatchResult) => {
    setSelectedMatch(match);
    router.push('/modals/provider-detail');
  };

  const handleBook = (match: MatchResult) => {
    setSelectedMatch(match);
    router.push('/request/quote');
  };

  const toggleRejected = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowRejected((v) => !v);
  };

  // ── Loading ──
  if (isPending || (!matchResponse && !isError)) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.colors.background }]}>
        <View style={[s.topBar, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <Text
            style={[
              s.topTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Finding Providers
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={s.loadingContent}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginBottom: 16 }}
          />
          <Text
            style={[
              s.loadingText,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            Matching providers to your request…
          </Text>
          <SkeletonCard theme={theme} />
          <SkeletonCard theme={theme} />
          <SkeletonCard theme={theme} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.colors.background }]}>
        <View style={[s.topBar, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <Text
            style={[
              s.topTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Match Results
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.danger} />
          <Text
            style={[
              s.emptyTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Connection Error
          </Text>
          <Text
            style={[
              s.emptyBody,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            Could not reach the server. Please check your connection and try again.
          </Text>
          <Button
            label="Retry"
            variant="primary"
            size="md"
            onPress={() => parsedRequest && runMatch({ parsedRequest })}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const topMatches = matchResponse?.top_matches ?? [];
  const filteredOut = matchResponse?.filtered_out ?? [];

  // ── No results ──
  if (topMatches.length === 0) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: theme.colors.background }]}>
        <View style={[s.topBar, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <Text
            style={[
              s.topTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Match Results
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.centered}>
          <Ionicons name="search-outline" size={48} color={theme.colors.textMuted} />
          <Text
            style={[
              s.emptyTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            No Providers Found
          </Text>
          <Text
            style={[
              s.emptyBody,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            No available providers match your current requirements. Try relaxing some preferences or
            selecting a different area.
          </Text>
          <Button
            label="Edit Request"
            variant="primary"
            size="md"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </View>
        {filteredOut.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            <Text
              style={[
                s.sectionTitle,
                { color: theme.colors.textMuted, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              {filteredOut.length} provider(s) did not meet your requirements
            </Text>
            {filteredOut.map(({ provider, reason }) => (
              <RejectedRow key={provider.id} name={provider.name} reason={reason} theme={theme} />
            ))}
          </View>
        )}
      </SafeAreaView>
    );
  }

  const hero = topMatches[0];
  const alternatives = topMatches.slice(1);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: theme.colors.background }]}>
      {/* ── Top bar ── */}
      <View style={[s.topBar, { borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text
          style={[
            s.topTitle,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          {topMatches.length} Match{topMatches.length !== 1 ? 'es' : ''} Found
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* ── Section header ── */}
        <View style={s.sectionHeader}>
          <View style={[s.sectionDot, { backgroundColor: Colors.accent }]} />
          <Text
            style={[
              s.sectionLabel,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.medium },
            ]}
          >
            Top Recommendation
          </Text>
        </View>

        {/* ── Hero card ── */}
        <ProviderCard
          match={hero}
          isHero
          onViewProfile={() => handleViewProfile(hero)}
          onBook={() => handleBook(hero)}
          theme={theme}
          animValue={cardAnims[0]}
        />

        {/* ── Alternatives ── */}
        {alternatives.length > 0 && (
          <>
            <View style={[s.sectionHeader, { marginTop: 20 }]}>
              <View style={[s.sectionDot, { backgroundColor: Colors.primary }]} />
              <Text
                style={[
                  s.sectionLabel,
                  { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.medium },
                ]}
              >
                Other Options
              </Text>
            </View>
            {alternatives.map((match, idx) => (
              <ProviderCard
                key={match.provider.id}
                match={match}
                isHero={false}
                onViewProfile={() => handleViewProfile(match)}
                onBook={() => handleBook(match)}
                theme={theme}
                animValue={cardAnims[idx + 1]}
              />
            ))}
          </>
        )}

        {/* ── Filtered out section ── */}
        {filteredOut.length > 0 && (
          <View
            style={[
              s.rejectedSection,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Pressable style={s.rejectedToggle} onPress={toggleRejected} accessibilityRole="button">
              <Ionicons name="funnel-outline" size={15} color={theme.colors.textMuted} />
              <Text
                style={[
                  s.rejectedToggleText,
                  { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
                ]}
              >
                {filteredOut.length} provider(s) not recommended
              </Text>
              <Ionicons
                name={showRejected ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={theme.colors.textMuted}
                style={{ marginLeft: 'auto' }}
              />
            </Pressable>
            {showRejected &&
              filteredOut.map(({ provider, reason }) => (
                <RejectedRow key={provider.id} name={provider.name} reason={reason} theme={theme} />
              ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17 },
  content: { padding: 16, paddingBottom: 40 },
  loadingContent: { padding: 24, alignItems: 'center' },
  loadingText: { fontSize: 15, marginBottom: 24, textAlign: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 13, marginBottom: 8 },

  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  providerName: { fontSize: 16, flex: 1 },
  scorePill: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 52,
  },
  scorePct: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 20 },
  scoreLabel: { color: '#ffffffcc', fontSize: 10, fontWeight: '600' },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 2,
  },

  travelRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  travelItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  travelText: { fontSize: 12 },

  accordionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  accordionLabel: { fontSize: 13 },
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },

  rejectedSection: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
  },
  rejectedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
  },
  rejectedToggleText: { fontSize: 13 },
  rejectedRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rejectedName: { fontSize: 13, marginBottom: 2 },
  rejectedReason: { fontSize: 12, lineHeight: 17 },
});
