import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const DAYS_HEADER = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Map short month number to name */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AttendancePage() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { user } = useAuth();
  const { data } = useData();

  // Navigate months
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const goBack = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goForward = () => {
    const today = new Date();
    // Don't allow navigating into the future beyond the current month
    if (year === today.getFullYear() && month >= today.getMonth()) return;
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };
  const isAtCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  // Find the student record that matches this user
  const studentRecord = useMemo(() => {
    if (!user) return undefined;
    return (
      data.students.find((s) => s.admissionNo === user.rollNo) ??
      data.students.find((s) => s.parentEmail && s.parentEmail.toLowerCase() === user.email?.toLowerCase())
    );
  }, [user, data.students]);

  const studentId = studentRecord?.id;
  const classSection = user?.classSection ?? studentRecord?.classSection;

  // Build a map: "YYYY-MM-DD" → status for this student in the displayed month
  const statusMap = useMemo(() => {
    const map: Record<string, "present" | "absent" | "late"> = {};
    if (!studentId || !classSection) return map;

    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const classRecords = data.attendance.filter(
      (a) => a.classSection === classSection && a.date.startsWith(prefix)
    );
    for (const rec of classRecords) {
      const entry = rec.records.find((r) => r.studentId === studentId);
      if (entry) map[rec.date] = entry.status;
    }
    return map;
  }, [studentId, classSection, data.attendance, year, month]);

  // Counts for the month
  const presentCount = Object.values(statusMap).filter((s) => s === "present").length;
  const absentCount = Object.values(statusMap).filter((s) => s === "absent").length;
  const lateCount = Object.values(statusMap).filter((s) => s === "late").length;
  const totalMarked = presentCount + absentCount + lateCount;
  const pct = totalMarked > 0 ? Math.round(((presentCount + lateCount) / totalMarked) * 100) : null;

  // Build calendar cells
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const calCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isWeekend = (day: number) => {
    const dow = new Date(year, month, day).getDay();
    return dow === 0 || dow === 6;
  };
  const isFuture = (day: number) => {
    const today = new Date();
    return new Date(year, month, day) > today;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <Text style={styles.headerSub}>
            {classSection ? `Class ${classSection}` : "Academic Calendar"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary row */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: "#EAF3DE" }]}>
            <Text style={[styles.summaryValue, { color: "#27500A" }]}>{presentCount}</Text>
            <Text style={[styles.summaryLabel, { color: "#3B6D11" }]}>Present</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#F8EBEB" }]}>
            <Text style={[styles.summaryValue, { color: "#C0282A" }]}>{absentCount}</Text>
            <Text style={[styles.summaryLabel, { color: "#C0282A" }]}>Absent</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#FFF8EC" }]}>
            <Text style={[styles.summaryValue, { color: "#C8972A" }]}>{lateCount}</Text>
            <Text style={[styles.summaryLabel, { color: "#BA7517" }]}>Late</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#F5F4F2" }]}>
            <Text style={[styles.summaryValue, { color: "#888882" }]}>
              {pct !== null ? `${pct}%` : "—"}
            </Text>
            <Text style={[styles.summaryLabel, { color: "#888882" }]}>Rate</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calCard}>
          {/* Month navigation */}
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="chevron-left" size={22} color="#C0282A" />
            </TouchableOpacity>
            <Text style={styles.calMonth}>{MONTH_NAMES[month]} {year}</Text>
            <TouchableOpacity
              onPress={goForward}
              disabled={isAtCurrentMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="chevron-right" size={22} color={isAtCurrentMonth ? "#CCCCCC" : "#C0282A"} />
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.daysHeader}>
            {DAYS_HEADER.map((d) => (
              <Text key={d} style={styles.dayHeaderText}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calGrid}>
            {calCells.map((day, i) => {
              if (!day) {
                return <View key={`empty-${i}`} style={styles.calCell} />;
              }
              const dateStr = getDateStr(day);
              const status = statusMap[dateStr];
              const weekend = isWeekend(day);
              const future = isFuture(day);

              let cellStyle = {};
              let textStyle = styles.futureText;

              if (weekend || future) {
                cellStyle = weekend ? styles.holiday : {};
                textStyle = weekend ? styles.holidayText : styles.futureText;
              } else if (status === "present") {
                cellStyle = styles.present; textStyle = styles.presentText;
              } else if (status === "absent") {
                cellStyle = styles.absent; textStyle = styles.absentText;
              } else if (status === "late") {
                cellStyle = styles.late; textStyle = styles.lateText;
              }

              return (
                <View key={dateStr} style={[styles.calCell, cellStyle]}>
                  <Text style={[styles.calDayText, textStyle]}>{day}</Text>
                </View>
              );
            })}
          </View>

          {/* No data notice */}
          {totalMarked === 0 && (
            <View style={styles.noDataRow}>
              <Feather name="info" size={13} color="#888882" />
              <Text style={styles.noDataText}>
                {studentId
                  ? "No attendance records found for this month."
                  : "Sign in as a student/parent to see your attendance."}
              </Text>
            </View>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          {[
            { color: "#EAF3DE", text: "#27500A", label: "Present" },
            { color: "#F8EBEB", text: "#C0282A", label: "Absent" },
            { color: "#FFF8EC", text: "#C8972A", label: "Late" },
            { color: "#F1EFE8", text: "#888882", label: "Weekend" },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#C0282A",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingBottom: 16,
    overflow: "hidden",
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  summaryValue: { fontSize: 20, fontWeight: "700" },
  summaryLabel: { fontSize: 10, fontWeight: "500", marginTop: 2 },
  calCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  calMonth: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  daysHeader: { flexDirection: "row", marginBottom: 8 },
  dayHeaderText: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: "#888882" },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginBottom: 4,
  },
  calDayText: { fontSize: 13, fontWeight: "500" },
  present: { backgroundColor: "#EAF3DE" },
  absent: { backgroundColor: "#F8EBEB" },
  late: { backgroundColor: "#FFF8EC" },
  holiday: { backgroundColor: "#F1EFE8" },
  presentText: { color: "#27500A" },
  absentText: { color: "#C0282A" },
  lateText: { color: "#C8972A" },
  holidayText: { color: "#888882" },
  futureText: { color: "#1A1A1A" },
  noDataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  noDataText: { fontSize: 12, color: "#888882", flex: 1 },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: 16, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, color: "#555550" },
});
