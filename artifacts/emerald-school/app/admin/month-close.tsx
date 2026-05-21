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
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import type { PointAward } from "@/types/recognition";
import { CATEGORY_LABELS, MONTH_NAMES } from "@/types/recognition";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

async function fetchLeaderboard(
  token: string,
  classSection: string,
  month: number,
  year: number
) {
  const res = await fetch(
    `${API_URL}/api/points/leaderboard/${encodeURIComponent(classSection)}/${month}/${year}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error((await res.json() as any).message ?? "Failed");
  return res.json() as Promise<{
    classSection: string;
    month: number;
    year: number;
    isClosed: boolean;
    closedWinner: { studentId: string; studentName: string } | null;
    isRepeatWinner: boolean;
    leaderboard: {
      studentId: string;
      studentName: string;
      totalPoints: number;
      breakdown: Partial<Record<string, number>>;
      awards: PointAward[];
    }[];
  }>;
}

async function closeMonth(
  token: string,
  classSection: string,
  month: number,
  year: number,
  confirmRepeat: boolean
) {
  const res = await fetch(
    `${API_URL}/api/months/close/${encodeURIComponent(classSection)}/${month}/${year}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ confirmRepeat }),
    }
  );
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function getToken() {
  const { auth } = await import("@/lib/firebase");
  return auth.currentUser?.getIdToken() ?? null;
}

const NOW = new Date();

