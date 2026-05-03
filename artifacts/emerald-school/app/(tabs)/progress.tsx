import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SubjectMarkRow } from "@/components/SubjectMarkRow";
import { MARKS } from "@/data/mockData";

export default function ProgressPage() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const avgScore = Math.round(MARKS.reduce((s, m) => s + m.score, 0) / MARKS.length);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F4F2" }}
      contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <Text style={styles.headerTitle}>My Progress</Text>
        <Text style={styles.headerSub}>Term 2 · 2024–25</Text>
      </View>

      <View style={styles.attendanceCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.attendancePercent}>92%</Text>
          <Text style={styles.attendanceLabel}>Present this term</Text>
          <Text style={styles.attendanceSub}>138 / 150 days</Text>
          <TouchableOpacity
            style={styles.viewCalBtn}
            onPress={() => router.push("/attendance")}
            activeOpacity={0.7}
          >
            <Text style={styles.viewCalText}>View Calendar</Text>
            <Feather name="arrow-right" size={14} color="#C0282A" />
          </TouchableOpacity>
        </View>
        <View style={styles.circleContainer}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Text style={styles.circlePercent}>92</Text>
              <Text style={styles.circleLabel}>%</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{avgScore}</Text>
          <Text style={styles.summaryLabel}>Average Score</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{MARKS.length}</Text>
          <Text style={styles.summaryLabel}>Subjects</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: "#3B6D11" }]}>A</Text>
          <Text style={styles.summaryLabel}>Grade</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>SUBJECT MARKS</Text>
        <Text style={styles.sectionMeta}>Unit Test · Term 2</Text>
      </View>

      <View style={styles.marksCard}>
        {MARKS.map((mark, i) => (
          <SubjectMarkRow
            key={mark.subject}
            mark={mark}
            showBorder={i < MARKS.length - 1}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel2}>TEACHER REMARKS</Text>
      <View style={styles.remarksCard}>
        <View style={styles.remarkRow}>
          <View style={styles.remarkDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.remarkSubject}>Mathematics</Text>
            <Text style={styles.remarkText}>"Aryan shows excellent problem-solving skills. Needs more practice with geometry proofs." — Mr. Rajan</Text>
          </View>
        </View>
        <View style={[styles.remarkRow, { borderTopWidth: 0.5, borderTopColor: "rgba(0,0,0,0.08)", paddingTop: 14 }]}>
          <View style={[styles.remarkDot, { backgroundColor: "#185FA5" }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.remarkSubject}>Physics</Text>
            <Text style={styles.remarkText}>"Good understanding of concepts. Practical lab work needs improvement." — Ms. Priya</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#C0282A",
    paddingHorizontal: 20,
    paddingBottom: 22,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -40,
    right: -30,
  },
  circle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: -20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  attendanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    margin: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  attendancePercent: {
    fontSize: 36,
    fontWeight: "700",
    color: "#C0282A",
    lineHeight: 40,
  },
  attendanceLabel: {
    fontSize: 13,
    color: "#555550",
    marginTop: 2,
  },
  attendanceSub: {
    fontSize: 11,
    color: "#888882",
    marginTop: 2,
    marginBottom: 10,
  },
  viewCalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewCalText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C0282A",
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  outerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8EBEB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 7,
    borderColor: "#C0282A",
  },
  innerCircle: {
    alignItems: "center",
  },
  circlePercent: {
    fontSize: 20,
    fontWeight: "700",
    color: "#C0282A",
    lineHeight: 22,
  },
  circleLabel: {
    fontSize: 10,
    color: "#C0282A",
    lineHeight: 12,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#C0282A",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#888882",
    marginTop: 2,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888882",
    letterSpacing: 0.8,
  },
  sectionMeta: {
    fontSize: 11,
    color: "#888882",
  },
  sectionLabel2: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888882",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  marksCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  remarksCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  remarkRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  remarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C0282A",
    marginTop: 5,
    flexShrink: 0,
  },
  remarkSubject: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  remarkText: {
    fontSize: 12,
    color: "#555550",
    lineHeight: 18,
    fontStyle: "italic",
  },
});
