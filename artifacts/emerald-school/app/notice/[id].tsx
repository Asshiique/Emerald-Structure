import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";

const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  Urgent: { bg: "#F8EBEB", color: "#C0282A" },
  Fees: { bg: "#F8EBEB", color: "#C0282A" },
  Events: { bg: "#FFF8EC", color: "#8B6010" },
  Academic: { bg: "#EAF3DE", color: "#27500A" },
  Sports: { bg: "#E6F1FB", color: "#0C447C" },
  General: { bg: "#F1EFE8", color: "#444441" },
};

export default function NoticeDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { data, markNoticeRead } = useData();

  const notice = data.notices.find((n) => n.id === id);

  useEffect(() => {
    if (notice && !notice.isRead) {
      markNoticeRead(notice.id);
    }
  }, [notice?.id]);

  const catStyle = notice
    ? (CATEGORY_STYLES[notice.category] ?? CATEGORY_STYLES["General"]!)
    : CATEGORY_STYLES["General"]!;

  if (!notice) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Notice not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Notice</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 50 : insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={[styles.badge, { backgroundColor: catStyle.bg }]}>
            <Text style={[styles.badgeText, { color: catStyle.color }]}>{notice.category}</Text>
          </View>
          <Text style={styles.title}>{notice.title}</Text>
          <Text style={styles.time}>{notice.time}</Text>
          <View style={styles.divider} />
          <Text style={styles.body}>{notice.body}</Text>
          <View style={styles.divider} />
          <View style={styles.footerRow}>
            <Feather name="shield" size={14} color="#888882" />
            <Text style={styles.footerText}>Posted by Emerald International School</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 10 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "700", color: "#1A1A1A", lineHeight: 28, marginBottom: 6 },
  time: { fontSize: 12, color: "#888882" },
  divider: { height: 0.5, backgroundColor: "rgba(0,0,0,0.1)", marginVertical: 16 },
  body: { fontSize: 15, color: "#555550", lineHeight: 24 },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 12, color: "#888882" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, color: "#1A1A1A" },
  backLink: { fontSize: 14, color: "#C0282A", fontWeight: "600" },
});
