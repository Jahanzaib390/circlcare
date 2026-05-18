import { Alert, Pressable, StyleSheet, Text, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@/components/ui/Button';
import { DEMO_MODE_KEY, ONBOARDING_KEY, USER_PROFILE_KEY } from '@/constants/StorageKeys';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/apiClient';

interface AgentStatus {
  provider: string;
  model: string;
  live_agent_ready: boolean;
  require_live_agents: boolean;
  seeded_parse_enabled: boolean;
}

/** Settings Modal — built in Phase 7 */
export default function SettingsModal() {
  const theme = useTheme();
  const router = useRouter();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DEMO_MODE_KEY).then((val) => {
      if (val === 'true') setIsDemoMode(true);
    });
    apiClient
      .get<AgentStatus>('/api/agent/status')
      .then(setAgentStatus)
      .catch(() => setAgentStatus(null));
  }, []);

  const toggleDemoMode = async (value: boolean) => {
    setIsDemoMode(value);
    await AsyncStorage.setItem(DEMO_MODE_KEY, value ? 'true' : 'false');

    const profileRaw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (profileRaw) {
      const profile = JSON.parse(profileRaw);
      await AsyncStorage.setItem(
        USER_PROFILE_KEY,
        JSON.stringify({
          ...profile,
          preferences: {
            ...profile.preferences,
            demo_mode: value,
          },
        })
      );
    }
  };

  const resetOnboarding = () => {
    Alert.alert('Reset onboarding?', 'The setup slides will appear again next launch.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove([ONBOARDING_KEY, USER_PROFILE_KEY]);
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <Text
            style={[
              styles.title,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Settings
          </Text>
          <View style={styles.iconButton} />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
          <View>
            <Text
              style={[
                styles.settingLabel,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              Demo Mode
            </Text>
            <Text
              style={[
                styles.settingSub,
                { color: theme.colors.textMuted, fontFamily: theme.fontFamily.regular },
              ]}
            >
              Enables scripted scenarios for presentations
            </Text>
          </View>
          <Switch
            value={isDemoMode}
            onValueChange={toggleDemoMode}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        <View style={[styles.agentCard, { borderColor: theme.colors.border }]}>
          <View style={styles.agentHeader}>
            <Ionicons
              name={agentStatus?.live_agent_ready ? 'sparkles' : 'warning-outline'}
              size={18}
              color={agentStatus?.live_agent_ready ? theme.colors.accent : theme.colors.warning}
            />
            <Text
              style={[
                styles.agentTitle,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              Agent Runtime
            </Text>
          </View>
          <Text
            style={[
              styles.agentSub,
              { color: theme.colors.textMuted, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {agentStatus
              ? `${agentStatus.provider} / ${agentStatus.model}`
              : 'Backend status unavailable'}
          </Text>
          {agentStatus && (
            <Text
              style={[
                styles.agentStatus,
                {
                  color: agentStatus.live_agent_ready ? theme.colors.accent : theme.colors.warning,
                  fontFamily: theme.fontFamily.medium,
                },
              ]}
            >
              {agentStatus.live_agent_ready
                ? 'Live LLM calls enabled'
                : 'Not ready for judged live-agent demo'}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Button label="Reset Onboarding" variant="outline" fullWidth onPress={resetOnboarding} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, textAlign: 'center' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLabel: { fontSize: 16, marginBottom: 4 },
  settingSub: { fontSize: 13 },
  agentCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  agentTitle: { fontSize: 15 },
  agentSub: { fontSize: 13, marginBottom: 6 },
  agentStatus: { fontSize: 13 },
  actions: { marginTop: 24 },
});
