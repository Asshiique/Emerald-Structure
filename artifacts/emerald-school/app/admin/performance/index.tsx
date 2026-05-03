import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";

function getInitials(name: string) { return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(); }
function ratingColor(r: number) { if (r >= 4) return { bg: "#EAF3DE", color: "#27500A", label: "Excellent" }; if (r === 3) return { bg: "#FFF8EC", color: "#8B6010", label: "Average" }; return { bg: "#F8EBEB", color: "#8B1A1B", label: "Needs Improvement" }; }

export default function PerformancePage() {
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const teachers = data.staff.filter((s) => s.isActive && (s.role === "Class Teacher" || s.role === "Subject Teacher"));
  const latestEval = (teacherId: string) => data.evaluations.filter((e) => e.teacherId === teacherId).sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}><TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#FFFFFF" /></TouchableOpacity><Text style={styles.headerTitle}>Teacher Performance</Text><View style={{ width: 44 }} /></View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {teachers.length === 0 ? <View style={styles.empty}><Feather name="star" size={36} color="#C0282A" /><Text style={styles.emptyText}>No teachers found</Text></View> : teachers.map((t) => { const latest = latestEval(t.id); const evalCount = data.evaluations.filter((e) => e.teacherId === t.id).length; const rc = latest ? ratingColor(latest.overallRating) : null; return <View key={t.id} style={styles.card}><View style={styles.cardTop}><View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(t.name)}</Text></View><View style={{ flex: 1 }}><Text style={styles.name}>{t.name}</Text><Text style={styles.meta}>{t.department} · {t.role}</Text><Text style={styles.section}>{t.classSection ? `Class ${t.classSection}` : ""}</Text></View>{rc ? <View style={[styles.ratingBadge, { backgroundColor: rc.bg }]}><Text style={[styles.ratingNum, { color: rc.color }]}>{latest!.overallRating}/5</Text><Text style={[styles.ratingLabel, { color: rc.color }]}>{rc.label}</Text></View> : null}</View><Text style={styles.previewDate}>{evalCount} evaluation{evalCount !== 1 ? "s" : ""}</Text>{latest ? <Text style={styles.previewRemark} numberOfLines={1}>{latest.remarks}</Text> : <Text style={styles.noEval}>No evaluations yet</Text>}<View style={styles.cardActions}><TouchableOpacity style={styles.historyBtn} onPress={() => router.push(`/admin/performance/${t.id}?mode=history`)}><Feather name="clock" size={14} color="#555550" /><Text style={styles.historyText}>History ({evalCount})</Text></TouchableOpacity><TouchableOpacity style={styles.evalBtn} onPress={() => router.push(`/admin/performance/${t.id}?mode=evaluate`)}><Feather name="star" size={14} color="#FFFFFF" /><Text style={styles.evalText}>Evaluate</Text></TouchableOpacity></View></View>; })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16 }, backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" }, empty: { alignItems: "center", paddingTop: 80, gap: 12 }, emptyText: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" }, card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10 }, cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F8EBEB", alignItems: "center", justifyContent: "center" }, avatarText: { fontSize: 15, fontWeight: "700", color: "#C0282A" }, name: { fontSize: 14, fontWeight: "700", color: "#1A1A1A", marginBottom: 2 }, meta: { fontSize: 12, color: "#555550", marginBottom: 2 }, section: { fontSize: 11, color: "#C0282A", fontWeight: "600" }, ratingBadge: { padding: 8, borderRadius: 10, alignItems: "center" }, ratingNum: { fontSize: 16, fontWeight: "700" }, ratingLabel: { fontSize: 10, fontWeight: "600", marginTop: 2 }, previewDate: { fontSize: 11, color: "#888882", marginBottom: 3 }, previewRemark: { fontSize: 12, color: "#555550", fontStyle: "italic", marginBottom: 10 }, noEval: { fontSize: 12, color: "#AAAAAA", marginBottom: 10 }, cardActions: { flexDirection: "row", gap: 8 }, historyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: "#F5F4F2" }, historyText: { fontSize: 13, fontWeight: "600", color: "#555550" }, evalBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: "#C0282A" }, evalText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" } });