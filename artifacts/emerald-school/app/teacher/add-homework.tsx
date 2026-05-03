import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

export default function AddHomeworkPage() {
  const { user } = useAuth();
  const { data, addHomework } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [loading, setLoading] = useState(false);

  const staffRecord = data.staff.find((s) => s.email.toLowerCase() === user?.email?.toLowerCase());
  const subject = staffRecord?.department ?? "";
  const classSection = staffRecord?.classSection ?? "";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(tomorrowStr);

  const handlePost = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing Fields", "Please add a title and description for the homework.");
      return;
    }
    if (!staffRecord) {
      Alert.alert("Error", "Teacher profile not found.");
      return;
    }
    setLoading(true);
    try {
      await addHomework({
        teacherId: staffRecord.id,
        teacherName: staffRecord.name,
        subject,
        classSection,
        title: title.trim(),
        description: description.trim(),
        dueDate,
      });
      Alert.alert("Posted!", `Homework posted for Class ${classSection}.`, [
        { text: "Post Another", onPress: () => { setTitle(""); setDescription(""); setDueDate(tomorrowStr); } },
        { text: "Go Back", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to post homework. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Homework</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.infoBanner}>
            <View style={styles.infoBannerItem}>
              <Feather name="book" size={14} color="#C0282A" />
              <Text style={styles.infoBannerText}>{subject || "Subject"}</Text>
            </View>
            <View style={styles.infoBannerDivider} />
            <View style={styles.infoBannerItem}>
              <Feather name="users" size={14} color="#C0282A" />
              <Text style={styles.infoBannerText}>Class {classSection || "—"}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Assignment Title *</Text>
            <View style={styles.inputRow}>
              <Feather name="edit-2" size={15} color="#888882" style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Chapter 5 Exercise 3"
                placeholderTextColor="#AAAAAA"
                autoCapitalize="sentences"
              />
            </View>

            <Text style={styles.label}>Description / Instructions *</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what students need to do..."
              placeholderTextColor="#AAAAAA"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoCapitalize="sentences"
            />

            <Text style={styles.label}>Due Date</Text>
            <View style={styles.inputRow}>
              <Feather name="calendar" size={15} color="#888882" style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#AAAAAA"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.btn} onPress={handlePost} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Feather name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.btnText}>Post Homework</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {data.homework.filter((h) => h.teacherId === staffRecord?.id).length > 0 && (
            <>
              <Text style={styles.sectionLabel}>RECENTLY POSTED</Text>
              {data.homework.filter((h) => h.teacherId === staffRecord?.id).slice(0, 3).map((hw) => (
                <View key={hw.id} style={styles.recentCard}>
                  <View style={styles.recentDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentTitle}>{hw.title}</Text>
                    <Text style={styles.recentMeta}>Due: {hw.dueDate} · {hw.classSection}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  infoBanner: { flexDirection: "row", backgroundColor: "#F8EBEB", borderRadius: 12, padding: 12, marginBottom: 14, alignItems: "center", justifyContent: "center" },
  infoBannerItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  infoBannerDivider: { width: 0.5, height: 20, backgroundColor: "rgba(192,40,42,0.2)", marginHorizontal: 8 },
  infoBannerText: { fontSize: 13, fontWeight: "700", color: "#C0282A" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 14 },
  label: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F4F2", borderRadius: 10, height: 48, gap: 8 },
  input: { flex: 1, fontSize: 14, color: "#1A1A1A", paddingHorizontal: 8 },
  textArea: { backgroundColor: "#F5F4F2", borderRadius: 10, padding: 12, fontSize: 14, color: "#1A1A1A", minHeight: 100 },
  btn: { backgroundColor: "#C0282A", borderRadius: 12, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, marginBottom: 8 },
  recentCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  recentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C0282A" },
  recentTitle: { fontSize: 13, fontWeight: "600", color: "#1A1A1A", marginBottom: 2 },
  recentMeta: { fontSize: 11, color: "#888882" },
});
