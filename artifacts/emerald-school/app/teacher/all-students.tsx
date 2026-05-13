import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import { useData } from "@/context/DataContext";

export default function AllStudentsPage() {
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [search, setSearch] = useState("");

  const students = data.students
    .filter((s) => search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search) || s.parentName.toLowerCase().includes(search.toLowerCase()) || s.classSection.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.classSection.localeCompare(b.classSection) || parseInt(a.rollNo) - parseInt(b.rollNo));

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>All School Students</Text>
          <Text style={styles.headerSub}>Directory • {students.length} students</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="#888882" style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, class, parent..."
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
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {students.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="users" size={36} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No students found</Text>
          </View>
        ) : (
          students.map((s) => (
            <View key={s.id} style={styles.card}>
              <PhotoAvatar photo={s.profilePhoto} name={s.name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{s.name}</Text>
                <Text style={styles.parentName}>{s.parentName}</Text>
                <Text style={styles.admNo}>Class {s.classSection} · Roll {s.rollNo}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${s.parentPhone}`)}>
                  <Feather name="phone" size={16} color="#3B6D11" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.waBtn} onPress={() => Linking.openURL(`https://wa.me/${s.parentWhatsApp?.replace(/\D/g, "")}`)}>
                  <Feather name="message-circle" size={16} color="#1A7A6E" />
                </TouchableOpacity>
              </View>
            </View>
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
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, height: 44, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A", paddingHorizontal: 8 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  studentName: { fontSize: 14, fontWeight: "700", color: "#1A1A1A", marginBottom: 2 },
  parentName: { fontSize: 12, color: "#555550" },
  admNo: { fontSize: 11, color: "#C0282A", fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8 },
  callBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#EAF3DE", alignItems: "center", justifyContent: "center" },
  waBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#E6F4F2", alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 14, color: "#888882" },
});
