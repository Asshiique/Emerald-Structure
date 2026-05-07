import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryChip } from "@/components/CategoryChip";
import { NoticeCard } from "@/components/NoticeCard";
import { useData } from "@/context/DataContext";

const CATEGORIES = ["All", "Academic", "Events", "Fees", "Sports", "General"];

export default function NoticesPage() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;
  const [selected, setSelected] = useState("All");
  const { data, markNoticeRead } = useData();
  const notices = data.notices;

  const unreadCount = notices.filter((n) => !n.isRead).length;

  const filtered =
    selected === "All"
      ? notices
      : notices.filter((n) => {
          if (selected === "Fees") return n.category === "Fees" || n.category === "Urgent";
          return n.category === selected;
        });

  const handlePress = (id: string) => {
    markNoticeRead(id);
    router.push(`/notice/${id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Notices</Text>
            <Text style={styles.headerSub}>Stay updated with school news</Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount} new</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 0 }}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat}
            label={cat}
            isSelected={selected === cat}
            onPress={() => setSelected(cat)}
          />
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 90 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No notices</Text>
              <Text style={styles.emptySub}>Nothing in this category yet</Text>
            </View>
          ) : (
            filtered.map((notice, i) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onPress={() => handlePress(notice.id)}
                showBorder={i < filtered.length - 1}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", paddingHorizontal: 20, paddingBottom: 22, overflow: "hidden" },
  circle1: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.06)", top: -40, right: -30 },
  circle2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: -20 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  unreadBadge: { backgroundColor: "#FFFFFF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  unreadText: { fontSize: 12, fontWeight: "700", color: "#C0282A" },
  chipsContainer: { backgroundColor: "#F5F4F2", flexGrow: 0 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: "hidden" },
  emptyState: { padding: 32, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
  emptySub: { fontSize: 13, color: "#888882", marginTop: 4 },
});
