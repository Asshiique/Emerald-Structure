import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import { Student, useData } from "@/context/DataContext";
import { useRoleGuard } from "@/hooks/useRoleGuard";

type EditableFields = Pick<
  Student,
  "name" | "classSection" | "rollNo" | "parentName" | "parentPhone" | "parentWhatsApp" | "address" | "bloodGroup" | "parentEmail"
>;

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Feather name={icon as any} size={14} color="#C0282A" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function StudentProfilePage() {
  useRoleGuard(["admin", "teacher"]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, updateStudent, removeStudent } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const student = data.students.find((s) => s.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditableFields>({
    name: student?.name ?? "",
    classSection: student?.classSection ?? "",
    rollNo: student?.rollNo ?? "",
    parentName: student?.parentName ?? "",
    parentPhone: student?.parentPhone ?? "",
    parentWhatsApp: student?.parentWhatsApp ?? "",
    address: student?.address ?? "",
    bloodGroup: student?.bloodGroup ?? "",
    parentEmail: student?.parentEmail ?? "",
  });

  if (!student) {
    return (
      <View style={styles.center}>
        <Feather name="user-x" size={40} color="#C0282A" />
        <Text style={styles.notFoundText}>Student not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const set = (key: keyof EditableFields, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStudent(student.id, form);
      setIsEditing(false);
    } catch {
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () =>
    Alert.alert(
      "Delete Student",
      `Are you sure you want to delete ${student.name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeStudent(student.id);
            router.back();
          },
        },
      ]
    );

  const initials = student.name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const genderColor = student.gender === "Female" ? "#7B3F9E" : "#185FA5";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Profile</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              if (isEditing) {
                // Cancel editing
                setForm({
                  name: student.name,
                  classSection: student.classSection,
                  rollNo: student.rollNo,
                  parentName: student.parentName,
                  parentPhone: student.parentPhone,
                  parentWhatsApp: student.parentWhatsApp,
                  address: student.address,
                  bloodGroup: student.bloodGroup,
                  parentEmail: student.parentEmail,
                });
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Feather name={isEditing ? "x" : "edit-2"} size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile card */}
          <View style={styles.profileCard}>
            <PhotoAvatar photo={student.profilePhoto} name={student.name} size={72} borderColor="#C0282A" />
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={form.name}
                onChangeText={(v) => set("name", v)}
                placeholder="Full name"
                autoCapitalize="words"
              />
            ) : (
              <Text style={styles.profileName}>{student.name}</Text>
            )}
            <View style={styles.badgeRow}>
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>
                  {isEditing ? form.classSection : student.classSection}
                </Text>
              </View>
              <View style={[styles.genderBadge, { backgroundColor: genderColor + "20" }]}>
                <Text style={[styles.genderText, { color: genderColor }]}>{student.gender}</Text>
              </View>
              {student.admissionNo ? (
                <View style={styles.admBadge}>
                  <Text style={styles.admText}>Adm: {student.admissionNo}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Academic info */}
          <Text style={styles.sectionLabel}>ACADEMIC</Text>
          <View style={styles.card}>
            {isEditing ? (
              <>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Class Section</Text>
                  <TextInput style={styles.fieldInput} value={form.classSection} onChangeText={(v) => set("classSection", v)} placeholder="e.g. 5A" autoCapitalize="characters" />
                </View>
                <View style={[styles.fieldRow, styles.fieldBorder]}>
                  <Text style={styles.fieldLabel}>Roll Number</Text>
                  <TextInput style={styles.fieldInput} value={form.rollNo} onChangeText={(v) => set("rollNo", v)} placeholder="Roll no." />
                </View>
              </>
            ) : (
              <>
                <InfoRow label="Class" value={student.classSection} icon="book-open" />
                <View style={styles.divider} />
                <InfoRow label="Roll Number" value={student.rollNo} icon="hash" />
                <View style={styles.divider} />
                <InfoRow label="Date of Birth" value={student.dob} icon="calendar" />
                <View style={styles.divider} />
                <InfoRow label="Blood Group" value={student.bloodGroup} icon="activity" />
              </>
            )}
          </View>

          {/* Parent info */}
          <Text style={styles.sectionLabel}>PARENT / GUARDIAN</Text>
          <View style={styles.card}>
            {isEditing ? (
              <>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Father's Name</Text>
                  <TextInput style={styles.fieldInput} value={form.parentName} onChangeText={(v) => set("parentName", v)} autoCapitalize="words" />
                </View>
                <View style={[styles.fieldRow, styles.fieldBorder]}>
                  <Text style={styles.fieldLabel}>Mobile 1</Text>
                  <TextInput style={styles.fieldInput} value={form.parentPhone} onChangeText={(v) => set("parentPhone", v)} keyboardType="phone-pad" />
                </View>
                <View style={[styles.fieldRow, styles.fieldBorder]}>
                  <Text style={styles.fieldLabel}>Mobile 2 / WA</Text>
                  <TextInput style={styles.fieldInput} value={form.parentWhatsApp} onChangeText={(v) => set("parentWhatsApp", v)} keyboardType="phone-pad" />
                </View>
                <View style={[styles.fieldRow, styles.fieldBorder]}>
                  <Text style={styles.fieldLabel}>Parent Email</Text>
                  <TextInput style={styles.fieldInput} value={form.parentEmail} onChangeText={(v) => set("parentEmail", v)} keyboardType="email-address" autoCapitalize="none" />
                </View>
                <View style={[styles.fieldRow, styles.fieldBorder]}>
                  <Text style={styles.fieldLabel}>Address</Text>
                  <TextInput style={styles.fieldInput} value={form.address} onChangeText={(v) => set("address", v)} multiline />
                </View>
              </>
            ) : (
              <>
                <InfoRow label="Father's Name" value={student.parentName} icon="user" />
                <View style={styles.divider} />
                <InfoRow label="Mother's Name" value={(student as any).motherName ?? ""} icon="user" />
                <View style={styles.divider} />
                <InfoRow label="Mobile 1" value={student.parentPhone} icon="phone" />
                <View style={styles.divider} />
                <InfoRow label="Mobile 2 / WhatsApp" value={student.parentWhatsApp} icon="message-circle" />
                <View style={styles.divider} />
                <InfoRow label="Parent Email" value={student.parentEmail} icon="mail" />
                <View style={styles.divider} />
                <InfoRow label="Address" value={student.address} icon="map-pin" />
              </>
            )}
          </View>

          {/* Actions */}
          {isEditing ? (
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Feather name="check" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Changes"}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${student.parentPhone}`)}
                activeOpacity={0.8}
              >
                <Feather name="phone" size={16} color="#FFFFFF" />
                <Text style={styles.callBtnText}>Call Parent</Text>
              </TouchableOpacity>
              {student.parentWhatsApp ? (
                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() => Linking.openURL(`https://wa.me/${student.parentWhatsApp.replace(/\D/g, "")}`)}
                  activeOpacity={0.8}
                >
                  <Feather name="message-circle" size={16} color="#27500A" />
                  <Text style={styles.waBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {!isEditing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              <Feather name="trash-2" size={16} color="#C0282A" />
              <Text style={styles.deleteBtnText}>Delete Student Record</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#C0282A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
  backLink: { fontSize: 14, color: "#C0282A", fontWeight: "600" },
  profileCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginBottom: 4,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileName: { fontSize: 20, fontWeight: "700", color: "#1A1A1A", textAlign: "center" },
  nameInput: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#C0282A",
    paddingBottom: 4,
    minWidth: 200,
  },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  classBadge: { backgroundColor: "#F8EBEB", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  classBadgeText: { fontSize: 12, fontWeight: "700", color: "#C0282A" },
  genderBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  genderText: { fontSize: 12, fontWeight: "600" },
  admBadge: { backgroundColor: "#F5F4F2", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  admText: { fontSize: 12, color: "#555550" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888882",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  divider: { height: 0.5, backgroundColor: "rgba(0,0,0,0.08)", marginHorizontal: 16 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F8EBEB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoLabel: { fontSize: 11, color: "#888882", marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "500", color: "#1A1A1A" },
  fieldRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  fieldBorder: { borderTopWidth: 0.5, borderTopColor: "rgba(0,0,0,0.08)" },
  fieldLabel: { fontSize: 13, color: "#555550", width: 110 },
  fieldInput: { flex: 1, fontSize: 14, color: "#1A1A1A", borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.15)", paddingVertical: 4 },
  actionsRow: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 20 },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C0282A",
    borderRadius: 12,
    paddingVertical: 14,
  },
  callBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  waBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EAF3DE",
    borderRadius: 12,
    paddingVertical: 14,
  },
  waBtnText: { fontSize: 14, fontWeight: "700", color: "#27500A" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C0282A",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F8EBEB",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 14,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "600", color: "#C0282A" },
});