import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout({ role }: { role: string }) {
  const isParent = role === "parent" || role === "student";
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";

  return (
    <NativeTabs>
      {isParent && (
        <>
          <NativeTabs.Trigger name="index">
            <Icon sf={{ default: "house", selected: "house.fill" }} />
            <Label>Home</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="homework">
            <Icon sf={{ default: "book", selected: "book.fill" }} />
            <Label>Homework</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="progress">
            <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
            <Label>Progress</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="fees">
            <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
            <Label>Fees</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="profile">
            <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
            <Label>Profile</Label>
          </NativeTabs.Trigger>
        </>
      )}
      {isTeacher && (
        <>
          <NativeTabs.Trigger name="teacher/index">
            <Icon sf={{ default: "house", selected: "house.fill" }} />
            <Label>Dashboard</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="teacher/students">
            <Icon sf={{ default: "person.3", selected: "person.3.fill" }} />
            <Label>Students</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="teacher/attendance">
            <Icon sf={{ default: "checklist", selected: "checklist" }} />
            <Label>Attendance</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="teacher/add-homework">
            <Icon sf={{ default: "book", selected: "book.fill" }} />
            <Label>Homework</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="teacher/performance">
            <Icon sf={{ default: "star", selected: "star.fill" }} />
            <Label>Performance</Label>
          </NativeTabs.Trigger>
        </>
      )}
      {isAdmin && (
        <>
          <NativeTabs.Trigger name="admin/index">
            <Icon sf={{ default: "house", selected: "house.fill" }} />
            <Label>Dashboard</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="admin/staff/index">
            <Icon sf={{ default: "person.3", selected: "person.3.fill" }} />
            <Label>Staff</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="admin/students">
            <Icon sf={{ default: "graduationcap", selected: "graduationcap.fill" }} />
            <Label>Students</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="admin/post-homework">
            <Icon sf={{ default: "book", selected: "book.fill" }} />
            <Label>Academic</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="admin/settings">
            <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
            <Label>Settings</Label>
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
    tabBarLabelStyle: { fontSize: 9, fontWeight: "600", marginBottom: 2 },
  };

  return (
    <Tabs screenOptions={common}>
      {role === "parent" || role === "student" ? (
        <>
          <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="house.fill" tintColor={color} size={20} /> : <Feather name="home" size={20} color={color} /> }} />
          <Tabs.Screen name="homework" options={{ title: "Homework", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="book.fill" tintColor={color} size={20} /> : <Feather name="book" size={20} color={color} /> }} />
          <Tabs.Screen name="progress" options={{ title: "Progress", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="chart.bar.fill" tintColor={color} size={20} /> : <Feather name="bar-chart-2" size={20} color={color} /> }} />
          <Tabs.Screen name="fees" options={{ title: "Fees", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="creditcard.fill" tintColor={color} size={20} /> : <Feather name="credit-card" size={20} color={color} /> }} />
          <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.circle.fill" tintColor={color} size={20} /> : <Feather name="user" size={20} color={color} /> }} />
        </>
      ) : role === "teacher" ? (
        <>
          <Tabs.Screen name="teacher/index" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} /> }} />
          <Tabs.Screen name="teacher/students" options={{ title: "Students", tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} /> }} />
          <Tabs.Screen name="teacher/attendance" options={{ title: "Attendance", tabBarIcon: ({ color }) => <Feather name="check-square" size={20} color={color} /> }} />
          <Tabs.Screen name="teacher/add-homework" options={{ title: "Homework", tabBarIcon: ({ color }) => <Feather name="book" size={20} color={color} /> }} />
          <Tabs.Screen name="teacher/performance" options={{ title: "Performance", tabBarIcon: ({ color }) => <Feather name="star" size={20} color={color} /> }} />
        </>
      ) : (
        <>
          <Tabs.Screen name="admin/index" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} /> }} />
          <Tabs.Screen name="admin/staff/index" options={{ title: "Staff", tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} /> }} />
          <Tabs.Screen name="admin/students" options={{ title: "Students", tabBarIcon: ({ color }) => <Feather name="graduation-cap" size={20} color={color} /> }} />
          <Tabs.Screen name="admin/post-homework" options={{ title: "Academic", tabBarIcon: ({ color }) => <Feather name="book" size={20} color={color} /> }} />
          <Tabs.Screen name="admin/settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <Feather name="settings" size={20} color={color} /> }} />
        </>
      )}
    </Tabs>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  const role = user?.role ?? "parent";
  if (isLiquidGlassAvailable()) return <NativeTabLayout role={role} />;
  return <ClassicTabLayout role={role} />;
}
