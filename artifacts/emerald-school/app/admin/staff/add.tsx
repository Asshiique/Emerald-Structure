import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import { useData } from "@/context/DataContext";
import { pickImageWithChoice } from "@/hooks/useImagePicker";

const ROLES = ["Class Teacher", "Subject Teacher", "Office Staff", "Supporting Staff", "Principal", "Vice Principal"] as const;
const SECTIONS = ["LKG", "UKG", "I-A", "I-B", "II-A", "II-B", "III-A", "III-B", "IV-A", "IV-B", "V-A", "V-B", "VI-A", "VI-B", "VII-A", "VII-B", "VIII-A", "VIII-B", "IX-A", "IX-B", "X-A", "X-B", "XI Science", "XI Commerce", "XII Science", "XII Commerce"];

function SelectRow({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={sStyles.label}>{label}</Text>
      <TouchableOpacity style={sStyles.selectBtn} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <Text style={[sStyles.selectText, !value && { color: "#AAAAAA" }]}>{value || `Select ${label}`}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color="#888882" />
      </TouchableOpacity>
      {open && (
        <View style={sStyles.dropdown}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
            {options.map((o) => (
              <TouchableOpacity key={o} style={[sStyles.dropItem, value === o && sStyles.dropItemActive]} onPress={() => { onChange(o); setOpen(false); }}>
                <Text style={[sStyles.dropText, value === o && sStyles.dropTextActive]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function Field({ label, icon, value, onChange, keyboard, multi }: { label: string; icon: string; value: string; onChange: (v: string) => void; keyboard?: any; multi?: boolean }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={sStyles.label}>{label}</Text>
      <View style={[sStyles.inputRow, multi && { height: "auto", alignItems: "flex-start", paddingVertical: 10 }]}>
        <Feather name={icon as any} size={15} color="#888882" style={{ marginLeft: 12, marginTop: multi ? 2 : 0 }} />
        <TextInput
          style={[sStyles.input, multi && { height: 70, textAlignVertical: "top" }]}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard}
          autoCapitalize={keyboard === "email-address" ? "none" : "words"}
          multiline={multi}
          numberOfLines={multi ? 3 : 1}
          placeholderTextColor="#AAAAAA"
          placeholder={label}
        />
      </View>
    </View>
  );
}

export default function AddStaffPage() {
  const { addStaff } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "", department: "", classSection: "", joinDate: new Date().toISOString().split("T")[0], employeeId: "" });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const needsSection = form.role === "Class Teacher" || form.role === "Subject Teacher";

  const handlePickPhoto = async () => {
    const uri = await pickImageWithChoice();
    if (uri) setProfilePhoto(uri);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.email || !form.role || !form.department || !form.employeeId) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const member = await addStaff({
        name: form.name.trim(), phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(), role: form.role as any,
        department: form.department.trim(), classSection: form.classSection,
        joinDate: form.joinDate, employeeId: form.employeeId.trim(),
        profilePhoto,
      });
      Alert.alert(
        "Staff Member Added",
        `${member.name} has been added.\n\nLogin credentials:\nEmail: ${member.email}\nPassword: Emerald@123`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Error", "Failed to add staff. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        <View style={[sStyles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
          <TouchableOpacity style={sStyles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={sStyles.headerTitle}>Add Staff Member</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={sStyles.card}>
            <View style={sStyles.photoSection}>
              <PhotoAvatar photo={profilePhoto} name={form.name || "?"} size={90} onPress={handlePickPhoto} showCamera borderColor="#C0282A" />
              <Text style={sStyles.photoHint}>Tap to add profile photo</Text>
            </View>

            <Field label="Full Name *" icon="user" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Phone Number *" icon="phone" value={form.phone} onChange={(v) => set("phone", v)} keyboard="phone-pad" />
            <Field label="Email Address *" icon="mail" value={form.email} onChange={(v) => set("email", v)} keyboard="email-address" />
            <Field label="Employee ID *" icon="hash" value={form.employeeId} onChange={(v) => set("employeeId", v)} />
            <SelectRow label="Role *" options={ROLES} value={form.role} onChange={(v) => set("role", v)} />
            <Field label="Department / Subject *" icon="book-open" value={form.department} onChange={(v) => set("department", v)} />
            {needsSection && (
              <SelectRow label="Class Section Assigned" options={SECTIONS} value={form.classSection} onChange={(v) => set("classSection", v)} />
            )}
            <Field label="Date of Joining" icon="calendar" value={form.joinDate} onChange={(v) => set("joinDate", v)} />

            <View style={sStyles.infoBox}>
              <Feather name="info" size={14} color="#1A5FA5" />
              <Text style={sStyles.infoText}>Default login password: <Text style={{ fontWeight: "700" }}>Emerald@123</Text></Text>
            </View>

            <TouchableOpacity style={sStyles.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                <><Feather name="user-plus" size={16} color="#FFFFFF" /><Text style={sStyles.btnText}>Add Staff Member</Text></>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const sStyles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  photoSection: { alignItems: "center", paddingVertical: 16, gap: 8 },
  photoHint: { fontSize: 12, color: "#888882" },
  label: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.5, marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F4F2", borderRadius: 10, height: 48, gap: 8 },
  input: { flex: 1, fontSize: 14, color: "#1A1A1A", paddingHorizontal: 8 },
  selectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F5F4F2", borderRadius: 10, height: 48, paddingHorizontal: 14 },
  selectText: { fontSize: 14, color: "#1A1A1A" },
  dropdown: { backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", marginTop: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  dropItem: { padding: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.06)" },
  dropItemActive: { backgroundColor: "#F8EBEB" },
  dropText: { fontSize: 14, color: "#1A1A1A" },
  dropTextActive: { color: "#C0282A", fontWeight: "600" },
  infoBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#E8F1FB", borderRadius: 10, padding: 12, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 12, color: "#1A5FA5" },
  btn: { backgroundColor: "#C0282A", borderRadius: 12, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
