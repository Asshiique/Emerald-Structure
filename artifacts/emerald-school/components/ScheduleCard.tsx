import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ScheduleCardProps {
  time: string;
  subject: string;
  teacher: string;
  isActive?: boolean;
}

export function ScheduleCard({ time, subject, teacher, isActive }: ScheduleCardProps) {
  return (
    <View style={[styles.card, isActive && styles.activeCard]}>
      <Text style={[styles.time, isActive && styles.activeText]}>{time}</Text>
      <Text style={[styles.subject, isActive && styles.activeText]} numberOfLines={1}>
        {subject}
      </Text>
      {teacher ? (
        <Text style={[styles.teacher, isActive && styles.activeTextMuted]} numberOfLines={1}>
          {teacher}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activeCard: {
    backgroundColor: "#C0282A",
  },
  time: {
    fontSize: 10,
    color: "#888882",
    marginBottom: 4,
  },
  subject: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  teacher: {
    fontSize: 10,
    color: "#888882",
    marginTop: 4,
  },
  activeText: {
    color: "#FFFFFF",
  },
  activeTextMuted: {
    color: "rgba(255,255,255,0.75)",
  },
});
