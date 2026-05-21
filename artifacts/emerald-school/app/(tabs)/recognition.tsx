import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db as firestoreDb } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import type { MonthlyWinner } from "@/types/recognition";
import { MONTH_NAMES } from "@/types/recognition";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

async function fetchWinner(
  token: string,
  classSection: string,
  month: number,
  year: number
): Promise<MonthlyWinner | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/months/winner/${encodeURIComponent(classSection)}/${month}/${year}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as MonthlyWinner;
  } catch {
    return null;
  }
}

async function fetchHallOfFame(token: string, classSection: string): Promise<MonthlyWinner[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/months/hall-of-fame/${encodeURIComponent(classSection)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return [];
    return (await res.json()) as MonthlyWinner[];
  } catch {
    return [];
  }
}

async function getToken() {
  const { auth } = await import("@/lib/firebase");
  return auth.currentUser?.getIdToken() ?? null;
}

// Animated trophy card for the winner
function WinnerCard({ winner }: { winner: MonthlyWinner }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scale = shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.04, 1] });

  return (
    <View style={styles.winnerCard}>
      <View style={styles.winnerGradientTop} />
      <View style={styles.winnerCardInner}>
        <Animated.View style={[styles.trophyContainer, { transform: [{ scale }] }]}>
          <Text style={styles.trophyEmoji}>🏆</Text>
        </Animated.View>
        <Text style={styles.winnerLabel}>Most Recognized Student</Text>
        <Text style={styles.winnerName}>{winner.studentName}</Text>
        <Text style={styles.winnerClass}>{winner.classSection}</Text>
        <View style={styles.winnerDateBadge}>
          <Text style={styles.winnerDateText}>
            {MONTH_NAMES[winner.month]} {winner.year}
          </Text>
        </View>
      </View>
      <View style={styles.starRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Text key={i} style={styles.star}>⭐</Text>
        ))}
      </View>
    </View>
  );
}

function ComingSoonCard({ classSection }: { classSection: string }) {
  return (
    <View style={styles.comingSoonCard}>
      <View style={styles.comingSoonIcon}>
        <Feather name="clock" size={28} color="#888882" />
      </View>
      <Text style={styles.comingSoonTitle}>This month's recognition is being finalized</Text>
      <Text style={styles.comingSoonSub}>{classSection}</Text>
    </View>
  );
}

