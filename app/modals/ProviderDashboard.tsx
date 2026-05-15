/**
 * ProviderDashboard.tsx — Phase 4.3
 * Provider view: today's jobs, earnings, cancellation risk, and recommended slots.
 * Accessible from the Profile tab as a demo toggle.
 */

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Colors, FontSize, Radius, Shadows, Spacing } from '@/constants/theme';
import { BookingStatusColors, BookingStatusLabels } from '@/constants/BookingStatuses';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Static mock data for the provider dashboard ─────────────────────────────

const MOCK_PROVIDER = {
  id: 'prov_003',
  name: 'Aisha Malik',
  specializations: ['home_nurse', 'caregiver'],
  rating: 4.8,
  on_time_rate: 94,
  cancellation_rate: 3,
  experience_years: 7,
};

const TODAY_JOBS = [
  {
    booking_id: 'BK-001',
    service: 'Home Nurse',
    location: 'DHA Phase 5',
    time: '10:00 AM',
    status: 'en_route' as const,
    patient: 'Mr. Rashid (75)',
    amount: 3500,
  },
  {
    booking_id: 'BK-005',
    service: 'Home Nurse + Caregiver',
    location: 'Cantt',
    time: '2:00 PM',
    status: 'provider_assigned' as const,
    patient: 'Mrs. Fatima (82)',
    amount: 8500,
  },
];

