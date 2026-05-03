import { Feather } from "@expo/vector-icons";
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
import { CategoryChip } from "@/components/CategoryChip";
import { HOMEWORK, Homework } from "@/data/mockData";

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#C0282A",
  Physics: "#185FA5",
  English: "#3B6D11",
  Chemistry: "#BA7517",
  Biology: "#7B3F9E",
  "Computer Science": "#1A7A6E",
};

function dueBadge(dueLabel: string) {
  if (dueLabel === "Overdue") return { bg: "#F8EBEB", color: "#C0282A" };
  if (dueLabel === "Today" || dueLabel === "Tomorrow") return { bg: "#FFF8EC", color: "#BA7517" };
  return { bg: "#EAF3DE", color: "#27500A" };
}

interface HomeworkCardProps {
  item: Homework;
  onMarkDone: (id: string) => void;
}

function HomeworkCard({ item, onMarkDone }: HomeworkCardProps) {
  const subjectColor = SUBJECT_COLORS[item.subject] ?? "#888882";
  const badge = dueBadge(item.dueLabel);
  const isSubmitted = item.status === "submitted";

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.subjectBar, { backgroundColor: subjectColor }]} />
        <Text style={[styles.subjectName, { color: subjectColor }]}>{item.subject}</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.dueBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.dueText, { color: badge.color }]}>{item.dueLabel}</Text>
        </View>
      </View>
      <Text style={styles.assignmentTitle}>{item.title}</Text>
      <Text style={styles.assignmentDesc} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.teacherName}>{item.teacher}</Text>
      <View style={styles.cardBottom}>
        <View
          style={[
            styles.statusChip,
            { backgroundColor: isSubmitted ? "#EAF3DE" : "#F8EBEB" },
          ]}
        >
          <Feather
            name={isSubmitted ? "check-circle" : "clock"}
            size={11}
            color={isSubmitted ? "#27500A" : "#C0282A"}
          />
          <Text
            style={[
              styles.statusText,
              { color: isSubmitted ? "#27500A" : "#C0282A" },
            ]}
          >
            {isSubmitted ? "Submitted" : "Pending"}
          </Text>
        </View>
        {!isSubmitted && (
          <TouchableOpacity
            style={styles.markDoneBtn}
            onPress={() => onMarkDone(item.id)}
            activeOpacity={0.7}
          >
            <Feather name="check" size={12} color="#C0282A" />
            <Text style={styles.markDoneText}>Mark as Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const FILTERS = ["All", "Pending", "Submitted"];

export default function HomeworkPage() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const [filter, setFilter] = useState("All");
  const [homework, setHomework] = useState<Homework[]>(HOMEWORK);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const filtered = homework.filter((h) => {
    if (filter === "Pending") return h.status === "pending";
    if (filter === "Submitted") return h.status === "submitted";
    return true;
  });

  const pendingCount = homework.filter((h) => h.status === "pending").length;

  const markDone = (id: string) => {
    setHomework((prev) =>
      prev.map((h) => (h.id === id ? { ...h, status: "submitted" as const } : h))
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Homework</Text>
            <Text style={styles.headerSub}>{dateLabel}</Text>
          </View>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>{pendingCount} pending</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {FILTERS.map((f) => (
          <CategoryChip
            key={f}
            label={f}
            isSelected={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="book" size={40} color="#C0282A" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No assignments in this category</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <HomeworkCard key={item.id} item={item} onMarkDone={markDone} />
          ))
        )}
      </ScrollView>
    </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
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
  pendingBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C0282A",
  },
  chipScroll: {
    flexGrow: 0,
    backgroundColor: "#F5F4F2",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  subjectBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: "600",
  },
  dueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dueText: {
    fontSize: 11,
    fontWeight: "600",
  },
  assignmentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 5,
  },
  assignmentDesc: {
    fontSize: 12,
    color: "#555550",
    lineHeight: 18,
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 11,
    color: "#888882",
    marginBottom: 10,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  markDoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C0282A",
    gap: 4,
  },
  markDoneText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#C0282A",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#888882",
  },
});
