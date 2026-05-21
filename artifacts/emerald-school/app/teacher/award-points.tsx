import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import type { PointAward, PointCategory } from "@/types/recognition";
import { CATEGORY_LABELS } from "@/types/recognition";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

const CATEGORIES: PointCategory[] = [
  "curricular",
  "non_curricular",
  "discipline",
  "homework",
  "behaviour",
];

const CATEGORY_COLORS: Record<PointCategory, { bg: string; text: string; icon: string }> = {
  curricular:     { bg: "#E8F1FB", text: "#185FA5", icon: "book-open" },
  non_curricular: { bg: "#F3EBF8", text: "#7B3F9E", icon: "music" },
  discipline:     { bg: "#EAF3DE", text: "#3B6D11", icon: "shield" },
  homework:       { bg: "#FFF3DC", text: "#BA7517", icon: "edit-3" },
  behaviour:      { bg: "#F8EBEB", text: "#C0282A", icon: "smile" },
};

function useApiToken() {
  const { user } = useAuth();
  return useCallback(async () => {
    const { auth } = await import("@/lib/firebase");
    return auth.currentUser?.getIdToken() ?? null;
  }, [user?.uid]);
}

async function awardPoints(
  token: string,
  body: {
    studentId: string;
    studentName: string;
    classSection: string;
    category: PointCategory;
    points: number;
    note?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/points/award`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      return { ok: false, error: data.message ?? "Failed to award points" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error — check your connection" };
  }
}

async function fetchRecent(token: string): Promise<PointAward[]> {
  try {
    const res = await fetch(`${API_URL}/api/points/recent`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as PointAward[];
  } catch {
    return [];
  }
}

export default function AwardPointsScreen() {
  useRoleGuard(["teacher", "admin"]);
  const { user } = useAuth();
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const getToken = useApiToken();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<PointCategory | null>(null);
  const [points, setPoints] = useState(5);
  const [note, setNote] = useState("");

  // ── UI state ────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [recentAwards, setRecentAwards] = useState<PointAward[]>([]);
  const [recentLoaded, setRecentLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Derive unique class sections from all students
  const allClasses = useMemo(
    () => [...new Set(data.students.map((s) => s.classSection))].sort(),
    [data.students]
  );

  const classStudents = useMemo(
    () =>
      selectedClass
        ? data.students
            .filter((s) => s.classSection === selectedClass)
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [selectedClass, data.students]
  );

  const loadRecent = useCallback(async () => {
    if (recentLoaded) return;
    const token = await getToken();
    if (!token) return;
    const awards = await fetchRecent(token);
    setRecentAwards(awards);
    setRecentLoaded(true);
  }, [recentLoaded, getToken]);

  React.useEffect(() => {
    loadRecent();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async () => {
    if (!selectedStudentId || !selectedCategory || !selectedClass) {
      Alert.alert("Incomplete", "Please select a class, student, and category.");
      return;
    }

    setSubmitting(true);
    const token = await getToken();
    if (!token) {
      Alert.alert("Auth error", "Please log in again.");
      setSubmitting(false);
      return;
    }

    const result = await awardPoints(token, {
      studentId: selectedStudentId,
      studentName: selectedStudentName,
      classSection: selectedClass,
      category: selectedCategory,
      points,
      note: note.trim() || undefined,
    });

    setSubmitting(false);

    if (!result.ok) {
      Alert.alert("Error", result.error);
      return;
    }

    showToast(`✓ ${points} pts awarded to ${selectedStudentName}`);
    // Reset form
    setSelectedStudentId("");
    setSelectedStudentName("");
    setSelectedCategory(null);
    setPoints(5);
    setNote("");
    // Refresh recent
    setRecentLoaded(false);
    const awards = await fetchRecent(token);
    setRecentAwards(awards);
    setRecentLoaded(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      {/* Toast */}
      {toast && (
        <View style={[styles.toast, { top: insets.top + 12 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 12 }]}>
        <View style={styles.circle1} />
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Award Points</Text>
            <Text style={styles.headerSub}>Student of the Month</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SELECT CLASS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {allClasses.map((cls) => (
              <TouchableOpacity
                key={cls}
                style={[styles.chip, selectedClass === cls && styles.chipActive]}
                onPress={() => {
                  setSelectedClass(cls);
                  setSelectedStudentId("");
                  setSelectedStudentName("");
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedClass === cls && styles.chipTextActive]}>
                  {cls}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Student selector */}
        {selectedClass !== "" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SELECT STUDENT</Text>
            <View style={styles.studentGrid}>
              {classStudents.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.studentChip,
                    selectedStudentId === s.id && styles.studentChipActive,
                  ]}
                  onPress={() => {
                    setSelectedStudentId(s.id);
                    setSelectedStudentName(s.name);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[styles.studentName, selectedStudentId === s.id && styles.studentNameActive]}
                    numberOfLines={1}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Category selector */}
        {selectedStudentId !== "" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const style = CATEGORY_COLORS[cat];
                const active = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryCard,
                      active && { backgroundColor: style.bg, borderColor: style.text, borderWidth: 1.5 },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: active ? style.bg : "#F0F0EE" }]}>
                      <Feather name={style.icon as any} size={20} color={active ? style.text : "#888882"} />
                    </View>
                    <Text style={[styles.categoryLabel, active && { color: style.text, fontWeight: "700" }]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Points stepper + note */}
        {selectedCategory && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>POINTS (1–10)</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setPoints((p) => Math.max(1, p - 1))}
                activeOpacity={0.7}
              >
                <Feather name="minus" size={20} color="#C0282A" />
              </TouchableOpacity>
              <View style={styles.stepperValue}>
                <Text style={styles.stepperNum}>{points}</Text>
                <Text style={styles.stepperSub}>points</Text>
              </View>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setPoints((p) => Math.min(10, p + 1))}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={20} color="#C0282A" />
              </TouchableOpacity>
            </View>

            {/* Optional note */}
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>REASON (OPTIONAL)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Brief note on why points are awarded…"
              placeholderTextColor="#AAAAAA"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="award" size={18} color="#FFFFFF" />
                  <Text style={styles.submitLabel}>Award {points} Point{points !== 1 ? "s" : ""}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Summary */}
        {selectedStudentId && selectedCategory && (
          <View style={styles.summaryCard}>
            <Feather name="info" size={14} color="#C8972A" />
            <Text style={styles.summaryText}>
              Awarding <Text style={{ fontWeight: "700" }}>{points} pts</Text> to{" "}
              <Text style={{ fontWeight: "700" }}>{selectedStudentName}</Text> for{" "}
              <Text style={{ fontWeight: "700" }}>{CATEGORY_LABELS[selectedCategory]}</Text>
            </Text>
          </View>
        )}

        {/* Recent awards */}
        {recentAwards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR RECENT AWARDS (LAST 7 DAYS)</Text>
            {recentAwards.slice(0, 10).map((a) => (
              <View key={a.id} style={styles.recentCard}>
                <View style={[styles.recentDot, { backgroundColor: CATEGORY_COLORS[a.category]?.text ?? "#888" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentName}>{a.studentName}</Text>
                  <Text style={styles.recentMeta}>
                    {CATEGORY_LABELS[a.category]} · {a.classSection}
                    {a.note ? ` — ${a.note}` : ""}
                  </Text>
                </View>
                <View style={styles.recentPts}>
                  <Text style={styles.recentPtsText}>+{a.points}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  circle1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)", top: -40, right: -30 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, marginBottom: 10 },

  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "transparent", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  chipActive: { backgroundColor: "#C0282A", borderColor: "#C0282A" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#555" },
  chipTextActive: { color: "#FFFFFF" },

  studentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  studentChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "transparent", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  studentChipActive: { borderColor: "#C0282A", backgroundColor: "#FDF0F0" },
  studentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#E8E8E6", alignItems: "center", justifyContent: "center" },
  studentAvatarText: { fontSize: 10, fontWeight: "700", color: "#555" },
  studentName: { fontSize: 12, fontWeight: "500", color: "#1A1A1A", maxWidth: 100 },
  studentNameActive: { color: "#C0282A", fontWeight: "700" },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: { width: "47%", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, alignItems: "center", gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderWidth: 1.5, borderColor: "transparent" },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  categoryLabel: { fontSize: 12, fontWeight: "600", color: "#555", textAlign: "center" },

  stepperRow: { flexDirection: "row", alignItems: "center", gap: 20, alignSelf: "center", backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 24, paddingVertical: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  stepperBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F8EBEB", alignItems: "center", justifyContent: "center" },
  stepperValue: { alignItems: "center", minWidth: 60 },
  stepperNum: { fontSize: 36, fontWeight: "700", color: "#C0282A" },
  stepperSub: { fontSize: 11, color: "#888882", marginTop: -2 },

  noteInput: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, fontSize: 13, color: "#1A1A1A", borderWidth: 1, borderColor: "rgba(0,0,0,0.07)", textAlignVertical: "top", minHeight: 80, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },

  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#C0282A", borderRadius: 14, paddingVertical: 16, marginTop: 16, shadowColor: "#C0282A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnDisabled: { opacity: 0.6 },
  submitLabel: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  summaryCard: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 4, backgroundColor: "#FFF8EC", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "rgba(200,151,42,0.2)" },
  summaryText: { fontSize: 12, color: "#8B6010", flex: 1 },

  recentCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, marginBottom: 8, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  recentDot: { width: 8, height: 8, borderRadius: 4 },
  recentName: { fontSize: 13, fontWeight: "600", color: "#1A1A1A" },
  recentMeta: { fontSize: 11, color: "#888882", marginTop: 2 },
  recentPts: { backgroundColor: "#EAF3DE", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  recentPtsText: { fontSize: 12, fontWeight: "700", color: "#3B6D11" },

  toast: { position: "absolute", left: 20, right: 20, zIndex: 999, backgroundColor: "#1A1A1A", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: "center" },
  toastText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
});
