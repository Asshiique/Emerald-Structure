import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Notice } from "@/data/mockData";

const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  Urgent: { bg: "#F8EBEB", color: "#C0282A" },
  Fees: { bg: "#F8EBEB", color: "#C0282A" },
  Events: { bg: "#FFF8EC", color: "#8B6010" },
  Academic: { bg: "#EAF3DE", color: "#27500A" },
  Sports: { bg: "#E6F1FB", color: "#0C447C" },
  General: { bg: "#F1EFE8", color: "#444441" },
};

interface NoticeCardProps {
  notice: Notice;
  onPress: () => void;
  showBorder?: boolean;
}

export function NoticeCard({ notice, onPress, showBorder = true }: NoticeCardProps) {
  const catStyle = CATEGORY_STYLES[notice.category] ?? CATEGORY_STYLES["General"]!;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, showBorder && styles.border]}
      activeOpacity={0.7}
    >
      <View style={[styles.dot, notice.isRead ? styles.dotRead : styles.dotUnread]} />
      <View style={{ flex: 1 }}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: catStyle.bg }]}>
            <Text style={[styles.badgeText, { color: catStyle.color }]}>{notice.category}</Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={1}>{notice.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{notice.body}</Text>
        <Text style={styles.time}>{notice.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  border: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 18,
    flexShrink: 0,
  },
  dotUnread: { backgroundColor: "#C0282A" },
  dotRead: { backgroundColor: "rgba(0,0,0,0.15)" },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: "#555550",
    lineHeight: 18,
  },
  time: {
    fontSize: 10,
    color: "#888882",
    marginTop: 5,
  },
});
