import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ONBOARDING_KEY } from '@/constants/StorageKeys';
import { setLocale } from '@/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        animationDuration: 300,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="request/understand"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="request/match"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="request/quote"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen name="request/confirm" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen
        name="request/status"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="request/feedback"
        options={{ headerShown: false, animation: 'slide_from_right' }}
      />
      <Stack.Screen name="modals/dispute" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen
        name="modals/provider-detail"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="modals/location-picker"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="modals/settings"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="modals/ProviderDashboard"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const [isReady, setIsReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const locale = await AsyncStorage.getItem('circlcare_locale');
        setLocale(locale === 'ur' ? 'ur' : 'en');
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasOnboarded(value === 'true');
      } catch {
        setHasOnboarded(false);
      } finally {
        setIsReady(true);
      }
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (fontsLoaded && isReady) {
      SplashScreen.hideAsync();
      if (hasOnboarded === false) {
        // Use a small timeout to allow layout to mount, avoiding router warnings
        setTimeout(() => router.replace('/onboarding'), 0);
      }
    }
  }, [fontsLoaded, isReady, hasOnboarded, router]);

  if (!fontsLoaded || !isReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <RootLayoutNav />
            <StatusBar style="auto" />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
