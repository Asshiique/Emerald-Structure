import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { FadeSlideIn } from "@/components/FadeSlideIn";
import { StarRating } from "@/components/StarRating";

type FeedbackStatus = "pending" | "reviewed" | "resolved";
type FeedbackItem = {
  id: string;
  type: "complaint" | "suggestion" | "appreciation";
  category: string;
  message: string;
  rating: number | null;
  appreciatedTeacherName: string | null;
  anonymous: boolean;
  parentName: string | null;
  parentEmail: string | null;
  studentName: string | null;
  classSection: string | null;
  status: FeedbackStatus;
  createdAt: { seconds: number } | null;
};

const TYPE_COLORS = {
  complaint:    { icon: "alert-circle" as const, color: "#C0282A", bg: "#F8EBEB" },
  suggestion:   { icon: "zap" as const,          color: "#185FA5", bg: "#EAF0FB" },
  appreciation: { icon: "heart" as const,        color: "#C8972A", bg: "#FFF8EC" },
} as const;

const STATUS_COLORS: Record<FeedbackStatus, { bg: string; text: string }> = {
  pending: { bg: "#FFF8EC", text: "#C8972A" },
  reviewed: { bg: "#EAF0FB", text: "#185FA5" },
  resolved: { bg: "#EAF3DE", text: "#27500A" },
};

const FILTERS: { key: FeedbackStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "reviewed", label: "Reviewed" },
  { key: "resolved", label: "Resolved" },
];

export default function AdminFeedbackPage() {
  useRoleGuard(["admin"]);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedbackStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "complaint" | "suggestion" | "appreciation">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedbackItem)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = items.filter((item) => {
    if (filter !== "all" && item.status !== filter) return false;
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    return true;
  });

  const setStatus = async (id: string, status: FeedbackStatus) => {
    setUpdating(id);
    await updateDoc(doc(db, "feedback", id), { status });
    setUpdating(null);
  };

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return "";
    return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Feedback Inbox</Text>
          <Text style={styles.headerSub}>
            {pendingCount > 0 ? `${pendingCount} pending review` : "All caught up!"}
          </Text>
        </View>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f.key} style={[styles.filterChip, filter === f.key && styles.filterChipActive]} onPress={() => setFilter(f.key)} activeOpacity={0.8}>
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.filterDivider} />
          {(["all", "complaint", "suggestion", "appreciation"] as const).map((t) => (
            <TouchableOpacity key={t} style={[styles.filterChip, typeFilter === t && styles.filterChipActive]} onPress={() => setTypeFilter(t)} activeOpacity={0.8}>
              <Text style={[styles.filterChipText, typeFilter === t && styles.filterChipTextActive]}>
                {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#C0282A" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Feather name="inbox" size={40} color="#888882" />
          <Text style={styles.emptyText}>No feedback matching this filter</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          {filtered.map((item, i) => {
            const sc = STATUS_COLORS[item.status];
            return (
              <FadeSlideIn key={item.id} delay={i * 40}>
                <View style={styles.card}>
                  {/* Card header */}
                  <View style={styles.cardTop}>
                    <View style={[styles.typePill, { backgroundColor: TYPE_COLORS[item.type]?.bg ?? "#F5F4F2" }]}>
                      <Feather name={TYPE_COLORS[item.type]?.icon ?? "message-circle"} size={12} color={TYPE_COLORS[item.type]?.color ?? "#555"} />
                      <Text style={[styles.typePillText, { color: TYPE_COLORS[item.type]?.color }]}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </Text>
                    </View>
                    {item.type !== "appreciation" && (
                      <View style={styles.catPill}>
                        <Text style={styles.catPillText}>{item.category}</Text>
                      </View>
                    )}
                    <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
                    </View>
                  </View>

                  {/* Star rating for appreciations */}
                  {item.type === "appreciation" && item.rating != null && (
                    <View style={styles.ratingRow}>
                      <StarRating value={item.rating} onChange={() => {}} size={20} readonly />
                      {item.appreciatedTeacherName && (
                        <Text style={styles.teacherTag}>for {item.appreciatedTeacherName}</Text>
                      )}
                    </View>
                  )}

                  {/* Message */}
                  <Text style={styles.messageText}>{item.message}</Text>

                  {/* Identity */}
                  <View style={styles.identityRow}>
                    <Feather name={item.anonymous ? "eye-off" : "user"} size={12} color="#888882" />
                    <Text style={styles.identityText}>
                      {item.anonymous
                        ? "Anonymous submission"
                        : `${item.parentName ?? "Unknown"} · ${item.studentName ? `Parent of ${item.studentName}` : ""} · ${item.classSection ?? ""}`}
                    </Text>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    {(["pending", "reviewed", "resolved"] as FeedbackStatus[]).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.actionBtn, item.status === s && styles.actionBtnActive]}
                        onPress={() => setStatus(item.id, s)}
                        disabled={updating === item.id}
                        activeOpacity={0.8}
                      >
                        {updating === item.id && item.status !== s ? (
                          <ActivityIndicator size="small" color="#888882" />
                        ) : (
                          <Text style={[styles.actionBtnText, item.status === s && styles.actionBtnTextActive]}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </FadeSlideIn>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  filterBar: { backgroundColor: "#FFFFFF", borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.08)" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#F5F4F2" },
  filterChipActive: { backgroundColor: "#C0282A" },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#555550" },
  filterChipTextActive: { color: "#FFFFFF" },
  filterDivider: { width: 1, height: "100%", backgroundColor: "rgba(0,0,0,0.1)", marginHorizontal: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14, color: "#888882" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  typePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typePillText: { fontSize: 11, fontWeight: "700" },
  catPill: { backgroundColor: "#F5F4F2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  catPillText: { fontSize: 11, color: "#555550", fontWeight: "500" },
  statusPill: { marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },
  messageText: { fontSize: 14, color: "#1A1A1A", lineHeight: 21 },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  identityText: { fontSize: 11, color: "#888882", flex: 1 },
  dateText: { fontSize: 11, color: "#AAAAAA" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFF8EC", borderRadius: 10, padding: 10 },
  teacherTag: { fontSize: 12, fontWeight: "600", color: "#C8972A", flex: 1 },
  actionsRow: { flexDirection: "row", gap: 6, paddingTop: 4, borderTopWidth: 0.5, borderTopColor: "rgba(0,0,0,0.07)" },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: "#F5F4F2", alignItems: "center" },
  actionBtnActive: { backgroundColor: "#C0282A" },
  actionBtnText: { fontSize: 12, fontWeight: "600", color: "#555550" },
  actionBtnTextActive: { color: "#FFFFFF" },
});
