import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const SCHOOL_PHONE = "+914924222001";

export default function TeacherDashboardPage() {
  useRoleGuard(["teacher", "admin"]);
  const { user, logout } = useAuth();
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const staffRecord = data.staff.find((s) => s.email.toLowerCase() === user?.email?.toLowerCase());
  const classSection = staffRecord?.classSection ?? user?.classSection ?? "X-B";
  const isClassTeacher = staffRecord?.role === "Class Teacher";

  const classStudents = data.students.filter((s) => s.classSection === classSection);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAtt = data.getAttendanceForDate
    ? data.attendance?.find((a) => a.date === todayStr && a.classSection === classSection)
    : undefined;
  const presentToday = todayAtt?.records.filter((r) => r.status === "present").length ?? 0;

  const myHomework = data.homework.filter((h) => h.teacherId === staffRecord?.id);

  const firstName = user?.name?.split(" ").slice(-1)[0] ?? "Teacher";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const ACTIONS = [
    isClassTeacher && { icon: "check-square", label: "Mark\nAttendance", color: "#3B6D11", bg: "#EAF3DE", route: "/teacher/attendance" },
    isClassTeacher && { icon: "user-plus", label: "Add\nStudent", color: "#185FA5", bg: "#E8F1FB", route: "/teacher/add-student" },
    { icon: "book", label: "Post\nHomework", color: "#BA7517", bg: "#FFF3DC", route: "/teacher/add-homework" },
    { icon: "users", label: "View\nStudents", color: "#7B3F9E", bg: "#F3EBF8", route: "/teacher/students" },
    { icon: "star", label: "My\nPerformance", color: "#1A7A6E", bg: "#E6F4F2", route: "/teacher/performance" },
  ].filter(Boolean) as { icon: string; label: string; color: string; bg: string; route: string }[];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F4F2" }} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 12 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.schoolLabel}>EMERALD INTERNATIONAL SCHOOL</Text>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.teacherName}>{user?.name ?? "Teacher"}</Text>
            <View style={styles.classBadge}>
              <Feather name="users" size={12} color="#C8972A" />
              <Text style={styles.classBadgeText}>
                {isClassTeacher ? `Class Teacher — ${classSection}` : `${staffRecord?.department ?? "Teacher"}`}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); router.replace("/login"); }}>
            <Feather name="log-out" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{classStudents.length}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{todayAtt ? presentToday : "—"}</Text>
            <Text style={styles.statLabel}>Present Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{myHomework.length}</Text>
            <Text style={styles.statLabel}>HW Posted</Text>
          </View>
        </View>
      </View>

      {!todayAtt && isClassTeacher && (
        <TouchableOpacity style={styles.attBanner} onPress={() => router.push("/teacher/attendance")} activeOpacity={0.8}>
          <Feather name="alert-circle" size={18} color="#8B1A1B" />
          <Text style={styles.attBannerText}>Attendance not marked yet today</Text>
          <Text style={styles.attBannerAction}>Mark Now →</Text>
        </TouchableOpacity>
      )}

      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          {ACTIONS.map((a) => (
            <TouchableOpacity key={a.route} style={styles.actionCard} onPress={() => router.push(a.route as any)} activeOpacity={0.7}>
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                <Feather name={a.icon as any} size={24} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {myHomework.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={styles.sectionLabel}>RECENT HOMEWORK POSTED</Text>
          {myHomework.slice(0, 3).map((hw) => (
            <View key={hw.id} style={styles.hwCard}>
              <View style={styles.hwDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.hwTitle}>{hw.title}</Text>
                <Text style={styles.hwMeta}>{hw.subject} · Due {hw.dueDate}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
        <Text style={styles.sectionLabel}>SCHOOL CONTACT</Text>
        <TouchableOpacity style={styles.callCard} onPress={() => Linking.openURL(`tel:${SCHOOL_PHONE}`)} activeOpacity={0.75}>
          <View style={styles.callIcon}>
            <Feather name="phone" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.callTitle}>Call School Office</Text>
            <Text style={styles.callSub}>Available 8AM–4PM</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#C0282A" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  circle1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.06)", top: -60, right: -40 },
  circle2: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: -10 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16, gap: 12 },
  schoolLabel: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.65)", letterSpacing: 1, marginBottom: 4 },
  greeting: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  teacherName: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", marginBottom: 6 },
  classBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  classBadgeText: { fontSize: 12, color: "#FFF8EC", fontWeight: "600" },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginTop: 16 },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 14 },
  statBox: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2, textAlign: "center" },
  statDivider: { width: 0.5, backgroundColor: "rgba(255,255,255,0.25)", marginHorizontal: 8 },
  attBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8EBEB", borderLeftWidth: 4, borderLeftColor: "#C0282A", marginHorizontal: 16, marginTop: 14, borderRadius: 10, padding: 12, gap: 10 },
  attBannerText: { flex: 1, fontSize: 13, color: "#8B1A1B", fontWeight: "500" },
  attBannerAction: { fontSize: 12, fontWeight: "700", color: "#C0282A" },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, marginBottom: 10 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, alignItems: "center", width: "31%", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  actionIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: "600", color: "#1A1A1A", textAlign: "center" },
  hwCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  hwDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C0282A" },
  hwTitle: { fontSize: 13, fontWeight: "600", color: "#1A1A1A", marginBottom: 3 },
  hwMeta: { fontSize: 11, color: "#888882" },
  callCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  callIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#C0282A", alignItems: "center", justifyContent: "center" },
  callTitle: { fontSize: 13, fontWeight: "600", color: "#1A1A1A" },
  callSub: { fontSize: 11, color: "#888882", marginTop: 2 },
});
