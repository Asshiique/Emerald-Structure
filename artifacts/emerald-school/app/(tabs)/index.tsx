import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScheduleCard } from "@/components/ScheduleCard";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";
import { TODAY_SCHEDULE } from "@/data/mockData";

export default function HomePage() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "AS";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";
  const firstName = user?.name?.split(" ")[0] ?? "Student";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F4F2" }}
      contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.schoolLabel}>EMERALD INTERNATIONAL SCHOOL</Text>
            <Text style={styles.greeting}>
              {greeting}{"\n"}
              <Text style={styles.greetingName}>{firstName}</Text>
            </Text>
            <Text style={styles.classInfo}>
              {user?.classSection ? `Class ${user.classSection}` : ""}
              {user?.rollNo ? ` · Roll No. ${user.rollNo}` : ""}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      </View>

      <View style={styles.noticeBanner}>
        <View style={styles.bellIcon}>
          <Feather name="bell" size={16} color="#C8972A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Annual Day – Tarang 2025</Text>
          <Text style={styles.bannerBody}>Rehearsals start Monday. Confirm your participation.</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/notices")}>
          <Feather name="chevron-right" size={18} color="#C8972A" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <StatCard value="92%" label="Attendance" sublabel="This month" />
        <StatCard value="83" label="Avg. Marks" sublabel="Last exam" />
      </View>

      <Text style={styles.sectionLabel}>TODAY'S SCHEDULE</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scheduleScroll}
      >
        {TODAY_SCHEDULE.map((slot, i) => (
          <ScheduleCard
            key={i}
            time={slot.time}
            subject={slot.subject}
            teacher={slot.teacher}
            isActive={slot.isActive}
          />
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>UPCOMING</Text>
      <View style={styles.upcomingCard}>
        <View style={styles.upcomingRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>Exam</Text>
            </View>
            <Text style={styles.upcomingTitle}>Unit Test — Science</Text>
            <Text style={styles.upcomingDate}>Friday, 14 Feb · 10:00 AM</Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.dateNum}>14</Text>
            <Text style={styles.dateMonth}>FEB</Text>
          </View>
        </View>
        <View style={styles.upcomingDivider} />
        <View style={styles.upcomingRow}>
          <View style={{ flex: 1 }}>
            <View style={[styles.upcomingBadge, { backgroundColor: "#FFF8EC" }]}>
              <Text style={[styles.upcomingBadgeText, { color: "#8B6010" }]}>Extra Class</Text>
            </View>
            <Text style={styles.upcomingTitle}>JEE Prep — Mathematics</Text>
            <Text style={styles.upcomingDate}>Saturday, 15 Feb · 8:00 AM</Text>
          </View>
          <View style={[styles.dateBlock, { backgroundColor: "#FFF8EC" }]}>
            <Text style={[styles.dateNum, { color: "#C8972A" }]}>15</Text>
            <Text style={[styles.dateMonth, { color: "#C8972A" }]}>FEB</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => router.push("/timetable")}
          activeOpacity={0.7}
        >
          <View style={styles.quickIcon}>
            <Feather name="calendar" size={20} color="#C0282A" />
          </View>
          <Text style={styles.quickLabel}>Timetable</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => router.push("/attendance")}
          activeOpacity={0.7}
        >
          <View style={styles.quickIcon}>
            <Feather name="check-square" size={20} color="#C0282A" />
          </View>
          <Text style={styles.quickLabel}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => router.push("/(tabs)/notices")}
          activeOpacity={0.7}
        >
          <View style={styles.quickIcon}>
            <Feather name="bell" size={20} color="#C0282A" />
          </View>
          <Text style={styles.quickLabel}>Notices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => router.push("/(tabs)/fees")}
          activeOpacity={0.7}
        >
          <View style={styles.quickIcon}>
            <Feather name="credit-card" size={20} color="#C0282A" />
          </View>
          <Text style={styles.quickLabel}>Fees</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#C0282A",
    paddingHorizontal: 20,
    paddingBottom: 22,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -60,
    right: -50,
  },
  circle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  schoolLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    marginBottom: 6,
  },
  greeting: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "400",
  },
  greetingName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  classInfo: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EC",
    borderWidth: 1,
    borderColor: "rgba(200,151,42,0.25)",
    borderRadius: 14,
    margin: 16,
    padding: 14,
    gap: 12,
  },
  bellIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(200,151,42,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B6010",
  },
  bannerBody: {
    fontSize: 12,
    color: "#7A5A0F",
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888882",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  scheduleScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  upcomingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    padding: 14,
    gap: 12,
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  upcomingDivider: {
    height: 0.5,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  upcomingBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F8EBEB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  upcomingBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#C0282A",
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 3,
  },
  upcomingDate: {
    fontSize: 12,
    color: "#888882",
  },
  dateBlock: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#F8EBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  dateNum: {
    fontSize: 18,
    fontWeight: "700",
    color: "#C0282A",
    lineHeight: 20,
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: "600",
    color: "#C0282A",
    lineHeight: 12,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8EBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#1A1A1A",
    textAlign: "center",
  },
});
