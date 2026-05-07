import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import { StaffMember, useData } from "@/context/DataContext";
import { useRoleGuard } from "@/hooks/useRoleGuard";

const FILTERS = ["All", "Teachers", "Office Staff", "Supporting Staff"];
function filterMatch(s: StaffMember, filter: string) {
  if (filter === "All") return true;
  if (filter === "Teachers") return s.role === "Class Teacher" || s.role === "Subject Teacher" || s.role === "Principal" || s.role === "Vice Principal";
  if (filter === "Office Staff") return s.role === "Office Staff";
  if (filter === "Supporting Staff") return s.role === "Supporting Staff";
  return true;
}

export default function ManageStaffPage() {
  useRoleGuard(["admin"]);
  const { data, removeStaff } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const activeStaff = data.staff.filter((s) => s.isActive);
  const filtered = activeStaff.filter((s) =>
    filterMatch(s, filter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.department.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRemove = (s: StaffMember) =>
    Alert.alert("Deactivate Staff", `Deactivate ${s.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Deactivate", style: "destructive", onPress: async () => {
        try { await removeStaff(s.id); }
        catch (e: any) { Alert.alert("Cannot Remove", e.message ?? "This account is protected."); }
      }},
    ]);

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
          <TextInput style={styles.searchInput} placeholder="Search by name, subject..." placeholderTextColor="#AAAAAA" value={search} onChangeText={setSearch} />
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipActive]}>
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
            <TouchableOpacity key={s.id} style={styles.card} onPress={() => router.push(`/admin/staff/${s.id}` as any)} activeOpacity={0.75}>
              <PhotoAvatar photo={s.profilePhoto} name={s.name} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.role}>{s.role} · {s.department}</Text>
                {s.classSection ? <Text style={styles.classSec}>Class {s.classSection}</Text> : null}
                <Text style={styles.phone}>{s.phone}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={(e) => { e.stopPropagation(); Linking.openURL(`tel:${s.phone}`); }}>
                  <Feather name="phone" size={14} color="#3B6D11" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#F8EBEB" }]} onPress={(e) => { e.stopPropagation(); handleRemove(s); }}>
                  <Feather name="user-x" size={14} color="#C0282A" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  countText: { fontSize: 12, color: "#888882", paddingHorizontal: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  chipActive: { backgroundColor: "#C0282A", borderColor: "#C0282A" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#555550" },
  chipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: 14, fontWeight: "700", color: "#1A1A1A", marginBottom: 2 },
  role: { fontSize: 12, color: "#555550", marginBottom: 1 },
  classSec: { fontSize: 11, color: "#C0282A", fontWeight: "600", marginBottom: 1 },
  phone: { fontSize: 11, color: "#888882" },
  cardActions: { flexDirection: "column", gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#EAF3DE", alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
});
