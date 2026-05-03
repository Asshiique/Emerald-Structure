import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
      <Stack.Screen name="notifications-settings" />
      <Stack.Screen name="admin/index" />
      <Stack.Screen name="admin/staff/index" />
      <Stack.Screen name="admin/staff/add" />
      <Stack.Screen name="admin/students" />
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

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <DataProvider>
            <AuthProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AuthProvider>
          </DataProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
