import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORIES = ["Urgent", "Academic", "Events", "Fees", "Sports", "General"] as const;

export default function PostNoticePage() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!title.trim() || !body.trim() || !category) {
      Alert.alert("Missing Fields", "Please fill in title, body, and select a category.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    Alert.alert("Notice Posted", "Your notice has been published to all students and parents.", [
      { text: "Post Another", onPress: () => { setTitle(""); setBody(""); setCategory(""); } },
      { text: "Done", onPress: () => router.back() },
    ]);
  };

  const CATEGORY_COLORS: Record<string, string> = {
    Urgent: "#C0282A", Academic: "#185FA5", Events: "#BA7517", Fees: "#7B3F9E", Sports: "#3B6D11", General: "#555550",
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Notice</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.catChip, category === c && { backgroundColor: CATEGORY_COLORS[c], borderColor: CATEGORY_COLORS[c] }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catChipText, category === c && { color: "#FFFFFF" }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Notice Title *</Text>
            <View style={styles.inputRow}>
              <Feather name="edit-3" size={15} color="#888882" style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter notice title"
                placeholderTextColor="#AAAAAA"
                autoCapitalize="sentences"
              />
            </View>

            <Text style={styles.label}>Notice Body *</Text>
            <TextInput
              style={styles.textArea}
              value={body}
              onChangeText={setBody}
              placeholder="Write the full notice content here..."
              placeholderTextColor="#AAAAAA"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoCapitalize="sentences"
            />

            <TouchableOpacity style={styles.btn} onPress={handlePost} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Feather name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.btnText}>Post Notice</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "rgba(0,0,0,0.12)", backgroundColor: "#F5F4F2" },
  catChipText: { fontSize: 13, fontWeight: "500", color: "#555550" },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F4F2", borderRadius: 10, height: 48, gap: 8 },
  input: { flex: 1, fontSize: 14, color: "#1A1A1A", paddingHorizontal: 8 },
  textArea: { backgroundColor: "#F5F4F2", borderRadius: 10, padding: 12, fontSize: 14, color: "#1A1A1A", minHeight: 140 },
  btn: { backgroundColor: "#C0282A", borderRadius: 12, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
