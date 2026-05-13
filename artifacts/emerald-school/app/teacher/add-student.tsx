import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { pickImageWithChoice } from "@/hooks/useImagePicker";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["Male", "Female"] as const;

function Select({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={ss.label}>{label}</Text>
      <TouchableOpacity style={ss.selectBtn} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <Text style={[ss.selectText, !value && { color: "#AAAAAA" }]}>{value || `Select ${label}`}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color="#888882" />
      </TouchableOpacity>
      {open && (
        <View style={ss.dropdown}>
          {options.map((o) => (
            <TouchableOpacity key={o} style={[ss.dropItem, value === o && ss.dropItemActive]} onPress={() => { onChange(o); setOpen(false); }}>
              <Text style={[ss.dropText, value === o && ss.dropTextActive]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function Field({ label, icon, value, onChange, keyboard, multi, placeholder, secure, toggle, onToggle }: {
  label: string; icon?: string; value: string; onChange: (v: string) => void;
  keyboard?: any; multi?: boolean; placeholder?: string;
  secure?: boolean; toggle?: boolean; onToggle?: () => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={ss.label}>{label}</Text>
      <View style={[ss.inputRow, multi && { height: "auto", alignItems: "flex-start", paddingVertical: 10 }]}>
        {icon && <Feather name={icon as any} size={15} color="#888882" style={{ marginLeft: 12, marginTop: multi ? 2 : 0 }} />}
        <TextInput
          style={[ss.input, !icon && { paddingLeft: 12 }, multi && { height: 70, textAlignVertical: "top" }]}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard}
          autoCapitalize={keyboard === "email-address" ? "none" : "words"}
          multiline={multi}
          numberOfLines={multi ? 3 : 1}
          placeholderTextColor="#AAAAAA"
          placeholder={placeholder ?? label}
          secureTextEntry={secure}
        />
        {toggle && (
          <TouchableOpacity onPress={onToggle} style={{ paddingHorizontal: 12 }}>
            <Feather name={secure ? "eye" : "eye-off"} size={16} color="#888882" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function AddStudentPage() {
  const { user } = useAuth();
  const { data, addStudent } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [showPass, setShowPass] = useState(false);

  const staffRecord = data.staff.find((s) => s.email.toLowerCase() === user?.email?.toLowerCase());
  const classSection = staffRecord?.classSection ?? user?.classSection ?? "X-B";

  const [form, setForm] = useState({
    name: "", dob: "", gender: "" as "Male" | "Female" | "", bloodGroup: "",
    rollNo: "", admissionNo: "",
    parentName: "", parentPhone: "", parentEmail: "", parentWhatsApp: "", address: "", prevSchool: "",
    parentPassword: "", confirmPassword: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handlePickPhoto = async () => {
    const uri = await pickImageWithChoice();
    if (uri) setProfilePhoto(uri);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.gender || !form.rollNo || !form.admissionNo || !form.parentName || !form.parentPhone || !form.parentEmail) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    if (form.parentPassword && form.parentPassword.length < 8) {
      Alert.alert("Weak Password", "Parent password must be at least 8 characters.");
      return;
    }
    if (form.parentPassword && form.parentPassword !== form.confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const student = await addStudent(
        {
          name: form.name.trim(), dob: form.dob, gender: form.gender as "Male" | "Female",
          bloodGroup: form.bloodGroup, classSection, rollNo: form.rollNo.trim(),
          admissionNo: form.admissionNo.trim(), parentName: form.parentName.trim(),
          parentPhone: form.parentPhone.trim(), parentEmail: form.parentEmail.trim().toLowerCase(),
          parentWhatsApp: form.parentWhatsApp.trim() || form.parentPhone.trim(),
          address: form.address.trim(), prevSchool: form.prevSchool.trim(),
          ...(profilePhoto ? { profilePhoto } : {}),
        },
        form.parentPassword || undefined
      );
      const msg = form.parentPassword
        ? `${student.name} added to Class ${classSection}.\n\nParent account created:\nEmail: ${student.parentEmail}\nPassword: (as set)\n\nParent can now log in from any device.`
        : `${student.name} has been added to Class ${classSection}.`;
      Alert.alert("Student Added", msg, [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: any) {
      const msg = e?.code === "auth/email-already-in-use"
        ? "That parent email already has an account. Use a different email."
        : "Failed to add student. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        <View style={[ss.header, { paddingTop: isWeb ? 67 : insets.top }]}>
          <TouchableOpacity style={ss.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={ss.headerTitle}>Add Student</Text>
            <Text style={ss.headerSub}>Class {classSection}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={ss.card}>
            <View style={ss.photoSection}>
              <PhotoAvatar photo={profilePhoto} name={form.name || "?"} size={90} onPress={handlePickPhoto} showCamera borderColor="#C0282A" />
              <Text style={ss.photoHint}>Tap to add student photo</Text>
            </View>

            <Text style={ss.sectionHeader}>STUDENT DETAILS</Text>
            <Field label="Full Name *" icon="user" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Date of Birth" icon="calendar" value={form.dob} onChange={(v) => set("dob", v)} placeholder="YYYY-MM-DD" />
            <Select label="Gender *" options={GENDERS} value={form.gender} onChange={(v) => set("gender", v)} />
            <Select label="Blood Group" options={BLOOD_GROUPS} value={form.bloodGroup} onChange={(v) => set("bloodGroup", v)} />
            <View style={ss.classBadge}>
              <Feather name="lock" size={13} color="#888882" />
              <Text style={ss.classBadgeText}>Class Section: <Text style={{ fontWeight: "700", color: "#C0282A" }}>{classSection}</Text> (auto-assigned)</Text>
            </View>
            <Field label="Roll Number *" icon="hash" value={form.rollNo} onChange={(v) => set("rollNo", v)} keyboard="numeric" />
            <Field label="Admission Number *" icon="hash" value={form.admissionNo} onChange={(v) => set("admissionNo", v)} />
            <Field label="Previous School" icon="book-open" value={form.prevSchool} onChange={(v) => set("prevSchool", v)} />
            <Field label="Home Address" icon="map-pin" value={form.address} onChange={(v) => set("address", v)} multi />

            <Text style={ss.sectionHeader}>PARENT / GUARDIAN</Text>
            <Field label="Parent / Guardian Name *" icon="users" value={form.parentName} onChange={(v) => set("parentName", v)} />
            <Field label="Parent Phone Number *" icon="phone" value={form.parentPhone} onChange={(v) => set("parentPhone", v)} keyboard="phone-pad" />
            <Field label="Parent Login Email *" icon="mail" value={form.parentEmail} onChange={(v) => set("parentEmail", v)} keyboard="email-address" />
            <Field label="WhatsApp Number" icon="message-circle" value={form.parentWhatsApp} onChange={(v) => set("parentWhatsApp", v)} keyboard="phone-pad" placeholder="Same as phone if blank" />

            <Text style={ss.sectionHeader}>PARENT APP LOGIN</Text>
            <Field
              label="Create Password for Parent *"
              icon="lock"
              value={form.parentPassword}
              onChange={(v) => set("parentPassword", v)}
              placeholder="Min. 8 characters"
              secure={!showPass}
              toggle
              onToggle={() => setShowPass((p) => !p)}
            />
            <Field
              label="Confirm Password *"
              icon="lock"
              value={form.confirmPassword}
              onChange={(v) => set("confirmPassword", v)}
              placeholder="Repeat password"
              secure={!showPass}
            />

            <View style={ss.infoBox}>
              <Feather name="info" size={14} color="#1A5FA5" />
              <Text style={ss.infoText}>
                A login account will be created for the parent with this email and password. They can sign in from any device.
              </Text>
            </View>

            <TouchableOpacity style={ss.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                <><Feather name="user-plus" size={16} color="#FFFFFF" /><Text style={ss.btnText}>Add Student</Text></>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const ss = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16, gap: 4 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.75)" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  photoSection: { alignItems: "center", paddingVertical: 16, gap: 8 },
  photoHint: { fontSize: 12, color: "#888882" },
  sectionHeader: { fontSize: 11, fontWeight: "700", color: "#888882", letterSpacing: 0.8, marginBottom: 14, marginTop: 8 },
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
  classBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F5F4F2", borderRadius: 10, padding: 12, marginBottom: 14 },
  classBadgeText: { fontSize: 13, color: "#555550" },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#E8F1FB", borderRadius: 10, padding: 12, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 12, color: "#1A5FA5", lineHeight: 18 },
  btn: { backgroundColor: "#C0282A", borderRadius: 12, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
