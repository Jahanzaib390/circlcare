import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useMatchStore } from '@/hooks/useMatchStore';
import { useTheme } from '@/hooks/useTheme';
import type { Provider } from '@/types/provider';
import providersJson from '@/data/providers.json';

const PROVIDERS = providersJson as Provider[];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function DetailPill({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.pill, { borderColor: color + '35', backgroundColor: color + '12' }]}>
      <Ionicons name={icon} size={14} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.pillLabel, { color }]}>{label}</Text>
        <Text style={[styles.pillValue, { color }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProviderDetailModal() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { selectedMatch } = useMatchStore();

  const requestedProviderId = firstParam(params.providerId);
  const selectedMatchForProvider =
    !requestedProviderId || selectedMatch?.provider.id === requestedProviderId
      ? selectedMatch
      : null;
  const provider =
    selectedMatchForProvider?.provider ??
    PROVIDERS.find((candidate) => candidate.id === requestedProviderId);
  const isMatchContext = Boolean(selectedMatchForProvider);

  const handleBook = () => {
    if (isMatchContext) {
      router.dismiss();
      router.push('/request/quote');
      return;
    }

    router.dismiss();
    router.replace('/');
  };

  if (!provider) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.empty}>
          <Ionicons name="person-circle-outline" size={48} color={theme.colors.textMuted} />
          <Text
            style={[
              styles.emptyTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Provider unavailable
          </Text>
          <Button label="Close" variant="primary" size="md" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text
          style={[
            styles.topTitle,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          Provider Profile
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary + '18' }]}>
            <Text
              style={[
                styles.avatarText,
                { color: Colors.primary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {provider.name
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.name,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {provider.name}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
              ]}
            >
              {provider.provider_type === 'agency' ? 'Care agency' : 'Individual provider'}
              {selectedMatchForProvider ? ` - Rank #${selectedMatchForProvider.rank}` : ''}
            </Text>
          </View>
          <View style={[styles.matchBadge, { backgroundColor: Colors.accent }]}>
            <Text style={styles.matchScore}>
              {selectedMatchForProvider
                ? `${Math.round(selectedMatchForProvider.score.total * 100)}%`
                : provider.rating.toFixed(1)}
            </Text>
          </View>
        </View>

        <View style={styles.pillGrid}>
          <DetailPill
            icon="shield-checkmark"
            label="Trust"
            value={provider.verified ? 'Verified' : 'Not verified'}
            color={provider.verified ? Colors.accent : Colors.warning}
          />
          <DetailPill
            icon="star"
            label="Rating"
            value={`${provider.rating.toFixed(1)} (${provider.review_count})`}
            color="#F59E0B"
          />
          <DetailPill
            icon="time"
            label="On-time"
            value={`${Math.round(provider.on_time_score * 100)}%`}
            color={Colors.primary}
          />
          <DetailPill
            icon="car"
            label={isMatchContext ? 'Arrival' : 'Radius'}
            value={
              selectedMatchForProvider
                ? `~${selectedMatchForProvider.suggested_arrival_buffer_minutes} min`
                : `${provider.service_radius_km} km`
            }
            color={Colors.primaryLight}
          />
        </View>

        <View style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Why selected
          </Text>
          <Text
            style={[
              styles.body,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {selectedMatchForProvider?.explanation ??
              `${provider.name} is a strong match for this request based on service fit, reliability, and location.`}
          </Text>
        </View>

        <View style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Services
          </Text>
          <View style={styles.chipRow}>
            {provider.services.map((service) => (
              <View
                key={service}
                style={[
                  styles.chip,
                  {
                    backgroundColor: theme.colors.primary + '12',
                    borderColor: theme.colors.primary + '30',
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: theme.colors.primary }]}>
                  {service.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Fit details
          </Text>
          <Text
            style={[
              styles.body,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {provider.gender.charAt(0).toUpperCase() + provider.gender.slice(1)} provider -{' '}
            {provider.languages.join(', ')} - {provider.experience_years} years experience -{' '}
            {selectedMatchForProvider
              ? `${selectedMatchForProvider.distance_km.toFixed(1)} km away`
              : `serves ${provider.areas.slice(0, 3).join(', ')}`}
          </Text>
          {provider.bio && (
            <Text
              style={[
                styles.body,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  marginTop: 10,
                },
              ]}
            >
              {provider.bio}
            </Text>
          )}
        </View>

        <Button
          label={isMatchContext ? 'Book this Provider' : 'Start a Care Request'}
          variant="primary"
          size="md"
          fullWidth
          onPress={handleBook}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17 },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22 },
  name: { fontSize: 22, marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  matchBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  matchScore: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  pill: {
    width: '48%',
    minHeight: 58,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  pillValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  section: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 15, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 21 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  emptyTitle: { fontSize: 20 },
});
