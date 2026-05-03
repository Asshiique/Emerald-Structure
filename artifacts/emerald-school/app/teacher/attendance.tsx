import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

type Status = "present" | "absent" | "late";

const STATUS_CONFIG = {
  present: { label: "P", color: "#27500A", bg: "#EAF3DE", border: "#3B6D11" },
  absent: { label: "A", color: "#8B1A1B", bg: "#F8EBEB", border: "#C0282A" },
  late: { label: "L", color: "#8B6010", bg: "#FFF8EC", border: "#C8972A" },
};

export default function AttendancePage() {
  const { user } = useAuth();
  const { data, markAttendance, getAttendanceForDate } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const staffRecord = data.staff.find((s) => s.email.toLowerCase() === user?.email?.toLowerCase());
  const classSection = staffRecord?.classSection ?? "X-B";
  const todayStr = new Date().toISOString().split("T")[0];
  const students = data.students.filter((s) => s.classSection === classSection).sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo));

  const existingRecord = data.attendance?.find((a) => a.date === todayStr && a.classSection === classSection);

  const [statusMap, setStatusMap] = useState<Record<string, Status>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!existingRecord);

  useEffect(() => {
    if (existingRecord) {
      const map: Record<string, Status> = {};
      existingRecord.records.forEach((r) => { map[r.studentId] = r.status; });
      setStatusMap(map);
    } else {
      const map: Record<string, Status> = {};
      students.forEach((s) => { map[s.id] = "present"; });
      setStatusMap(map);
    }
  }, [existingRecord?.id, students.length]);

  const setStatus = (id: string, status: Status) => {
    setStatusMap((prev) => ({ ...prev, [id]: status }));
  };

  const markAll = (status: Status) => {
    const map: Record<string, Status> = {};
    students.forEach((s) => { map[s.id] = status; });
    setStatusMap(map);
  };

  const presentCount = Object.values(statusMap).filter((s) => s === "present").length;
  const absentCount = Object.values(statusMap).filter((s) => s === "absent").length;
  const lateCount = Object.values(statusMap).filter((s) => s === "late").length;
  const markedCount = Object.keys(statusMap).length;

  const handleSubmit = async () => {
    if (markedCount < students.length) {
      Alert.alert("Incomplete", "Please mark all students before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await markAttendance({
        date: todayStr,
        classSection,
        teacherId: staffRecord?.id ?? user?.uid ?? "",
        records: students.map((s) => ({
          studentId: s.id,
          studentName: s.name,
          status: statusMap[s.id] ?? "present",
        })),
      });
      setIsEditing(false);
      Alert.alert("Submitted", "Attendance marked successfully for today.");
    } finally {
      setSubmitting(false);
    }
  };

  const dateFormatted = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
          <Text style={styles.headerSub}>Class {classSection}</Text>
        </View>
        {!isEditing && (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
            <Feather name="edit-2" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.dateBanner}>
        <Feather name="calendar" size={14} color="#C0282A" />
        <Text style={styles.dateText}>{dateFormatted}</Text>
        {existingRecord && !isEditing && (
          <View style={styles.markedBadge}>
            <Feather name="check-circle" size={12} color="#27500A" />
            <Text style={styles.markedText}>Submitted</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}><Text style={[styles.statNum, { color: "#27500A" }]}>{presentCount}</Text><Text style={styles.statLabel}>Present</Text></View>
        <View style={styles.statBox}><Text style={[styles.statNum, { color: "#C0282A" }]}>{absentCount}</Text><Text style={styles.statLabel}>Absent</Text></View>
        <View style={styles.statBox}><Text style={[styles.statNum, { color: "#C8972A" }]}>{lateCount}</Text><Text style={styles.statLabel}>Late</Text></View>
        <View style={styles.statBox}><Text style={styles.statNum}>{students.length}</Text><Text style={styles.statLabel}>Total</Text></View>
      </View>

      {isEditing && (
        <View style={styles.markAllRow}>
          <Text style={styles.markAllLabel}>Mark all:</Text>
          {(["present", "absent", "late"] as const).map((s) => (
            <TouchableOpacity key={s} style={[styles.markAllBtn, { backgroundColor: STATUS_CONFIG[s].bg, borderColor: STATUS_CONFIG[s].border }]} onPress={() => markAll(s)}>
              <Text style={[styles.markAllText, { color: STATUS_CONFIG[s].color }]}>{STATUS_CONFIG[s].label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 90 }} showsVerticalScrollIndicator={false}>
        {students.map((s) => {
          const current = statusMap[s.id] ?? "present";
          return (
            <View key={s.id} style={styles.studentRow}>
              <View style={styles.rollBadge}>
                <Text style={styles.rollNum}>{s.rollNo}</Text>
              </View>
              <Text style={styles.studentName} numberOfLines={1}>{s.name}</Text>
              <View style={styles.statusBtns}>
                {(["present", "absent", "late"] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    disabled={!isEditing}
                    style={[
                      styles.statusBtn,
                      { backgroundColor: current === status ? STATUS_CONFIG[status].bg : "#F5F4F2", borderColor: current === status ? STATUS_CONFIG[status].border : "transparent", borderWidth: current === status ? 1.5 : 0 },
                    ]}
                    onPress={() => setStatus(s.id, status)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusBtnText, { color: current === status ? STATUS_CONFIG[status].color : "#888882" }]}>
                      {STATUS_CONFIG[status].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {isEditing && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.footerProgress}>{markedCount}/{students.length} marked</Text>
          <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
            <Feather name="check" size={18} color="#FFFFFF" />
            <Text style={styles.submitText}>{submitting ? "Submitting..." : "Submit Attendance"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16, gap: 4 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.75)" },
  editBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dateBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF8EC", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(200,151,42,0.15)" },
  dateText: { flex: 1, fontSize: 13, color: "#8B6010", fontWeight: "500" },
  markedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  markedText: { fontSize: 11, fontWeight: "600", color: "#27500A" },
  statsRow: { flexDirection: "row", backgroundColor: "#FFFFFF", paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.06)" },
  statBox: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  statLabel: { fontSize: 10, color: "#888882", marginTop: 2 },
  markAllRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: "#FFFFFF", borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.06)" },
  markAllLabel: { fontSize: 12, color: "#555550", fontWeight: "500", marginRight: 4 },
  markAllBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  markAllText: { fontSize: 13, fontWeight: "700" },
  studentRow: { backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 6, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1, marginTop: 6 },
  rollBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#F8EBEB", alignItems: "center", justifyContent: "center" },
  rollNum: { fontSize: 13, fontWeight: "700", color: "#C0282A" },
  studentName: { flex: 1, fontSize: 13, fontWeight: "600", color: "#1A1A1A" },
  statusBtns: { flexDirection: "row", gap: 4 },
  statusBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  statusBtnText: { fontSize: 12, fontWeight: "700" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "rgba(0,0,0,0.08)", gap: 8 },
  footerProgress: { fontSize: 12, color: "#888882", textAlign: "center" },
  submitBtn: { backgroundColor: "#C0282A", borderRadius: 12, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
