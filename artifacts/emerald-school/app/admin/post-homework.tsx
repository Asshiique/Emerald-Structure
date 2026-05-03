import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const SECTIONS = ["LKG", "UKG", "I-A", "I-B", "II-A", "II-B", "III-A", "III-B", "IV-A", "IV-B", "V-A", "V-B", "VI-A", "VI-B", "VII-A", "VII-B", "VIII-A", "VIII-B", "IX-A", "IX-B", "X-A", "X-B", "XI Science", "XI Commerce", "XII Science", "XII Commerce"];

function Select({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={ps.label}>{label}</Text>
      <TouchableOpacity style={ps.selectBtn} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <Text style={[ps.selectText, !value && { color: "#AAAAAA" }]}>{value || `Select ${label}`}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color="#888882" />
      </TouchableOpacity>
      {open && (
        <View style={ps.dropdown}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
            {options.map((o) => (
              <TouchableOpacity key={o} style={[ps.dropItem, value === o && ps.dropItemActive]} onPress={() => { onChange(o); setOpen(false); }}>
                <Text style={[ps.dropText, value === o && ps.dropTextActive]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function AdminPostHomeworkPage() {
  const { user } = useAuth();
  const { data, addHomework } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [loading, setLoading] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [subject, setSubject] = useState("");
  const [classSection, setClassSection] = useState("");
  const [dueDate, setDueDate] = useState(tomorrow.toISOString().split("T")[0]);

  const subjects = Array.from(new Set(data.staff.filter((s) => s.department && s.department !== "Office" && s.department !== "Administration").map((s) => s.department)));

  const handlePost = async () => {
    if (!title.trim() || !desc.trim() || !subject || !classSection) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      await addHomework({
        teacherId: "admin_001",
        teacherName: user?.name ?? "Admin",
        subject, classSection,
        title: title.trim(),
        description: desc.trim(),
        dueDate,
      });
      Alert.alert("Posted!", `Homework posted for Class ${classSection}.`, [
        { text: "Post Another", onPress: () => { setTitle(""); setDesc(""); setSubject(""); setClassSection(""); } },
        { text: "Done", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        <View style={[ps.header, { paddingTop: isWeb ? 67 : insets.top }]}>
          <TouchableOpacity style={ps.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={ps.headerTitle}>Post Homework</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={ps.card}>
            <Select label="Class Section *" options={SECTIONS} value={classSection} onChange={setClassSection} />
            <Select label="Subject *" options={subjects} value={subject} onChange={setSubject} />

            <Text style={ps.label}>Assignment Title *</Text>
            <View style={ps.inputRow}>
              <Feather name="edit-2" size={15} color="#888882" style={{ marginLeft: 12 }} />
              <TextInput style={ps.input} value={title} onChangeText={setTitle} placeholder="e.g. Chapter 5 Exercise" placeholderTextColor="#AAAAAA" autoCapitalize="sentences" />
            </View>

            <Text style={ps.label}>Description *</Text>
            <TextInput style={ps.textArea} value={desc} onChangeText={setDesc} placeholder="Describe the assignment..." placeholderTextColor="#AAAAAA" multiline numberOfLines={4} textAlignVertical="top" />

            <Text style={ps.label}>Due Date</Text>
            <View style={ps.inputRow}>
              <Feather name="calendar" size={15} color="#888882" style={{ marginLeft: 12 }} />
              <TextInput style={ps.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor="#AAAAAA" keyboardType="numeric" />
            </View>

            <TouchableOpacity style={ps.btn} onPress={handlePost} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                <><Feather name="send" size={16} color="#FFFFFF" /><Text style={ps.btnText}>Post Homework</Text></>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const ps = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F4F2", borderRadius: 10, height: 48, gap: 8 },
  input: { flex: 1, fontSize: 14, color: "#1A1A1A", paddingHorizontal: 8 },
  textArea: { backgroundColor: "#F5F4F2", borderRadius: 10, padding: 12, fontSize: 14, color: "#1A1A1A", minHeight: 100 },
  selectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F5F4F2", borderRadius: 10, height: 48, paddingHorizontal: 14 },
  selectText: { fontSize: 14, color: "#1A1A1A" },
  dropdown: { backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", marginTop: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  dropItem: { padding: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.06)" },
  dropItemActive: { backgroundColor: "#F8EBEB" },
  dropText: { fontSize: 14, color: "#1A1A1A" },
  dropTextActive: { color: "#C0282A", fontWeight: "600" },
  btn: { backgroundColor: "#C0282A", borderRadius: 12, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