export default function MonthCloseScreen() {
  useRoleGuard(["admin"]);
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const allClasses = useMemo(
    () => [...new Set(data.students.map((s) => s.classSection))].sort(),
    [data.students]
  );

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(NOW.getMonth() + 1); // 1-based
  const [selectedYear, setSelectedYear] = useState(NOW.getFullYear());

  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Awaited<ReturnType<typeof fetchLeaderboard>> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handlePreview = useCallback(async () => {
    if (!selectedClass) {
      Alert.alert("Select a class", "Please choose a class first.");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const result = await fetchLeaderboard(token, selectedClass, selectedMonth, selectedYear);
      setLeaderboard(result);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedMonth, selectedYear]);

  const handleClose = useCallback(
    async (confirmRepeat = false) => {
      if (!leaderboard || leaderboard.leaderboard.length === 0) return;
      setClosing(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Not authenticated");
        const result = await closeMonth(token, selectedClass, selectedMonth, selectedYear, confirmRepeat);

        if (!result.ok && result.status === 422 && result.data?.isRepeatWinner) {
          // Ask for confirmation
          Alert.alert(
            "⚠️ Repeat Winner",
            `${result.data.topStudent?.studentName ?? "This student"} won last month too. Confirm to announce again?`,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Confirm Anyway", style: "destructive", onPress: () => handleClose(true) },
            ]
          );
          return;
        }

        if (!result.ok) {
          Alert.alert("Error", result.data?.message ?? "Failed to close month");
          return;
        }

        showToast(`🎉 ${result.data.winner?.studentName} announced as winner!`);
        // Refresh leaderboard to show closed state
        const updated = await fetchLeaderboard(token, selectedClass, selectedMonth, selectedYear);
        setLeaderboard(updated);
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Something went wrong");
      } finally {
        setClosing(false);
      }
    },
    [leaderboard, selectedClass, selectedMonth, selectedYear]
  );

  const years = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];
  const top = leaderboard?.leaderboard[0];

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
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
            <Text style={styles.headerTitle}>Close Month</Text>
            <Text style={styles.headerSub}>Announce Student of the Month</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Class selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CLASS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {allClasses.map((cls) => (
              <TouchableOpacity
                key={cls}
                style={[styles.chip, selectedClass === cls && styles.chipActive]}
                onPress={() => { setSelectedClass(cls); setLeaderboard(null); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedClass === cls && styles.chipTextActive]}>
                  {cls}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Month selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MONTH</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {MONTH_NAMES.slice(1).map((name, i) => {
              const m = i + 1;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, selectedMonth === m && styles.chipActive]}
                  onPress={() => { setSelectedMonth(m); setLeaderboard(null); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedMonth === m && styles.chipTextActive]}>
                    {name.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Year selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YEAR</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {years.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.chip, selectedYear === y && styles.chipActive]}
                onPress={() => { setSelectedYear(y); setLeaderboard(null); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedYear === y && styles.chipTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.previewBtn, (!selectedClass || loading) && styles.btnDisabled]}
            onPress={handlePreview}
            disabled={!selectedClass || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#C0282A" />
            ) : (
              <>
                <Feather name="eye" size={18} color="#C0282A" />
                <Text style={styles.previewLabel}>Preview Winner</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Leaderboard results */}
        {leaderboard && (
          <>
            {/* Already closed banner */}
            {leaderboard.isClosed && (
              <View style={styles.closedBanner}>
                <Feather name="check-circle" size={18} color="#3B6D11" />
                <Text style={styles.closedText}>
                  Month already closed — winner:{" "}
                  <Text style={{ fontWeight: "700" }}>{leaderboard.closedWinner?.studentName}</Text>
                </Text>
              </View>
            )}

            {/* Repeat winner warning */}
            {!leaderboard.isClosed && leaderboard.isRepeatWinner && top && (
              <View style={styles.repeatBanner}>
                <Feather name="alert-triangle" size={18} color="#BA7517" />
                <Text style={styles.repeatText}>
                  <Text style={{ fontWeight: "700" }}>{top.studentName}</Text> won last month too.
                  You'll be asked to confirm before announcing.
                </Text>
              </View>
            )}

            {/* Top student winner card */}
            {top && !leaderboard.isClosed && (
              <View style={[styles.section, { marginTop: 8 }]}>
                <Text style={styles.sectionLabel}>TOP STUDENT</Text>
                <View style={styles.winnerCard}>
                  <View style={styles.trophyBadge}>
                    <Text style={styles.trophyEmoji}>🏆</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.winnerName}>{top.studentName}</Text>
                    <Text style={styles.winnerClass}>{leaderboard.classSection}</Text>
                    <View style={styles.breakdownRow}>
                      {Object.entries(top.breakdown).map(([cat, pts]) => (
                        <View key={cat} style={styles.breakdownPill}>
                          <Text style={styles.breakdownText}>
                            {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat}: {pts}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.totalBadge}>
                    <Text style={styles.totalNum}>{top.totalPoints}</Text>
                    <Text style={styles.totalSub}>pts</Text>
                  </View>
                </View>

                {/* Other students */}
                {leaderboard.leaderboard.slice(1, 5).map((s, i) => (
                  <View key={s.studentId} style={styles.rankRow}>
                    <Text style={styles.rankNum}>{i + 2}</Text>
                    <Text style={styles.rankName} numberOfLines={1}>{s.studentName}</Text>
                    <Text style={styles.rankPts}>{s.totalPoints} pts</Text>
                  </View>
                ))}
              </View>
            )}

            {/* No awards */}
            {leaderboard.leaderboard.length === 0 && (
              <View style={styles.emptyState}>
                <Feather name="inbox" size={32} color="#CCC" />
                <Text style={styles.emptyText}>No points recorded for this class this month</Text>
              </View>
            )}

            {/* Confirm & Announce button */}
            {!leaderboard.isClosed && leaderboard.leaderboard.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={[styles.announceBtn, closing && styles.btnDisabled]}
                  onPress={() => handleClose(false)}
                  disabled={closing}
                  activeOpacity={0.8}
                >
                  {closing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="award" size={18} color="#FFFFFF" />
                      <Text style={styles.announceLabel}>Confirm &amp; Announce Winner</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={styles.announceHint}>
                  This will notify all parents of {selectedClass} and cannot be undone.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#1A3A4C", paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  circle1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.05)", top: -40, right: -30 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, marginBottom: 10 },

  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "transparent", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  chipActive: { backgroundColor: "#1A3A4C", borderColor: "#1A3A4C" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#555" },
  chipTextActive: { color: "#FFFFFF" },

  previewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#FFFFFF", borderRadius: 14, paddingVertical: 14, borderWidth: 2, borderColor: "#C0282A", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  previewLabel: { fontSize: 15, fontWeight: "700", color: "#C0282A" },
  btnDisabled: { opacity: 0.5 },

  closedBanner: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 12, backgroundColor: "#EAF3DE", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "rgba(59,109,17,0.2)" },
  closedText: { flex: 1, fontSize: 13, color: "#3B6D11" },

  repeatBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginHorizontal: 16, marginTop: 12, backgroundColor: "#FFF3DC", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "rgba(186,117,23,0.3)" },
  repeatText: { flex: 1, fontSize: 13, color: "#7A4E10" },

  winnerCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4, marginBottom: 12, borderWidth: 1, borderColor: "rgba(200,151,42,0.3)" },
  trophyBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFF8EC", alignItems: "center", justifyContent: "center" },
  trophyEmoji: { fontSize: 26 },
  winnerName: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  winnerClass: { fontSize: 12, color: "#888882", marginTop: 2, marginBottom: 8 },
  breakdownRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  breakdownPill: { backgroundColor: "#F0F0EE", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  breakdownText: { fontSize: 10, color: "#555", fontWeight: "600" },
  totalBadge: { alignItems: "center", backgroundColor: "#FFF8EC", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  totalNum: { fontSize: 22, fontWeight: "800", color: "#C8972A" },
  totalSub: { fontSize: 10, color: "#C8972A", fontWeight: "600" },

  rankRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 6, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  rankNum: { width: 22, fontSize: 14, fontWeight: "700", color: "#888882", textAlign: "center" },
  rankName: { flex: 1, fontSize: 13, fontWeight: "600", color: "#1A1A1A" },
  rankPts: { fontSize: 13, fontWeight: "700", color: "#555" },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: "#888882", textAlign: "center", paddingHorizontal: 32 },

  announceBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#C0282A", borderRadius: 14, paddingVertical: 16, shadowColor: "#C0282A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  announceLabel: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  announceHint: { fontSize: 11, color: "#888882", textAlign: "center", marginTop: 8 },

  toast: { position: "absolute", left: 20, right: 20, zIndex: 999, backgroundColor: "#1A3A4C", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, alignItems: "center" },
  toastText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
});
