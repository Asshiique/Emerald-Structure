import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FadeSlideIn } from "@/components/FadeSlideIn";
import { ScheduleCard } from "@/components/ScheduleCard";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useNotices } from "@/hooks/useNotices";

const SCHOOL_PHONE = "+919400000000";

/** Day index Sun=0 … Sat=6 → timetable day name */
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Return the timetable slots for today from data.timetable */
function useTodaySlots(timetable: { day: string; slots: { time: string; subject: string; teacher: string }[] }[]) {
  return useMemo(() => {
    const todayName = DAY_NAMES[new Date().getDay()];
    const todayEntry = timetable.find((t) => t.day === todayName);
    if (!todayEntry || todayEntry.slots.length === 0) return [];

    // Mark the currently active slot based on current hour
    const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
    return todayEntry.slots.map((slot, i) => {
      // Parse "HH:MM" or "H:MM"
      const [h = 0, m = 0] = slot.time.split(":").map(Number);
      const slotHour = h + m / 60;
      const nextSlot = todayEntry.slots[i + 1];
      const nextHour = nextSlot
        ? Number(nextSlot.time.split(":")[0]) + Number(nextSlot.time.split(":")[1] ?? 0) / 60
        : slotHour + 1;
      const isActive = nowHour >= slotHour && nowHour < nextHour;
      return { ...slot, isActive };
    });
  }, [timetable]);
}

/** Compute attendance % for the logged-in student from Firestore attendance records */
function useAttendanceStats(studentId: string | undefined, classSection: string | undefined, attendance: { classSection: string; records: { studentId: string; status: string }[] }[]) {
  return useMemo(() => {
    if (!studentId || !classSection) return { pct: "—", days: 0, total: 0 };
    const myClassRecords = attendance.filter((a) => a.classSection === classSection);
    let present = 0;
    const total = myClassRecords.length;
    for (const rec of myClassRecords) {
      const entry = rec.records.find((r) => r.studentId === studentId);
      if (entry?.status === "present" || entry?.status === "late") present++;
    }
    const pct = total > 0 ? Math.round((present / total) * 100) : null;
    return { pct: pct !== null ? `${pct}%` : "—", days: present, total };
  }, [studentId, classSection, attendance]);
}

