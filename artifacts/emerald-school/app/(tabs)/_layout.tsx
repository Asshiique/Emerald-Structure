import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Redirect, Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout({ role }: { role: string }) {
  const isParent = role === "parent" || role === "student";

  return (
    <NativeTabs>
      {isParent && (
        <>
          <NativeTabs.Trigger name="index">
            <Icon sf={{ default: "house", selected: "house.fill" }} />
            <Label>Home</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="notices">
            <Icon sf={{ default: "bell", selected: "bell.fill" }} />
            <Label>Notices</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="homework">
            <Icon sf={{ default: "book", selected: "book.fill" }} />
            <Label>Homework</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="fees">
            <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
            <Label>Fees</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="recognition">
            <Icon sf={{ default: "star", selected: "star.fill" }} />
            <Label>Recognition</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="profile">
            <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
            <Label>Profile</Label>
          </NativeTabs.Trigger>
        </>
      )}
    </NativeTabs>
  );
}

function ClassicTabLayout({ role }: { role: string }) {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const common = {
    tabBarActiveTintColor: "#C0282A",
    tabBarInactiveTintColor: "#888882",
    headerShown: false,
    tabBarStyle: {
      position: "absolute" as const,
      backgroundColor: isIOS ? "transparent" : colors.card,
      borderTopWidth: isWeb ? 1 : 0,
      borderTopColor: "rgba(0,0,0,0.08)",
      elevation: 0,
      height: isWeb ? 84 : 60,
    },
    tabBarBackground: () =>
      isIOS ? (
        <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      ) : isWeb ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
      ) : null,
    tabBarLabelStyle: { fontSize: 9, fontWeight: "600" as const, marginBottom: 2 },
  };

  return (
    <Tabs screenOptions={common}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="house.fill" tintColor={color} size={20} /> : <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: "Notices",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="bell.fill" tintColor={color} size={20} /> : <Feather name="bell" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="homework"
        options={{
          title: "Homework",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="book.fill" tintColor={color} size={20} /> : <Feather name="book" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          title: "Fees",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="creditcard.fill" tintColor={color} size={20} /> : <Feather name="credit-card" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recognition"
        options={{
          title: "Recognition",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="star.fill" tintColor={color} size={20} /> : <Feather name="star" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.circle.fill" tintColor={color} size={20} /> : <Feather name="user" size={20} color={color} />,
        }}
      />
      {/* progress is accessible via the Profile tab link — not shown in tab bar to keep it clean */}
      <Tabs.Screen name="progress" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  const role = user?.role ?? "parent";
  if (role === "admin") return <Redirect href="/admin" />;
  if (role === "teacher") return <Redirect href="/teacher" />;
  if (isLiquidGlassAvailable()) return <NativeTabLayout role={role} />;
  return <ClassicTabLayout role={role} />;
}
