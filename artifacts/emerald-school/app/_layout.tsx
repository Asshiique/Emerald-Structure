import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { auth } from "@/lib/firebase";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// setBaseUrl is safe at module level — it's just a string, not auth-dependent.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
if (!API_URL) {
  console.warn(
    "[Emerald] ⚠️  EXPO_PUBLIC_API_URL is not set.\n" +
    "API calls will fail. Set it in .env.local (local dev) or eas.json (builds).\n" +
    "Example: EXPO_PUBLIC_API_URL=http://192.168.x.x:3000"
  );
}
setBaseUrl(API_URL);

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="notice/[id]" />
      <Stack.Screen name="timetable" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="id-card" />
      <Stack.Screen name="gallery" />
      <Stack.Screen name="notifications-settings" />
      <Stack.Screen name="admin/index" />
      <Stack.Screen name="admin/staff/index" />
      <Stack.Screen name="admin/staff/add" />
      <Stack.Screen name="admin/staff/[id]" />
      <Stack.Screen name="admin/students" />
      <Stack.Screen name="admin/students/[id]" />
      <Stack.Screen name="admin/fees" />
      <Stack.Screen name="admin/post-notice" />
      <Stack.Screen name="admin/post-homework" />
      <Stack.Screen name="admin/settings" />
      <Stack.Screen name="admin/performance/index" />
      <Stack.Screen name="admin/performance/[id]" />
      <Stack.Screen name="teacher/index" />
      <Stack.Screen name="teacher/students" />
      <Stack.Screen name="teacher/add-student" />
      <Stack.Screen name="teacher/attendance" />
      <Stack.Screen name="teacher/add-homework" />
      <Stack.Screen name="teacher/performance" />
    </Stack>
  );
}

function AppReadyNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isLoading: authLoading, user } = useAuth();

  // Register the token getter once Firebase has resolved the current user.
  // This must be inside AuthProvider so auth.currentUser is populated before
  // any React Query hooks fire their first request.
  useEffect(() => {
    setAuthTokenGetter(() => auth.currentUser?.getIdToken() ?? null);
  }, [user?.uid]);

  useEffect(() => {
    if (fontsLoaded && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authLoading]);

  // Only block rendering until fonts load and the cold-boot auth check resolves.
  // DataContext's Firestore loading must NOT gate the navigator — doing so would
  // unmount the Stack mid-login and break router.replace() calls.
  if (!fontsLoaded || authLoading) return null;
  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DataProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <AppReadyNavigator fontsLoaded={fontsLoaded || !!fontError} />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </DataProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
