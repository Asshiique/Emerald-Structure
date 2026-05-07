import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const SCHOOL_PHONE = "+919400000000";

interface MenuItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
  showBorder?: boolean;
}

function MenuItem({ icon, label, value, onPress, color = "#1A1A1A", showBorder = true }: MenuItemProps) {
  return (
    <TouchableOpacity style={[styles.menuItem, showBorder && styles.menuBorder]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: color === "#C0282A" ? "#F8EBEB" : "#F5F4F2" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      {onPress && <Feather name="chevron-right" size={16} color="#888882" style={{ marginLeft: "auto" }} />}
    </TouchableOpacity>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const student = data.students.find((s) => s.parentEmail.toLowerCase() === user?.email?.toLowerCase());
  const staffRecord = data.staff.find((s) => s.email.toLowerCase() === user?.email?.toLowerCase());
  const photo = student?.profilePhoto ?? staffRecord?.profilePhoto;

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      await logout(); router.replace("/login");
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
      ]);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F4F2" }} contentContainerStyle={{ paddingBottom: bottomPad + 100 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <PhotoAvatar photo={photo} name={user?.name ?? "Student"} size={80} borderColor="#C0282A" />
        <Text style={styles.profileName}>{user?.name ?? "Student"}</Text>
        <View style={styles.profileRoleBadge}>
          <Text style={styles.profileRoleText}>
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student"}
          </Text>
        </View>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      <Text style={styles.sectionLabel}>STUDENT INFORMATION</Text>
      <View style={styles.menuCard}>
        <MenuItem icon="hash" label="Roll Number" value={user?.rollNo ?? "EIS/2024/1024"} showBorder />
        <MenuItem icon="book-open" label="Class & Section" value={user?.classSection ?? "X-B"} showBorder />
        <MenuItem icon="users" label="Parent / Guardian" value={user?.parentName ?? "—"} showBorder />
        <MenuItem icon="phone" label="Contact Number" value={user?.phone ?? "—"} showBorder={false} />
      </View>

      <Text style={styles.sectionLabel}>MY SCHOOL</Text>
      <View style={styles.menuCard}>
        <MenuItem icon="credit-card" label="My ID Card" onPress={() => router.push("/id-card")} showBorder />
        <MenuItem icon="image" label="School Gallery" onPress={() => router.push("/gallery")} showBorder />
        <MenuItem icon="calendar" label="Timetable" onPress={() => router.push("/timetable")} showBorder />
        <MenuItem icon="check-square" label="Attendance Calendar" onPress={() => router.push("/attendance")} showBorder />
        <MenuItem icon="bar-chart-2" label="My Progress" onPress={() => router.push("/(tabs)/progress")} showBorder={false} />
      </View>

      <Text style={styles.sectionLabel}>SETTINGS</Text>
      <View style={styles.menuCard}>
        <MenuItem icon="bell" label="Notifications" onPress={() => router.push("/notifications-settings")} showBorder={false} />
      </View>

      <Text style={styles.sectionLabel}>CONTACT SCHOOL</Text>
      <View style={styles.menuCard}>
        <MenuItem icon="phone" label="Call School Office" color="#C0282A" onPress={() => Linking.openURL(`tel:${SCHOOL_PHONE}`)} showBorder />
        <MenuItem icon="phone" label="Office Number" value={data.settings.phone} showBorder />
        <MenuItem icon="mail" label="Email" value={data.settings.email} showBorder={false} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={18} color="#C0282A" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Emerald International School · v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", paddingHorizontal: 20, paddingBottom: 22, overflow: "hidden" },
  circle1: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.06)", top: -40, right: -30 },
  circle2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: -20 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  profileCard: { backgroundColor: "#FFFFFF", borderRadius: 14, margin: 16, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: 6 },
  profileName: { fontSize: 20, fontWeight: "700", color: "#1A1A1A", marginTop: 6 },
  profileRoleBadge: { backgroundColor: "#F8EBEB", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  profileRoleText: { fontSize: 12, fontWeight: "600", color: "#C0282A" },
  profileEmail: { fontSize: 13, color: "#888882" },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  menuCard: { backgroundColor: "#FFFFFF", borderRadius: 14, marginHorizontal: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuBorder: { borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.08)" },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, fontWeight: "500", color: "#1A1A1A", flex: 1 },
  menuValue: { fontSize: 13, color: "#888882" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginHorizontal: 16, marginTop: 24, backgroundColor: "#F8EBEB", borderRadius: 14, paddingVertical: 16 },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#C0282A" },
  version: { fontSize: 12, color: "#888882", textAlign: "center", marginTop: 16 },
});
