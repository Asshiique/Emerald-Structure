import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";

export default function StudentProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, removeStudent } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const student = data.students.find((s) => s.id === id);

  if (!student) return <View style={styles.center}><Text>Student not found</Text></View>;

  const handleDelete = () => Alert.alert("Delete Student", `Delete ${student.name}?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { await removeStudent(student.id); router.back(); } }]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Feather name="arrow-left" size={22} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Student Profile</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push(`/admin/students/${student.id}?edit=1`)}><Feather name="edit-2" size={18} color="#FFFFFF" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        <View style={styles.card}>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.meta}>{student.classSection} · Roll {student.rollNo}</Text>
          <Text style={styles.meta}>{student.admissionNo}</Text>
          <Text style={styles.meta}>Parent: {student.parentName}</Text>
          <Text style={styles.meta}>{student.parentPhone}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${student.parentPhone}`)}><Text style={styles.actionText}>Call Parent</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnAlt} onPress={handleDelete}><Text style={styles.actionTextAlt}>Delete</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: "700", color: "#1A1A1A", marginBottom: 6 },
  meta: { fontSize: 13, color: "#555550", marginBottom: 4 },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, backgroundColor: "#C0282A", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  actionBtnAlt: { flex: 1, backgroundColor: "#F8EBEB", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  actionText: { color: "#FFFFFF", fontWeight: "700" },
  actionTextAlt: { color: "#C0282A", fontWeight: "700" },
});