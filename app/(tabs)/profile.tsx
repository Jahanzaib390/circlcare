/**
 * profile.tsx — Phase 4.3 (rebuilt)
 * User profile overview + "Provider View" demo toggle.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Colors, FontSize, Radius, Shadows, Spacing } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Static mock user ─────────────────────────────────────────────────────────

const MOCK_USER = {
  name: 'Khalid Mehmood',
  phone: '+92 300 1234567',
  location: 'DHA Phase 5, Lahore',
  language: 'English / Urdu',
  family_contacts: ['Zara (Daughter)', 'Omar (Son)'],
  active_bookings: 1,
  total_bookings: 5,
  member_since: 'May 2025',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MenuRowProps {
  icon: IoniconName;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  theme: ReturnType<typeof useTheme>;
}

function MenuRow({ icon, label, value, onPress, destructive = false, theme }: MenuRowProps) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View
        style={[
          styles.menuIcon,
          { backgroundColor: destructive ? Colors.danger + '12' : theme.colors.border + '40' },
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={destructive ? Colors.danger : theme.colors.textSecondary}
        />
      </View>
      <Text
        style={[
          styles.menuLabel,
          {
            color: destructive ? Colors.danger : theme.colors.textPrimary,
            fontFamily: theme.fontFamily.medium,
            flex: 1,
          },
        ]}
      >
        {label}
      </Text>
      {value ? (
        <Text style={[styles.menuValue, { color: theme.colors.textMuted }]}>{value}</Text>
      ) : (
        !destructive && <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          Profile
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/modals/settings')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Identity ── */}
        <View
          style={[
            styles.identityCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            Shadows.md,
          ]}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: Colors.primary + '20' }]}>
            <Text
              style={[
                styles.avatarLetter,
                { color: Colors.primary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {MOCK_USER.name.charAt(0)}
            </Text>
          </View>
          <Text
            style={[
              styles.userName,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            {MOCK_USER.name}
          </Text>
          <Text style={[styles.userPhone, { color: theme.colors.textSecondary }]}>
            {MOCK_USER.phone}
          </Text>
          <Text style={[styles.memberSince, { color: theme.colors.textMuted }]}>
            Member since {MOCK_USER.member_since}
          </Text>

          {/* Stats row */}
          <View style={[styles.statsRow, { borderTopColor: theme.colors.border }]}>
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
                ]}
              >
                {MOCK_USER.active_bookings}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Active</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
                ]}
              >
                {MOCK_USER.total_bookings}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                Total Bookings
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
                ]}
              >
                {MOCK_USER.family_contacts.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                Family Contacts
              </Text>
            </View>
          </View>
        </View>

        {/* ── Demo: Provider View ── */}
        <TouchableOpacity
          style={[
            styles.providerBanner,
            { backgroundColor: Colors.primary + '0E', borderColor: Colors.primary + '28' },
          ]}
          onPress={() => router.push('/modals/ProviderDashboard')}
          activeOpacity={0.75}
        >
          <View style={[styles.providerBannerIcon, { backgroundColor: Colors.primary + '20' }]}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.providerBannerTitle,
                { color: Colors.primary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              Demo: Provider Dashboard
            </Text>
            <Text style={[styles.providerBannerSub, { color: theme.colors.textSecondary }]}>
              See provider jobs, earnings, and recommended open slots from the provider view.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>

        {/* ── Account section ── */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionLabelText, { color: theme.colors.textMuted }]}>Account</Text>
        </View>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <MenuRow
            icon="home-outline"
            label="Saved Location"
            value={MOCK_USER.location}
            theme={theme}
          />
          <MenuRow
            icon="language-outline"
            label="Language"
            value={MOCK_USER.language}
            theme={theme}
          />
          <MenuRow
            icon="people-outline"
            label="Family Contacts"
            value={`${MOCK_USER.family_contacts.length} added`}
            theme={theme}
          />
        </View>

        {/* ── Preferences section ── */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionLabelText, { color: theme.colors.textMuted }]}>
            Preferences
          </Text>
        </View>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <MenuRow icon="notifications-outline" label="Notifications" theme={theme} />
          <MenuRow icon="moon-outline" label="Appearance" theme={theme} />
        </View>

        {/* ── Support section ── */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionLabelText, { color: theme.colors.textMuted }]}>Support</Text>
        </View>
        <View
          style={[
            styles.menuCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <MenuRow icon="help-circle-outline" label="Help & FAQ" theme={theme} />
          <MenuRow icon="document-text-outline" label="Privacy Policy" theme={theme} />
          <MenuRow icon="log-out-outline" label="Sign Out" destructive theme={theme} />
        </View>

        {/* ── Version tag ── */}
        <Text style={[styles.versionTag, { color: theme.colors.textMuted }]}>
          CirclCare AI · v1.0.0-hackathon
        </Text>

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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: FontSize.xl },

  scrollContent: { padding: Spacing.md, gap: Spacing.sm },

  // Identity card
  identityCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarLetter: { fontSize: 30 },
  userName: { fontSize: FontSize.xl },
  userPhone: { fontSize: FontSize.sm },
  memberSince: { fontSize: FontSize.xs },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: StyleSheet.hairlineWidth, height: '100%' },
  statValue: { fontSize: FontSize.xl },
  statLabel: { fontSize: 10, textAlign: 'center' },

  // Provider banner
  providerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  providerBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerBannerTitle: { fontSize: FontSize.sm, marginBottom: 3 },
  providerBannerSub: { fontSize: FontSize.xs, lineHeight: 17 },

  // Menu
  sectionLabel: { paddingTop: 8, paddingBottom: 4 },
  sectionLabelText: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8 },

  menuCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: FontSize.sm },
  menuValue: { fontSize: FontSize.xs },

  versionTag: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    marginTop: 8,
  },
});
