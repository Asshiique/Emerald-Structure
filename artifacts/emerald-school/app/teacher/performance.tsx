import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Evaluation, useData } from "@/context/DataContext";

const CRITERIA_LABELS: Record<keyof Evaluation["ratings"], string> = {
  teachingQuality: "Teaching Quality",
  classroomManagement: "Classroom Management",
  studentEngagement: "Student Engagement",
  punctuality: "Punctuality & Discipline",
  parentCommunication: "Communication with Parents",
  homeworkManagement: "Homework & Task Management",
};

function ratingColor(r: number) {
  if (r >= 4) return { bg: "#EAF3DE", color: "#27500A", label: "Excellent" };
  if (r === 3) return { bg: "#FFF8EC", color: "#8B6010", label: "Average" };
  return { bg: "#F8EBEB", color: "#8B1A1B", label: "Needs Improvement" };
}

function EvalCard({ ev }: { ev: Evaluation }) {
  const [expanded, setExpanded] = useState(false);
  const rc = ratingColor(ev.overallRating);

  return (
    <TouchableOpacity style={styles.card} onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.evalDate}>{ev.date}</Text>
          <Text style={styles.evalBy} numberOfLines={1}>Evaluated by Principal</Text>
        </View>
        <View style={[styles.ratingBadge, { backgroundColor: rc.bg }]}>
          <Text style={[styles.ratingNum, { color: rc.color }]}>{ev.overallRating}/5</Text>
          <Text style={[styles.ratingLabel, { color: rc.color }]}>{rc.label}</Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#888882" style={{ marginLeft: 8 }} />
      </View>

      {!expanded && (
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map((n) => (
            <Feather key={n} name="star" size={14} color={n <= ev.overallRating ? "#C8972A" : "#E0E0E0"} />
          ))}
          {ev.remarks ? <Text style={styles.remarkPreview} numberOfLines={1}>{ev.remarks}</Text> : null}
        </View>
      )}

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.subSection}>CRITERIA RATINGS</Text>
          {(Object.entries(ev.ratings) as [keyof Evaluation["ratings"], number][]).map(([key, val]) => (
            <View key={key} style={styles.criteriaRow}>
              <Text style={styles.criteriaLabel}>{CRITERIA_LABELS[key]}</Text>
              <View style={{ flexDirection: "row", gap: 2 }}>
                {[1,2,3,4,5].map((n) => (
                  <Feather key={n} name="star" size={13} color={n <= val ? "#C8972A" : "#E0E0E0"} />
                ))}
              </View>
            </View>
          ))}

          {ev.strengths ? (
            <View style={styles.remarkBox}>
              <Text style={styles.remarkTitle}>Strengths</Text>
              <Text style={styles.remarkText}>{ev.strengths}</Text>
            </View>
          ) : null}

          {ev.improvements ? (
            <View style={[styles.remarkBox, { backgroundColor: "#FFF8EC" }]}>
              <Text style={[styles.remarkTitle, { color: "#8B6010" }]}>Areas for Improvement</Text>
              <Text style={[styles.remarkText, { color: "#7A5A0F" }]}>{ev.improvements}</Text>
            </View>
          ) : null}

          {ev.remarks ? (
            <View style={[styles.remarkBox, { backgroundColor: "#F5F4F2" }]}>
              <Text style={[styles.remarkTitle, { color: "#555550" }]}>Admin Remarks</Text>
              <Text style={[styles.remarkText, { color: "#555550" }]}>{ev.remarks}</Text>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TeacherPerformancePage() {
  const { user } = useAuth();
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const staffRecord = data.staff.find((s) => s.email.toLowerCase() === user?.email?.toLowerCase());
  const evaluations = data.evaluations
    .filter((e) => e.teacherId === staffRecord?.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const avgRating = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + e.overallRating, 0) / evaluations.length).toFixed(1)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Performance</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {avgRating && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryNum}>{avgRating}</Text>
              <Text style={styles.summaryLabel}>Average Rating</Text>
              <View style={styles.starsRowLarge}>
                {[1,2,3,4,5].map((n) => (
                  <Feather key={n} name="star" size={18} color={n <= Math.round(parseFloat(avgRating)) ? "#C8972A" : "#E0E0E0"} />
                ))}
              </View>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.evalCountNum}>{evaluations.length}</Text>
              <Text style={styles.evalCountLabel}>Evaluations</Text>
            </View>
          </View>
        )}

        <View style={styles.readOnlyBanner}>
          <Feather name="eye" size={14} color="#1A5FA5" />
          <Text style={styles.readOnlyText}>You can view your evaluations. Only the principal can create or edit evaluations.</Text>
        </View>

        {evaluations.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="star" size={36} color="#C0282A" />
            <Text style={styles.emptyTitle}>No evaluations yet</Text>
            <Text style={styles.emptySubtitle}>Your performance evaluations will appear here once the principal has added them.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>ALL EVALUATIONS</Text>
            {evaluations.map((ev) => <EvalCard key={ev.id} ev={ev} />)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  summaryCard: { backgroundColor: "#C0282A", borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "center", marginBottom: 12, overflow: "hidden" },
  summaryLeft: { flex: 1, alignItems: "flex-start" },
  summaryNum: { fontSize: 48, fontWeight: "700", color: "#FFFFFF", lineHeight: 52 },
  summaryLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 8 },
  starsRowLarge: { flexDirection: "row", gap: 4 },
  summaryRight: { alignItems: "center" },
  evalCountNum: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  evalCountLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  readOnlyBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#E8F1FB", borderRadius: 10, padding: 12, marginBottom: 14 },
  readOnlyText: { flex: 1, fontSize: 12, color: "#1A5FA5", lineHeight: 18 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, marginBottom: 10 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  evalDate: { fontSize: 13, fontWeight: "700", color: "#1A1A1A" },
  evalBy: { fontSize: 11, color: "#888882", marginTop: 2 },
  ratingBadge: { padding: 8, borderRadius: 10, alignItems: "center" },
  ratingNum: { fontSize: 16, fontWeight: "700" },
  ratingLabel: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  remarkPreview: { flex: 1, fontSize: 11, color: "#888882", marginLeft: 8, fontStyle: "italic" },
  expandedContent: { marginTop: 8, gap: 0 },
  subSection: { fontSize: 10, fontWeight: "700", color: "#888882", letterSpacing: 0.8, marginBottom: 10 },
  criteriaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  criteriaLabel: { fontSize: 12, color: "#555550", flex: 1 },
  remarkBox: { backgroundColor: "#EAF3DE", borderRadius: 8, padding: 10, marginTop: 8 },
  remarkTitle: { fontSize: 10, fontWeight: "700", color: "#27500A", letterSpacing: 0.5, marginBottom: 4 },
  remarkText: { fontSize: 12, color: "#3B6D11", lineHeight: 18 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  emptySubtitle: { fontSize: 13, color: "#888882", textAlign: "center", lineHeight: 20 },
});
