import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { pickImageWithChoice } from "@/hooks/useImagePicker";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function AppSettingsPage() {
  useRoleGuard(["admin"]);
  const { data, updateSettings } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [form, setForm] = useState(data.settings);
  const [saving, setSaving] = useState(false);
  const [logoPickerLoading, setLogoPickerLoading] = useState(false);

  useEffect(() => { setForm(data.settings); }, [data.settings]);

  const update = (key: keyof typeof form, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handlePickLogo = async () => {
    setLogoPickerLoading(true);
    try {
      const uri = await pickImageWithChoice();
      if (uri) { await updateSettings({ schoolLogo: uri }); setForm((prev) => ({ ...prev, schoolLogo: uri })); }
    } finally {
      setLogoPickerLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.schoolName.trim()) { Alert.alert("Required", "School name is required."); return; }
    setSaving(true);
    await updateSettings(form);
    setSaving(false);
    Alert.alert("Saved", "School settings updated successfully.");
  };

  const FIELDS: { key: keyof typeof form; label: string; icon: string; keyboard?: any; multi?: boolean }[] = [
    { key: "schoolName", label: "School Name", icon: "home" },
    { key: "address", label: "School Address", icon: "map-pin", multi: true },
    { key: "phone", label: "School Phone", icon: "phone", keyboard: "phone-pad" },
    { key: "email", label: "School Email", icon: "mail", keyboard: "email-address" },
    { key: "principalName", label: "Principal Name", icon: "user" },
    { key: "academicYear", label: "Academic Year", icon: "calendar" },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>App Settings</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>SCHOOL LOGO</Text>
            <View style={styles.logoRow}>
              {form.schoolLogo ? (
                <Image source={{ uri: form.schoolLogo }} style={styles.logoPreview} resizeMode="cover" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Feather name="shield" size={32} color="#C0282A" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.logoTitle}>School Logo</Text>
                <Text style={styles.logoSub}>Shown on login screen and ID card</Text>
                <TouchableOpacity style={styles.logoBtn} onPress={handlePickLogo} disabled={logoPickerLoading} activeOpacity={0.8}>
                  {logoPickerLoading ? <ActivityIndicator size="small" color="#C0282A" /> : (
                    <><Feather name="upload" size={13} color="#C0282A" /><Text style={styles.logoBtnText}>{form.schoolLogo ? "Change Logo" : "Upload Logo"}</Text></>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>SCHOOL INFORMATION</Text>
            {FIELDS.map((f) => (
              <View key={f.key} style={{ marginBottom: 16 }}>
                <Text style={styles.label}>{f.label}</Text>
                <View style={[styles.inputRow, f.multi && { height: "auto", alignItems: "flex-start", paddingVertical: 10 }]}>
                  <Feather name={f.icon as any} size={16} color="#888882" style={{ marginLeft: 12, marginTop: f.multi ? 2 : 0 }} />
                  <TextInput
                    style={[styles.input, f.multi && { height: 60, textAlignVertical: "top" }]}
                    value={(form as any)[f.key] ?? ""}
                    onChangeText={(v) => update(f.key, v)}
                    keyboardType={f.keyboard}
                    autoCapitalize={f.keyboard === "email-address" ? "none" : "words"}
                    multiline={f.multi}
                    numberOfLines={f.multi ? 3 : 1}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : (
                <><Feather name="save" size={16} color="#FFFFFF" /><Text style={styles.btnText}>Save Settings</Text></>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Feather name="info" size={14} color="#8B6010" />
            <Text style={styles.infoText}>Changes will reflect across the entire app wherever school information is displayed.</Text>
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
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#888882", letterSpacing: 0.8, marginBottom: 14 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  logoPreview: { width: 72, height: 72, borderRadius: 14, backgroundColor: "#F5F4F2" },
  logoPlaceholder: { width: 72, height: 72, borderRadius: 14, backgroundColor: "#F8EBEB", alignItems: "center", justifyContent: "center" },
  logoTitle: { fontSize: 14, fontWeight: "600", color: "#1A1A1A", marginBottom: 4 },
  logoSub: { fontSize: 12, color: "#888882", marginBottom: 10, lineHeight: 16 },
  logoBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderWidth: 1.5, borderColor: "#C0282A", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoBtnText: { fontSize: 13, fontWeight: "600", color: "#C0282A" },
  label: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.5, marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F4F2", borderRadius: 10, height: 48, gap: 8 },
  input: { flex: 1, fontSize: 14, color: "#1A1A1A", paddingHorizontal: 8, paddingVertical: 0 },
  btn: { backgroundColor: "#C0282A", borderRadius: 12, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FFF8EC", borderRadius: 12, padding: 14 },
  infoText: { flex: 1, fontSize: 12, color: "#8B6010", lineHeight: 18 },
});