export default function HomePage() {
  const { user } = useAuth();
  const { data } = useData();
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
  const greeting = hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";
  const firstName = user?.name?.split(" ")[0] ?? "Student";

  const { notices } = useNotices();
  const latestNotice = notices.length > 0 ? notices[0] : null;

  // Find the matching student record by admission no (stored in user.rollNo for parent accounts)
  const studentRecord = useMemo(() => {
    if (!user) return undefined;
    // Try matching by admissionNo == user.rollNo, or by parentEmail == user.email
    return (
      data.students.find((s) => s.admissionNo === user.rollNo) ??
      data.students.find((s) => s.parentEmail && s.parentEmail.toLowerCase() === user.email?.toLowerCase())
    );
  }, [user, data.students]);

  const studentId = studentRecord?.id;
  const classSection = user?.classSection ?? studentRecord?.classSection;

  // Live attendance stats
  const { pct: attendancePct } = useAttendanceStats(studentId, classSection, data.attendance);

  // Pending homework count for this class
  const pendingHomework = useMemo(() => {
    if (!classSection) return 0;
    return data.homework.filter((h) => h.classSection === classSection).length;
  }, [classSection, data.homework]);

  // Today's timetable from Firestore
  const todaySlots = useTodaySlots(data.timetable);

  const handleCall = () => { Linking.openURL(`tel:${SCHOOL_PHONE}`); };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F4F2" }}
      contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header — appears first */}
      <FadeSlideIn delay={0} from={-20}>
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
                {classSection ? `Class ${classSection}` : ""}
                {user?.rollNo ? ` · Roll No. ${user.rollNo}` : ""}
              </Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>
      </FadeSlideIn>

      {/* Notice banner — 80ms after header */}
      {latestNotice && (
        <FadeSlideIn delay={80}>
          <TouchableOpacity style={styles.noticeBanner} onPress={() => router.push(`/notice/${latestNotice.id}`)} activeOpacity={0.8}>
            <View style={styles.bellIcon}>
              <Feather name="bell" size={16} color="#C8972A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle} numberOfLines={1}>{latestNotice.title}</Text>
              <Text style={styles.bannerBody} numberOfLines={1}>{latestNotice.body}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/notices")}>
              <Feather name="chevron-right" size={18} color="#C8972A" />
            </TouchableOpacity>
          </TouchableOpacity>
        </FadeSlideIn>
      )}

      {/* Call card — 160ms */}
      <FadeSlideIn delay={160}>
        <TouchableOpacity style={styles.callCard} onPress={handleCall} activeOpacity={0.75}>
          <View style={styles.callIcon}>
            <Feather name="phone" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.callTitle}>Call School Office</Text>
            <Text style={styles.callSub}>Mannarkkad · Available 8AM–4PM</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#C0282A" />
        </TouchableOpacity>
      </FadeSlideIn>

      {/* Stats — 240ms */}
      <FadeSlideIn delay={240}>
        <View style={styles.statsGrid}>
          <StatCard
            value={attendancePct}
            label="Attendance"
            sublabel={attendancePct === "—" ? "No records yet" : "This term"}
          />
          <StatCard
            value={String(pendingHomework)}
            label="Homework"
            sublabel="Active assignments"
          />
        </View>
      </FadeSlideIn>

      {/* Schedule — 320ms */}
      <FadeSlideIn delay={320}>
        <Text style={styles.sectionLabel}>TODAY'S SCHEDULE</Text>
        {todaySlots.length === 0 ? (
          <View style={styles.noSchedule}>
            <Feather name="coffee" size={20} color="#888882" />
            <Text style={styles.noScheduleText}>
              {new Date().getDay() === 0 || new Date().getDay() === 6
                ? "No classes today — enjoy your weekend!"
                : "No timetable set for today"}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scheduleScroll}
          >
            {todaySlots.map((slot, i) => (
              <ScheduleCard
                key={i}
                time={slot.time}
                subject={slot.subject}
                teacher={slot.teacher}
                isActive={slot.isActive}
              />
            ))}
          </ScrollView>
        )}
      </FadeSlideIn>

      {/* Quick actions — 400ms */}
      <FadeSlideIn delay={400}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push("/timetable")} activeOpacity={0.7}>
            <View style={styles.quickIcon}><Feather name="calendar" size={20} color="#C0282A" /></View>
            <Text style={styles.quickLabel}>Timetable</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push("/attendance")} activeOpacity={0.7}>
            <View style={styles.quickIcon}><Feather name="check-square" size={20} color="#C0282A" /></View>
            <Text style={styles.quickLabel}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push("/(tabs)/homework")} activeOpacity={0.7}>
            <View style={styles.quickIcon}><Feather name="book" size={20} color="#C0282A" /></View>
            <Text style={styles.quickLabel}>Homework</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push("/(tabs)/fees")} activeOpacity={0.7}>
            <View style={styles.quickIcon}><Feather name="credit-card" size={20} color="#C0282A" /></View>
            <Text style={styles.quickLabel}>Fees</Text>
          </TouchableOpacity>
        </View>
      </FadeSlideIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", paddingHorizontal: 20, paddingBottom: 22, overflow: "hidden" },
  circle1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.06)", top: -60, right: -50 },
  circle2: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: -20 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  schoolLabel: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.7)", letterSpacing: 1, marginBottom: 6 },
  greeting: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "400" },
  greetingName: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  classInfo: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)", alignItems: "center", justifyContent: "center", marginTop: 16 },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  noticeBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF8EC", borderWidth: 1, borderColor: "rgba(200,151,42,0.25)", borderRadius: 14, margin: 16, marginBottom: 10, padding: 14, gap: 12 },
  bellIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(200,151,42,0.15)", alignItems: "center", justifyContent: "center" },
  bannerTitle: { fontSize: 13, fontWeight: "600", color: "#8B6010" },
  bannerBody: { fontSize: 12, color: "#7A5A0F", marginTop: 1 },
  callCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 14, marginHorizontal: 16, marginBottom: 12, padding: 14, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  callIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#C0282A", alignItems: "center", justifyContent: "center" },
  callTitle: { fontSize: 13, fontWeight: "600", color: "#1A1A1A" },
  callSub: { fontSize: 11, color: "#888882", marginTop: 2 },
  statsGrid: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 4 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  scheduleScroll: { paddingHorizontal: 16, paddingBottom: 4 },
  noSchedule: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", borderRadius: 14, marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  noScheduleText: { fontSize: 13, color: "#888882", flex: 1 },
  quickActions: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  quickBtn: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, alignItems: "center", gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  quickIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F8EBEB", alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11, fontWeight: "500", color: "#1A1A1A", textAlign: "center" },
});
