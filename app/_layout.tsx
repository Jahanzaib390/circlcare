import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="request/understand" options={{ headerShown: false }} />
      <Stack.Screen name="request/match" options={{ headerShown: false }} />
      <Stack.Screen name="request/quote" options={{ headerShown: false }} />
      <Stack.Screen name="request/confirm" options={{ headerShown: false }} />
      <Stack.Screen name="request/status" options={{ headerShown: false }} />
      <Stack.Screen name="request/feedback" options={{ headerShown: false }} />
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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
