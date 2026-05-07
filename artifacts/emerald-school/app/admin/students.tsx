import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function AdminStudentsPage() {
  useRoleGuard(["admin"]);
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("All");

  const availableSections = ["All", ...Array.from(new Set(data.students.map((s) => s.classSection))).sort()];

  const filtered = data.students.filter((s) => {
    const matchSection = section === "All" || s.classSection === section;
    const matchSearch =
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.parentName.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.includes(search);
    return matchSection && matchSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>All Students</Text>
          <Text style={styles.headerSub}>{data.students.length} total</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="#888882" style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student, parent, admission no..."
            placeholderTextColor="#AAAAAA"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} style={{ paddingHorizontal: 10 }}>
              <Feather name="x" size={14} color="#888882" />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>
          {availableSections.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSection(s)}
              style={[styles.chip, section === s && styles.chipActive]}
            >
              <Text style={[styles.chipText, section === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="users" size={36} color="#C0282A" />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        ) : (
          filtered.map((s) => (
            <TouchableOpacity key={s.id} style={styles.card} onPress={() => router.push(`/admin/students/${s.id}` as any)} activeOpacity={0.75}>
              <View style={styles.rollBadge}>
                <Text style={styles.rollNum}>{s.rollNo}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.name}>{s.name}</Text>
                  <View style={styles.sectionTag}>
                    <Text style={styles.sectionTagText}>{s.classSection}</Text>
                  </View>
                </View>
                <Text style={styles.parentName}>{s.parentName}</Text>
                <Text style={styles.admNo}>{s.admissionNo} · {s.bloodGroup}</Text>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={(e) => { e.stopPropagation(); Linking.openURL(`tel:${s.parentPhone}`); }}>
                <Feather name="phone" size={16} color="#3B6D11" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16, gap: 4 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, height: 44, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A", paddingHorizontal: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  chipActive: { backgroundColor: "#C0282A", borderColor: "#C0282A" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#555550" },
  chipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  rollBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F8EBEB", alignItems: "center", justifyContent: "center" },
  rollNum: { fontSize: 13, fontWeight: "700", color: "#C0282A" },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  name: { fontSize: 14, fontWeight: "700", color: "#1A1A1A", flex: 1 },
  sectionTag: { backgroundColor: "#F8EBEB", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  sectionTagText: { fontSize: 10, fontWeight: "600", color: "#C0282A" },
  parentName: { fontSize: 12, color: "#555550", marginBottom: 2 },
  admNo: { fontSize: 11, color: "#888882" },
  callBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#EAF3DE", alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
});
