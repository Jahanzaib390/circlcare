import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';
import { ServiceCategory, ServiceDisplayNames } from '@/constants/ServiceCategories';
import type { Provider } from '@/types/provider';
import providersJson from '@/data/providers.json';

const PROVIDERS: Provider[] = providersJson as Provider[];

const ALL_SERVICES = Object.values(ServiceCategory);
const VERIFIED_PROVIDER_COUNT = PROVIDERS.filter((provider) => provider.verified).length;

function starColor(rating: number): string {
  if (rating >= 4.5) return '#F59E0B';
  if (rating >= 4.0) return '#F59E0B';
  if (rating >= 3.0) return '#F59E0B';
  return '#D1D5DB';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(name: string): string {
  const colors = [
    '#4F46E5',
    '#EC4899',
    '#10B981',
    '#F59E0B',
    '#3B82F6',
    '#8B5CF6',
    '#14B8A6',
    '#EF4444',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Provider Card ──────────────────────────────────────────────────────────

interface ProviderCardProps {
  provider: Provider;
  theme: ReturnType<typeof useTheme>;
  onPress: () => void;
}

function ProviderCard({ provider, theme, onPress }: ProviderCardProps) {
  const initColor = avatarColor(provider.name);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Avatar + name + verified */}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: initColor + '18' }]}>
          <Text
            style={[styles.avatarText, { color: initColor, fontFamily: theme.fontFamily.bold }]}
          >
            {getInitials(provider.name)}
          </Text>
        </View>
        <View style={styles.cardTopCenter}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.providerName,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
              ]}
              numberOfLines={1}
            >
              {provider.name}
            </Text>
            {provider.verified && (
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={Colors.primary}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
          <Text
            style={[
              styles.specialization,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
            ]}
            numberOfLines={1}
          >
            {provider.specializations.slice(0, 3).join(' · ')}
          </Text>
        </View>
        <View style={styles.ratingCol}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={starColor(provider.rating)} />
            <Text
              style={[
                styles.ratingNum,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {provider.rating}
            </Text>
          </View>
          <Text style={[styles.reviewCount, { color: theme.colors.textMuted }]}>
            ({provider.review_count})
          </Text>
        </View>
      </View>

      {/* Service chips */}
      <View style={styles.chipRow}>
        {provider.services.slice(0, 4).map((svc) => (
          <View
            key={svc}
            style={[
              styles.chip,
              {
                backgroundColor: theme.colors.primary + '0C',
                borderColor: theme.colors.primary + '1A',
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: theme.colors.primary, fontFamily: theme.fontFamily.medium },
              ]}
            >
              {ServiceDisplayNames[svc] ?? svc}
            </Text>
          </View>
        ))}
        {provider.services.length > 4 && (
          <Text style={[styles.moreChip, { color: theme.colors.textMuted }]}>
            +{provider.services.length - 4}
          </Text>
        )}
      </View>

      {/* Bottom row: area + price + experience */}
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="location-outline" size={12} color={theme.colors.textMuted} />
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
            {provider.areas[0]}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="cash-outline" size={12} color={theme.colors.textMuted} />
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
            PKR {provider.hourly_rate}/h
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} />
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
            {provider.experience_years}y exp
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProvidersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Set<ServiceCategory>>(new Set());

  const toggleFilter = (cat: ServiceCategory) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = PROVIDERS;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.areas.some((a) => a.toLowerCase().includes(q)) ||
          p.specializations.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filters.size > 0) {
      list = list.filter((p) => p.services.some((s) => filters.has(s)));
    }
    return list;
  }, [search, filters]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          Providers
        </Text>
        <Text
          style={[
            styles.headerCount,
            { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
          ]}
        >
          {VERIFIED_PROVIDER_COUNT} verified
        </Text>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchBox,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name="search" size={18} color={theme.colors.textMuted} />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.fontFamily.regular,
            },
          ]}
          placeholder="Search by name, area, or specialization..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {ALL_SERVICES.map((cat) => {
          const selected = filters.has(cat);
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceElevated,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => toggleFilter(cat)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: selected ? '#fff' : theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.medium,
                  },
                ]}
              >
                {ServiceDisplayNames[cat]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Provider list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: theme.colors.primary + '10' }]}>
              <Ionicons name="people-outline" size={48} color={theme.colors.primary + '60'} />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              No providers found
            </Text>
            <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
              Try adjusting your search or filters to see more results.
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {filtered.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                theme={theme}
                onPress={() =>
                  router.push({
                    pathname: '/modals/provider-detail',
                    params: { providerId: provider.id },
                  })
                }
              />
            ))}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: FontSize.xxl },
  headerCount: { fontSize: FontSize.sm },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, padding: 0 },

  filterScroll: { maxHeight: 42, marginBottom: Spacing.sm },
  filterContent: { paddingHorizontal: Spacing.lg, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterChipText: { fontSize: FontSize.xs },

  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: 4, paddingBottom: 104 },
  cardList: { gap: 12 },

  // ── Card ──
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.base },
  cardTopCenter: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  providerName: { fontSize: FontSize.base, maxWidth: '80%' },
  specialization: { fontSize: FontSize.xs },
  ratingCol: { alignItems: 'center', gap: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingNum: { fontSize: FontSize.sm },
  reviewCount: { fontSize: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: { fontSize: 10 },
  moreChip: { fontSize: 11 },

  cardFooter: {
    flexDirection: 'row',
    gap: 14,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11 },

  // ── Empty ──
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: FontSize.xl, marginBottom: 8 },
  emptySub: { fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
});
