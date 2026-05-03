import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StaffMember, useData } from "@/context/DataContext";

const FILTERS = ["All", "Teachers", "Office Staff", "Supporting Staff"];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function filterMatch(s: StaffMember, filter: string) {
  if (filter === "All") return true;
  if (filter === "Teachers") return s.role === "Class Teacher" || s.role === "Subject Teacher" || s.role === "Principal" || s.role === "Vice Principal";
  if (filter === "Office Staff") return s.role === "Office Staff";
  if (filter === "Supporting Staff") return s.role === "Supporting Staff";
  return true;
}

export default function ManageStaffPage() {
  const { data, removeStaff } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const activeStaff = data.staff.filter((s) => s.isActive);
  const filtered = activeStaff.filter(
    (s) =>
      filterMatch(s, filter) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRemove = (s: StaffMember) => {
    Alert.alert("Remove Staff Member", `Are you sure you want to deactivate ${s.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: () => removeStaff(s.id),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Staff</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/admin/staff/add")}>
          <Feather name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="#888882" style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, subject..."
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
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="users" size={36} color="#C0282A" />
            <Text style={styles.emptyText}>No staff found</Text>
          </View>
        ) : (
          filtered.map((s) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(s.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{s.name}</Text>
                  <Text style={styles.role}>{s.role} · {s.department}</Text>
                  {s.classSection ? <Text style={styles.classSec}>Class {s.classSection}</Text> : null}
                  <Text style={styles.phone}>{s.phone}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${s.phone}`)}>
                  <Feather name="phone" size={14} color="#3B6D11" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#F8EBEB" }]} onPress={() => handleRemove(s)}>
                  <Feather name="trash-2" size={14} color="#C0282A" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => router.push("/admin/staff/add")}
        activeOpacity={0.8}
      >
        <Feather name="user-plus" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Staff</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  addBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, height: 44, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A", paddingHorizontal: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  chipActive: { backgroundColor: "#C0282A", borderColor: "#C0282A" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#555550" },
  chipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, flexDirection: "row", alignItems: "center", gap: 12 },
  cardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F8EBEB", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "700", color: "#C0282A" },
  name: { fontSize: 14, fontWeight: "700", color: "#1A1A1A", marginBottom: 2 },
  role: { fontSize: 12, color: "#555550", marginBottom: 1 },
  classSec: { fontSize: 11, color: "#C0282A", fontWeight: "600", marginBottom: 1 },
  phone: { fontSize: 11, color: "#888882" },
  cardActions: { flexDirection: "column", gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#EAF3DE", alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
  fab: { position: "absolute", right: 20, backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 30, gap: 8, shadowColor: "#C0282A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