const RECOMMENDED_SLOTS = [
  { time: 'Tomorrow, 9:00 AM', area: 'Gulberg', type: 'Home Nurse', demand: 'high' },
  { time: 'Tomorrow, 11:30 AM', area: 'Model Town', type: 'Caregiver', demand: 'medium' },
  { time: 'Tomorrow, 4:00 PM', area: 'DHA Phase 4', type: 'Elder Companion', demand: 'low' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: IoniconName;
  color: string;
  theme: ReturnType<typeof useTheme>;
}

function StatCard({ label, value, icon, color, theme }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: color + '12', borderColor: color + '25' }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text
        style={[
          styles.statValue,
          { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{label}</Text>
    </View>
  );
}

interface JobCardProps {
  job: (typeof TODAY_JOBS)[0];
  theme: ReturnType<typeof useTheme>;
}

function JobCard({ job, theme }: JobCardProps) {
  const statusColor = BookingStatusColors[job.status] ?? Colors.primary;
  const statusLabel = BookingStatusLabels[job.status] ?? job.status;

  return (
    <View
      style={[
        styles.jobCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        Shadows.sm,
      ]}
    >
      <View style={styles.jobHeader}>
        <View style={[styles.jobStatusPill, { backgroundColor: statusColor + '18' }]}>
          <View style={[styles.jobStatusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.jobStatusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text
          style={[
            styles.jobTime,
            { color: theme.colors.textMuted, fontFamily: theme.fontFamily.medium },
          ]}
        >
          {job.time}
        </Text>
      </View>

      <Text
        style={[
          styles.jobService,
          { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
        ]}
      >
        {job.service}
      </Text>

      <View style={styles.jobRow}>
        <Ionicons name="person-outline" size={13} color={theme.colors.textMuted} />
        <Text style={[styles.jobDetail, { color: theme.colors.textSecondary }]}>{job.patient}</Text>
      </View>
      <View style={styles.jobRow}>
        <Ionicons name="location-outline" size={13} color={theme.colors.textMuted} />
        <Text style={[styles.jobDetail, { color: theme.colors.textSecondary }]}>
          {job.location}
        </Text>
      </View>

      <View style={[styles.jobDivider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.jobFooter}>
        <Text style={[styles.jobId, { color: theme.colors.textMuted }]}>#{job.booking_id}</Text>
        <Text
          style={[
            styles.jobAmount,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          {job.amount.toLocaleString()} PKR
        </Text>
      </View>
    </View>
  );
}

const DEMAND_COLORS = { high: Colors.accent, medium: Colors.warning, low: Colors.primary };

interface SlotCardProps {
  slot: (typeof RECOMMENDED_SLOTS)[0];
  theme: ReturnType<typeof useTheme>;
}

function SlotCard({ slot, theme }: SlotCardProps) {
  const demandColor = DEMAND_COLORS[slot.demand as keyof typeof DEMAND_COLORS] ?? Colors.primary;
  return (
    <View
      style={[
        styles.slotCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.slotLeft}>
        <Text
          style={[
            styles.slotTime,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
          ]}
        >
          {slot.time}
        </Text>
        <Text style={[styles.slotInfo, { color: theme.colors.textSecondary }]}>
          {slot.type} · {slot.area}
        </Text>
      </View>
      <View style={[styles.demandBadge, { backgroundColor: demandColor + '18' }]}>
        <Text style={[styles.demandText, { color: demandColor }]}>
          {slot.demand.charAt(0).toUpperCase() + slot.demand.slice(1)} demand
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProviderDashboard() {
  const theme = useTheme();
  const router = useRouter();

  const totalEarnings = useMemo(() => TODAY_JOBS.reduce((sum, j) => sum + j.amount, 0), []);

  const highCancellationRisk = MOCK_PROVIDER.cancellation_rate > 10;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Provider Dashboard
          </Text>
          <Text style={[styles.headerDate, { color: theme.colors.textMuted }]}>{today}</Text>
        </View>
        <View style={[styles.demoBadge, { backgroundColor: Colors.primary + '18' }]}>
          <Ionicons name="flask-outline" size={13} color={Colors.primary} />
          <Text style={[styles.demoBadgeText, { color: Colors.primary }]}>Demo</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Provider Identity Card ── */}
        <View
          style={[
            styles.identityCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            Shadows.md,
          ]}
        >
          <View style={[styles.avatarCircle, { backgroundColor: Colors.primary + '20' }]}>
            <Text
              style={[
                styles.avatarInitial,
                { color: Colors.primary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {MOCK_PROVIDER.name.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.providerName,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {MOCK_PROVIDER.name}
            </Text>
            <Text style={[styles.providerSpec, { color: theme.colors.textSecondary }]}>
              {MOCK_PROVIDER.specializations.map((s) => s.replace(/_/g, ' ')).join(' · ')}
            </Text>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color={Colors.warning} />
            <Text
              style={[
                styles.ratingText,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              {MOCK_PROVIDER.rating}
            </Text>
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <StatCard
            label="On-time rate"
            value={`${MOCK_PROVIDER.on_time_rate}%`}
            icon="time-outline"
            color={Colors.accent}
            theme={theme}
          />
          <StatCard
            label="Cancellation"
            value={`${MOCK_PROVIDER.cancellation_rate}%`}
            icon="close-circle-outline"
            color={highCancellationRisk ? Colors.danger : Colors.accent}
            theme={theme}
          />
          <StatCard
            label="Experience"
            value={`${MOCK_PROVIDER.experience_years} yrs`}
            icon="medal-outline"
            color={Colors.primary}
            theme={theme}
          />
        </View>

        {/* ── Cancellation Warning ── */}
        {highCancellationRisk && (
          <View
            style={[
              styles.warningCard,
              { backgroundColor: Colors.danger + '10', borderColor: Colors.danger + '30' },
            ]}
          >
            <Ionicons name="warning-outline" size={18} color={Colors.danger} />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.warningTitle,
                  { color: Colors.danger, fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                High Cancellation Rate
              </Text>
              <Text style={[styles.warningBody, { color: theme.colors.textSecondary }]}>
                Your cancellation rate exceeds 10%. Repeated cancellations reduce visibility in
                match results and may affect your earnings.
              </Text>
            </View>
          </View>
        )}

        {/* ── Today's Earnings ── */}
        <View
          style={[
            styles.earningsCard,
            { backgroundColor: Colors.accent + '10', borderColor: Colors.accent + '25' },
          ]}
        >
          <View style={styles.earningsLeft}>
            <Ionicons name="wallet-outline" size={20} color={Colors.accent} />
            <View>
              <Text style={[styles.earningsLabel, { color: theme.colors.textSecondary }]}>
                Today Estimate
              </Text>
              <Text
                style={[
                  styles.earningsValue,
                  { color: Colors.accent, fontFamily: theme.fontFamily.bold },
                ]}
              >
                {totalEarnings.toLocaleString()} PKR
              </Text>
            </View>
          </View>
          <View style={styles.earningsRight}>
            <Text style={[styles.earningsCount, { color: theme.colors.textMuted }]}>
              {TODAY_JOBS.length} jobs
            </Text>
          </View>
        </View>

        {/* ── Today Jobs ── */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Today Jobs
          </Text>
          {TODAY_JOBS.map((job) => (
            <JobCard key={job.booking_id} job={job} theme={theme} />
          ))}
        </View>

        {/* ── Recommended Slots ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              Recommended Open Slots
            </Text>
            <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
          </View>
          <Text style={[styles.sectionDesc, { color: theme.colors.textSecondary }]}>
            High-demand slots in your service area for tomorrow.
          </Text>
          {RECOMMENDED_SLOTS.map((slot) => (
            <SlotCard key={slot.time} slot={slot} theme={theme} />
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: FontSize.lg },
  headerDate: { fontSize: FontSize.xs, marginTop: 2 },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  demoBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },

  scrollContent: { padding: Spacing.md, gap: Spacing.sm },

  // Identity card
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: FontSize.xl },
  providerName: { fontSize: FontSize.base },
  providerSpec: { fontSize: FontSize.xs, marginTop: 2, textTransform: 'capitalize' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: FontSize.sm },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: FontSize.base },
  statLabel: { fontSize: 10, textAlign: 'center' },

  // Warning
  warningCard: {
    flexDirection: 'row',
    gap: 10,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  warningTitle: { fontSize: FontSize.sm, marginBottom: 4 },
  warningBody: { fontSize: FontSize.xs, lineHeight: 17 },

  // Earnings
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  earningsLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  earningsLabel: { fontSize: FontSize.xs, marginBottom: 2 },
  earningsValue: { fontSize: FontSize.xl },
  earningsRight: {},
  earningsCount: { fontSize: FontSize.sm },

  // Section
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: FontSize.base, flex: 1 },
  sectionDesc: { fontSize: FontSize.xs, marginBottom: 4 },

  // Job card
  jobCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 6,
  },
  jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  jobStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  jobStatusDot: { width: 6, height: 6, borderRadius: 3 },
  jobStatusText: { fontSize: 11, fontWeight: '600' },
  jobTime: { fontSize: FontSize.sm },
  jobService: { fontSize: FontSize.base },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jobDetail: { fontSize: FontSize.sm, flex: 1 },
  jobDivider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobId: { fontSize: FontSize.xs },
  jobAmount: { fontSize: FontSize.base },

  // Slot card
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  slotLeft: { gap: 3 },
  slotTime: { fontSize: FontSize.sm },
  slotInfo: { fontSize: FontSize.xs },
  demandBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  demandText: { fontSize: 11, fontWeight: '600' },
});
