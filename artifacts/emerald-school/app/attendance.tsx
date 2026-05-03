import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { generateAttendance } from "@/data/mockData";

const ATTENDANCE_DATA = generateAttendance();

const DAYS_HEADER = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function AttendancePage() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;
  const [month] = useState("January 2025");

  const presentCount = ATTENDANCE_DATA.filter((d) => d.status === "present").length;
  const absentCount = ATTENDANCE_DATA.filter((d) => d.status === "absent").length;
  const lateCount = ATTENDANCE_DATA.filter((d) => d.status === "late").length;

  const jan2025FirstDay = 3;
  const daysInJan = 31;
  const calCells = [];
  for (let i = 0; i < jan2025FirstDay; i++) calCells.push(null);
  for (let d = 1; d <= daysInJan; d++) calCells.push(d);

  const getDayStatus = (day: number) => {
    const entry = ATTENDANCE_DATA.find(
      (a) => a.date === `2025-01-${String(day).padStart(2, "0")}`
    );
    return entry?.status;
  };

  const getDayStyle = (day: number | null) => {
    if (!day) return {};
    const status = getDayStatus(day);
    if (status === "present") return styles.present;
    if (status === "absent") return styles.absent;
    if (status === "late") return styles.late;
    if (status === "holiday") return styles.holiday;
    return styles.future;
  };

  const getDayTextStyle = (day: number | null) => {
    if (!day) return {};
    const status = getDayStatus(day);
    if (status === "present") return styles.presentText;
    if (status === "absent") return styles.absentText;
    if (status === "late") return styles.lateText;
    if (status === "holiday") return styles.holidayText;
    return styles.futureText;
  };

  const cellSize = Math.floor((340 - 32) / 7);

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <Text style={styles.headerSub}>Term 2 · 2024–25</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={[styles.summaryValue, { color: "#888882" }]}>92%</Text>
            <Text style={[styles.summaryLabel, { color: "#888882" }]}>Rate</Text>
          </View>
        </View>

        <View style={styles.calCard}>
          <View style={styles.calHeader}>
            <TouchableOpacity>
              <Feather name="chevron-left" size={22} color="#C0282A" />
            </TouchableOpacity>
            <Text style={styles.calMonth}>{month}</Text>
            <TouchableOpacity>
              <Feather name="chevron-right" size={22} color="#C0282A" />
            </TouchableOpacity>
          </View>

          <View style={styles.daysHeader}>
            {DAYS_HEADER.map((d) => (
              <Text key={d} style={styles.dayHeaderText}>{d}</Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {calCells.map((day, i) => (
              <View key={i} style={[styles.calCell, day ? getDayStyle(day) : {}]}>
                {day ? (
                  <Text style={[styles.calDayText, getDayTextStyle(day)]}>{day}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.legendRow}>
          {[
            { color: "#EAF3DE", text: "#27500A", label: "Present" },
            { color: "#F8EBEB", text: "#C0282A", label: "Absent" },
            { color: "#FFF8EC", text: "#C8972A", label: "Late" },
            { color: "#F1EFE8", text: "#888882", label: "Holiday" },
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
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
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
  calMonth: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  daysHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#888882",
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginBottom: 4,
  },
  calDayText: {
    fontSize: 13,
    fontWeight: "500",
  },
  present: { backgroundColor: "#EAF3DE" },
  absent: { backgroundColor: "#F8EBEB" },
  late: { backgroundColor: "#FFF8EC" },
  holiday: { backgroundColor: "#F1EFE8" },
  future: {},
  presentText: { color: "#27500A" },
  absentText: { color: "#C0282A" },
  lateText: { color: "#C8972A" },
  holidayText: { color: "#888882" },
  futureText: { color: "#1A1A1A" },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#555550",
  },
});
