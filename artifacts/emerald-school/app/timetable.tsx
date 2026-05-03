import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TIMETABLE } from "@/data/mockData";

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#C0282A",
  Physics: "#185FA5",
  English: "#3B6D11",
  Chemistry: "#BA7517",
  Biology: "#7B3F9E",
  "Computer Science": "#1A7A6E",
};

export default function TimetablePage() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const today = new Date().getDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[today];
  const defaultDay = TIMETABLE.find((t) => t.day === todayName)
    ? todayName
    : "Monday";
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const currentDay = TIMETABLE.find((t) => t.day === selectedDay) ?? TIMETABLE[0]!;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Timetable</Text>
          <Text style={styles.headerSub}>Class X-B · 2024–25</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayScroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 0 }}
      >
        {TIMETABLE.map((day) => (
          <TouchableOpacity
            key={day.day}
            style={[styles.dayChip, selectedDay === day.day && styles.dayChipActive]}
            onPress={() => setSelectedDay(day.day)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayChipText, selectedDay === day.day && styles.dayChipTextActive]}>
              {day.day.slice(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {currentDay.slots.map((slot, i) => {
            const color = SUBJECT_COLORS[slot.subject] ?? "#888882";
            return (
              <View
                key={i}
                style={[styles.slotRow, i < currentDay.slots.length - 1 && styles.slotBorder]}
              >
                <Text style={styles.slotTime}>{slot.time}</Text>
                <View style={[styles.slotDot, { backgroundColor: color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.slotSubject}>{slot.subject}</Text>
                  {slot.teacher ? (
                    <Text style={styles.slotTeacher}>{slot.teacher}</Text>
                  ) : null}
                </View>
                <View style={[styles.slotColorBar, { backgroundColor: color + "20" }]}>
                  <View style={[styles.slotColorBarFill, { backgroundColor: color }]} />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#C0282A",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingBottom: 16,
    overflow: "hidden",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  dayScroll: {
    backgroundColor: "#F5F4F2",
    flexGrow: 0,
  },
  dayChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  dayChipActive: {
    backgroundColor: "#C0282A",
    borderColor: "#C0282A",
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555550",
  },
  dayChipTextActive: {
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  slotBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  slotTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888882",
    width: 48,
  },
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  slotSubject: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  slotTeacher: {
    fontSize: 11,
    color: "#888882",
    marginTop: 2,
  },
  slotColorBar: {
    width: 4,
    height: "100%",
    minHeight: 40,
    borderRadius: 2,
    overflow: "hidden",
  },
  slotColorBarFill: {
    width: 4,
    flex: 1,
  },
});
