import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Evaluation, useData } from "@/context/DataContext";

const CRITERIA: { key: keyof Evaluation["ratings"]; label: string }[] = [
  { key: "teachingQuality", label: "Teaching Quality" },
  { key: "classroomManagement", label: "Classroom Management" },
  { key: "studentEngagement", label: "Student Engagement" },
  { key: "punctuality", label: "Punctuality & Discipline" },
  { key: "parentCommunication", label: "Communication with Parents" },
  { key: "homeworkManagement", label: "Homework & Task Management" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7}>
          <Feather name="star" size={28} color={n <= value ? "#C8972A" : "#E0E0E0"} style={{ fill: n <= value ? "#C8972A" : "none" }} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ratingColor(r: number) {
  if (r >= 4) return { bg: "#EAF3DE", color: "#27500A", label: "Excellent" };
  if (r === 3) return { bg: "#FFF8EC", color: "#8B6010", label: "Average" };
  return { bg: "#F8EBEB", color: "#8B1A1B", label: "Needs Improvement" };
}

export default function EvaluatePage() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode: string }>();
  const { data, addEvaluation } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [showForm, setShowForm] = useState(mode === "evaluate");
  const [saving, setSaving] = useState(false);

  const teacher = data.staff.find((s) => s.id === id);
  const history = data.evaluations.filter((e) => e.teacherId === id).sort((a, b) => b.date.localeCompare(a.date));

  const defaultRatings: Evaluation["ratings"] = {
    teachingQuality: 3, classroomManagement: 3, studentEngagement: 3,
    punctuality: 3, parentCommunication: 3, homeworkManagement: 3,
  };

  const [ratings, setRatings] = useState<Evaluation["ratings"]>(defaultRatings);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [remarks, setRemarks] = useState("");

  const overallRating = Math.round(Object.values(ratings).reduce((a, b) => a + b, 0) / 6);

  const handleSave = async () => {
    if (!strengths.trim() || !remarks.trim()) {
      Alert.alert("Required", "Please fill in strengths and admin remarks.");
      return;
    }
    setSaving(true);
    try {
      await addEvaluation({
        teacherId: id,
        teacherName: teacher?.name ?? "",
        subject: teacher?.department ?? "",
        classSection: teacher?.classSection ?? "",
        ratings, strengths, improvements, remarks,
        overallRating,
        date: new Date().toISOString().split("T")[0],
      });
      setRatings(defaultRatings);
      setStrengths(""); setImprovements(""); setRemarks("");
      setShowForm(false);
      Alert.alert("Saved", "Evaluation saved successfully.");
    } finally {
      setSaving(false);
    }
  };

  if (!teacher) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Teacher not found</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{teacher.name}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.teacherCard}>
            <View style={styles.teacherAvatar}>
              <Text style={styles.teacherAvatarText}>{teacher.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.teacherName}>{teacher.name}</Text>
              <Text style={styles.teacherMeta}>{teacher.department} · {teacher.role}</Text>
              {teacher.classSection ? <Text style={styles.teacherSection}>Class {teacher.classSection}</Text> : null}
            </View>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tab, !showForm && styles.tabActive]} onPress={() => setShowForm(false)}>
              <Text style={[styles.tabText, !showForm && styles.tabTextActive]}>History ({history.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, showForm && styles.tabActive]} onPress={() => setShowForm(true)}>
              <Text style={[styles.tabText, showForm && styles.tabTextActive]}>New Evaluation</Text>
            </TouchableOpacity>
          </View>

          {!showForm && (
            <>
              {history.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="star" size={32} color="#C0282A" />
                  <Text style={styles.emptyText}>No evaluations yet</Text>
                  <TouchableOpacity style={styles.newEvalBtn} onPress={() => setShowForm(true)}>
                    <Text style={styles.newEvalBtnText}>Create First Evaluation</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                history.map((ev) => {
                  const rc = ratingColor(ev.overallRating);
                  return (
                    <View key={ev.id} style={styles.historyCard}>
                      <View style={styles.historyTop}>
                        <Text style={styles.historyDate}>{ev.date}</Text>
                        <View style={[styles.ratingBadge, { backgroundColor: rc.bg }]}>
                          <Text style={[styles.ratingNum, { color: rc.color }]}>{ev.overallRating}/5 · {rc.label}</Text>
                        </View>
                      </View>
                      <View style={styles.ratingsGrid}>
                        {CRITERIA.map((c) => (
                          <View key={c.key} style={styles.ratingRow}>
                            <Text style={styles.ratingLabel}>{c.label}</Text>
                            <View style={{ flexDirection: "row", gap: 2 }}>
                              {[1,2,3,4,5].map((n) => (
                                <Feather key={n} name="star" size={12} color={n <= ev.ratings[c.key] ? "#C8972A" : "#E0E0E0"} />
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                      {ev.strengths ? <View style={styles.remarkBox}><Text style={styles.remarkTitle}>Strengths</Text><Text style={styles.remarkText}>{ev.strengths}</Text></View> : null}
                      {ev.improvements ? <View style={[styles.remarkBox, { backgroundColor: "#FFF8EC" }]}><Text style={[styles.remarkTitle, { color: "#8B6010" }]}>Areas for Improvement</Text><Text style={[styles.remarkText, { color: "#7A5A0F" }]}>{ev.improvements}</Text></View> : null}
                      {ev.remarks ? <View style={[styles.remarkBox, { backgroundColor: "#F5F4F2" }]}><Text style={[styles.remarkTitle, { color: "#555550" }]}>Admin Remarks</Text><Text style={[styles.remarkText, { color: "#555550" }]}>{ev.remarks}</Text></View> : null}
                    </View>
                  );
                })
              )}
            </>
          )}

          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formSection}>PERFORMANCE CRITERIA</Text>
              {CRITERIA.map((c) => (
                <View key={c.key} style={styles.criteriaRow}>
                  <Text style={styles.criteriaLabel}>{c.label}</Text>
                  <StarRating value={ratings[c.key]} onChange={(v) => setRatings((p) => ({ ...p, [c.key]: v }))} />
                </View>
              ))}

              <View style={styles.overallRow}>
                <Text style={styles.overallLabel}>Overall Rating</Text>
                <View style={[styles.overallBadge, { backgroundColor: ratingColor(overallRating).bg }]}>
                  <Text style={[styles.overallNum, { color: ratingColor(overallRating).color }]}>{overallRating}/5 · {ratingColor(overallRating).label}</Text>
                </View>
              </View>

              <Text style={styles.formSection}>FEEDBACK</Text>
              {[
                { label: "Strengths *", value: strengths, onChange: setStrengths },
                { label: "Areas for Improvement", value: improvements, onChange: setImprovements },
                { label: "Admin Remarks *", value: remarks, onChange: setRemarks },
              ].map((f) => (
                <View key={f.label} style={{ marginBottom: 14 }}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.textArea}
                    value={f.value}
                    onChangeText={f.onChange}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    placeholderTextColor="#AAAAAA"
                    placeholder={f.label.replace(" *", "")}
                  />
                </View>
              ))}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : (
                  <>
                    <Feather name="save" size={16} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Save Evaluation</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  teacherCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  teacherAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#F8EBEB", alignItems: "center", justifyContent: "center" },
  teacherAvatarText: { fontSize: 16, fontWeight: "700", color: "#C0282A" },
  teacherName: { fontSize: 16, fontWeight: "700", color: "#1A1A1A", marginBottom: 3 },
  teacherMeta: { fontSize: 12, color: "#555550" },
  teacherSection: { fontSize: 11, color: "#C0282A", fontWeight: "600", marginTop: 2 },
  tabRow: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 4, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#C0282A" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#888882" },
  tabTextActive: { color: "#FFFFFF" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  newEvalBtn: { backgroundColor: "#C0282A", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  newEvalBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  historyCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  historyTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  historyDate: { fontSize: 12, color: "#888882", fontWeight: "500" },
  ratingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ratingNum: { fontSize: 12, fontWeight: "700" },
  ratingsGrid: { marginBottom: 10, gap: 6 },
  ratingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ratingLabel: { fontSize: 12, color: "#555550", flex: 1 },
  remarkBox: { backgroundColor: "#EAF3DE", borderRadius: 8, padding: 10, marginBottom: 8 },
  remarkTitle: { fontSize: 10, fontWeight: "700", color: "#27500A", letterSpacing: 0.5, marginBottom: 4 },
  remarkText: { fontSize: 12, color: "#3B6D11", lineHeight: 18 },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  formSection: { fontSize: 11, fontWeight: "700", color: "#888882", letterSpacing: 0.8, marginBottom: 14, marginTop: 4 },
  criteriaRow: { marginBottom: 16 },
  criteriaLabel: { fontSize: 13, fontWeight: "600", color: "#1A1A1A", marginBottom: 8 },
  overallRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F5F4F2", borderRadius: 10, padding: 12, marginBottom: 18 },
  overallLabel: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  overallBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  overallNum: { fontSize: 13, fontWeight: "700" },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.5, marginBottom: 6 },
  textArea: { backgroundColor: "#F5F4F2", borderRadius: 10, padding: 12, fontSize: 14, color: "#1A1A1A", minHeight: 80 },
  saveBtn: { backgroundColor: "#C0282A", borderRadius: 12, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
