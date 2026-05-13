import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useRoleGuard } from "@/hooks/useRoleGuard";

interface CardProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}

function Card({ icon, title, subtitle, color, onPress }: CardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.cardIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function AdminPanelPage() {
  useRoleGuard(["admin"]);
  const { user, logout } = useAuth();
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const activeStaff = data.staff.filter((s) => s.isActive);
  const totalStudents = data.students.length;

  const cards: CardProps[] = [
    { icon: "users", title: "Manage Staff", subtitle: `${activeStaff.length} members`, color: "#C0282A", onPress: () => router.push("/admin/staff") },
    { icon: "user-plus", title: "Manage Students", subtitle: `${totalStudents} students`, color: "#185FA5", onPress: () => router.push("/admin/students") },
    { icon: "bell", title: "Post Notice", subtitle: "School-wide announcement", color: "#BA7517", onPress: () => router.push("/admin/post-notice") },
    { icon: "book", title: "Post Homework", subtitle: "For any class", color: "#3B6D11", onPress: () => router.push("/admin/post-homework") },
    { icon: "credit-card", title: "Fee Management", subtitle: "View fee records", color: "#7B3F9E", onPress: () => router.push("/admin/fees") },
    { icon: "bar-chart-2", title: "Teacher Performance", subtitle: `${data.evaluations.length} evaluations`, color: "#1A7A6E", onPress: () => router.push("/admin/performance") },
    { icon: "settings", title: "App Settings", subtitle: "School info & config", color: "#555550", onPress: () => router.push("/admin/settings") },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 16 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.schoolLabel}>EMERALD INTERNATIONAL SCHOOL</Text>
            <Text style={styles.greeting}>Admin Panel</Text>
            <Text style={styles.userName}>{user?.name ?? "Administrator"}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); router.replace("/login"); }}>
            <Feather name="log-out" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{activeStaff.length}</Text>
            <Text style={styles.statLabel}>Staff</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{data.evaluations.length}</Text>
            <Text style={styles.statLabel}>Evaluations</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>MANAGEMENT</Text>
        <View style={styles.grid}>
          {cards.map((c) => (
            <Card key={c.title} {...c} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  circle1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.06)", top: -60, right: -40 },
  circle2: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: -10 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  schoolLabel: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.65)", letterSpacing: 1, marginBottom: 4 },
  greeting: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  userName: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 14 },
  statBox: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  statDivider: { width: 0.5, backgroundColor: "rgba(255,255,255,0.25)", marginHorizontal: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, width: "47.5%", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#1A1A1A", marginBottom: 4 },
  cardSub: { fontSize: 11, color: "#888882" },
});
