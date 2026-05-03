import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Mark } from "@/data/mockData";

interface SubjectMarkRowProps {
  mark: Mark;
  showBorder?: boolean;
}

export function SubjectMarkRow({ mark, showBorder = true }: SubjectMarkRowProps) {
  const percentage = Math.round((mark.score / mark.totalMarks) * 100);

  return (
    <View style={[styles.row, showBorder && styles.border]}>
      <View style={[styles.colorBar, { backgroundColor: mark.color }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.subject}>{mark.subject}</Text>
          <Text style={styles.score}>
            {mark.score}
            <Text style={styles.total}>/{mark.totalMarks}</Text>
          </Text>
        </View>
        <Text style={styles.teacher}>{mark.teacher}</Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${percentage}%` as any, backgroundColor: mark.color }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  border: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  colorBar: {
    width: 4,
    borderRadius: 2,
    height: "100%",
    minHeight: 40,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subject: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  score: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  total: {
    fontSize: 12,
    fontWeight: "400",
    color: "#888882",
  },
  teacher: {
    fontSize: 11,
    color: "#888882",
    marginTop: 2,
    marginBottom: 8,
  },
  barBg: {
    height: 4,
    backgroundColor: "#F0F0EE",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
});