export default function RecognitionScreen() {
  const { user } = useAuth();
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const now = new Date();

  // Find the class section for the current parent's child
  const studentRecord = useMemo(() => {
    if (!user) return undefined;
    return (
      data.students.find((s) => s.admissionNo === user.rollNo) ??
      data.students.find(
        (s) => s.parentEmail?.toLowerCase() === user.email?.toLowerCase()
      )
    );
  }, [user, data.students]);

  const classSection =
    user?.classSection ?? studentRecord?.classSection ?? "";

  const [winner, setWinner] = useState<MonthlyWinner | null | "loading">("loading");
  const [hallOfFame, setHallOfFame] = useState<MonthlyWinner[]>([]);
  const [hallLoaded, setHallLoaded] = useState(false);

  // Real-time Firestore listener for new announcements
  const [liveAnnouncement, setLiveAnnouncement] = useState<{
    studentName: string;
    monthName: string;
    year: number;
  } | null>(null);

  useEffect(() => {
    if (!classSection) return;
    const colRef = collection(
      firestoreDb,
      "notifications",
      classSection,
      "recognition"
    );
    const unsub = onSnapshot(colRef, (snap) => {
      if (snap.empty) return;
      // Find the announcement for current month
      const monthKey = `${now.getMonth() + 1}-${now.getFullYear()}`;
      const doc = snap.docs.find((d) => d.id === monthKey);
      if (doc) {
        const d = doc.data();
        setLiveAnnouncement({
          studentName: d.studentName as string,
          monthName: d.monthName as string,
          year: d.year as number,
        });
      }
    });
    return () => unsub();
  }, [classSection]);

  // Load current winner from API
  useEffect(() => {
    if (!classSection) { setWinner(null); return; }
    let cancelled = false;
    (async () => {
      setWinner("loading");
      const token = await getToken();
      if (!token || cancelled) return;
      const result = await fetchWinner(token, classSection, now.getMonth() + 1, now.getFullYear());
      if (!cancelled) setWinner(result);
    })();
    return () => { cancelled = true; };
  }, [classSection]);

  // Load hall of fame
  useEffect(() => {
    if (!classSection || hallLoaded) return;
    (async () => {
      const token = await getToken();
      if (!token) return;
      const list = await fetchHallOfFame(token, classSection);
      setHallOfFame(list);
      setHallLoaded(true);
    })();
  }, [classSection, hallLoaded]);

  const currentMonthName = MONTH_NAMES[now.getMonth() + 1];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F4F2" }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 16 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <Text style={styles.schoolLabel}>EMERALD INTERNATIONAL SCHOOL</Text>
        <Text style={styles.headerTitle}>Recognition</Text>
        <Text style={styles.headerSub}>{currentMonthName} {now.getFullYear()}</Text>
      </View>

      {/* Live announcement banner */}
      {liveAnnouncement && (
        <View style={styles.announceBanner}>
          <Text style={styles.announceEmoji}>🎉</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.announceTitle}>New Winner Announced!</Text>
            <Text style={styles.announceBody}>
              {liveAnnouncement.studentName} · {liveAnnouncement.monthName} {liveAnnouncement.year}
            </Text>
          </View>
        </View>
      )}

      {/* Current month winner */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>THIS MONTH</Text>

        {winner === "loading" ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#C0282A" />
          </View>
        ) : !classSection ? (
          <View style={styles.noClassCard}>
            <Feather name="info" size={20} color="#888882" />
            <Text style={styles.noClassText}>No class assigned to your account</Text>
          </View>
        ) : winner ? (
          <WinnerCard winner={winner} />
        ) : (
          <ComingSoonCard classSection={classSection} />
        )}
      </View>

      {/* Hall of Fame */}
      {classSection && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WALL OF RECOGNITION</Text>

          {hallOfFame.length === 0 && hallLoaded ? (
            <View style={styles.emptyHall}>
              <Feather name="award" size={24} color="#CCC" />
              <Text style={styles.emptyHallText}>No past winners yet</Text>
            </View>
          ) : (
            hallOfFame.map((w, i) => (
              <View key={`${w.classSection}-${w.month}-${w.year}`} style={styles.hallCard}>
                <View style={styles.hallMedal}>
                  <Text style={styles.hallMedalText}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hallName}>{w.studentName}</Text>
                  <Text style={styles.hallDate}>{MONTH_NAMES[w.month]} {w.year}</Text>
                </View>
                <Text style={styles.hallClass}>{w.classSection}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", paddingHorizontal: 20, paddingBottom: 24, overflow: "hidden" },
  circle1: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.06)", top: -60, right: -50 },
  circle2: { position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.05)", bottom: -40, left: -20 },
  schoolLabel: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.65)", letterSpacing: 1, marginBottom: 6 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#FFFFFF" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  announceBanner: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginTop: 14, backgroundColor: "#FFF8EC", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(200,151,42,0.3)" },
  announceEmoji: { fontSize: 24 },
  announceTitle: { fontSize: 13, fontWeight: "700", color: "#8B6010" },
  announceBody: { fontSize: 12, color: "#7A5A0F", marginTop: 2 },

  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, marginBottom: 12 },

  loadingContainer: { alignItems: "center", paddingVertical: 40 },

  winnerCard: { backgroundColor: "#FFFFFF", borderRadius: 20, overflow: "hidden", shadowColor: "#C8972A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 6, borderWidth: 1.5, borderColor: "rgba(200,151,42,0.25)" },
  winnerGradientTop: { height: 6, backgroundColor: "#C8972A" },
  winnerCardInner: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 },
  trophyContainer: { marginBottom: 12 },
  trophyEmoji: { fontSize: 52 },
  winnerLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  winnerName: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", textAlign: "center" },
  winnerClass: { fontSize: 13, color: "#888882", marginTop: 4, marginBottom: 12 },
  winnerDateBadge: { backgroundColor: "#FFF8EC", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(200,151,42,0.3)" },
  winnerDateText: { fontSize: 12, fontWeight: "700", color: "#C8972A" },
  starRow: { flexDirection: "row", justifyContent: "center", paddingVertical: 12, gap: 4, backgroundColor: "#FFFAF0" },
  star: { fontSize: 14 },

  comingSoonCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 36, paddingHorizontal: 20, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  comingSoonIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#F0F0EE", alignItems: "center", justifyContent: "center" },
  comingSoonTitle: { fontSize: 15, fontWeight: "600", color: "#555", textAlign: "center" },
  comingSoonSub: { fontSize: 12, color: "#888882" },

  noClassCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16 },
  noClassText: { fontSize: 13, color: "#888882" },

  emptyHall: { alignItems: "center", paddingVertical: 28, gap: 10 },
  emptyHallText: { fontSize: 13, color: "#888882" },

  hallCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  hallMedal: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFF8EC", alignItems: "center", justifyContent: "center" },
  hallMedalText: { fontSize: 20 },
  hallName: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  hallDate: { fontSize: 12, color: "#888882", marginTop: 2 },
  hallClass: { fontSize: 12, fontWeight: "600", color: "#888882", backgroundColor: "#F0F0EE", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});
