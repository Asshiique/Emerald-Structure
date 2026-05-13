import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { TimetableSlot, useData } from "@/context/DataContext";

const SUBJECT_COLORS: Record<string, string> = { Mathematics: "#C0282A", Physics: "#185FA5", English: "#3B6D11", Chemistry: "#BA7517", Biology: "#7B3F9E", "Computer Science": "#1A7A6E" };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const { user } = useAuth();
  const { data, updateTimetable } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const isAdmin = user?.role === "admin";
  const bottomPad = isWeb ? 34 : insets.bottom;
  const today = new Date().getDay();
  const defaultDay = DAYS[today - 1] ?? "Monday";
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const currentDay = data.timetable.find((t) => t.day === selectedDay) ?? data.timetable[0];
  const [slots, setSlots] = useState<TimetableSlot[]>(currentDay?.slots ?? []);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => { setSlots(currentDay?.slots ?? []); }, [currentDay?.day]);

  const slotRows = useMemo(() => slots.map((slot, index) => ({ ...slot, index })), [slots]);

  const updateSlot = (index: number, key: keyof TimetableSlot, value: string) => {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, [key]: value } : slot)));
  };

  const addSlot = () => setSlots((prev) => [...prev, { time: "", subject: "", teacher: "" }]);
  const removeSlot = (index: number) => setSlots((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await updateTimetable(selectedDay, slots.filter((slot) => slot.time.trim() || slot.subject.trim() || slot.teacher.trim()));
      Alert.alert("Saved", `${selectedDay} timetable updated.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Timetable</Text>
            <Text style={styles.headerSub}>
              {user?.classSection ? `Class ${user.classSection}` : "School Timetable"}{" "}
              {data.settings.academicYear ? `· ${data.settings.academicYear}` : ""}
            </Text>
          </View>
          {isAdmin ? (
            <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="save" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          {DAYS.map((day) => (
            <TouchableOpacity key={day} style={[styles.dayChip, selectedDay === day && styles.dayChipActive]} onPress={() => setSelectedDay(day)} activeOpacity={0.7}>
              <Text style={[styles.dayChipText, selectedDay === day && styles.dayChipTextActive]}>{day.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 24 }} showsVerticalScrollIndicator={false}>
          {isAdmin ? (
            <View style={styles.editBanner}>
              <Feather name="edit-2" size={14} color="#8B6010" />
              <Text style={styles.editBannerText}>Admin can edit the timetable for each day.</Text>
            </View>
          ) : null}

          {isAdmin ? (
            <View style={styles.card}>
              {slotRows.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="calendar" size={32} color="#C0282A" />
                  <Text style={styles.emptyTitle}>No slots for this day</Text>
                  <TouchableOpacity style={styles.addSlotBtn} onPress={addSlot}>
                    <Text style={styles.addSlotBtnText}>Add Slot</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                slotRows.map((slot) => {
                  const color = SUBJECT_COLORS[slot.subject] ?? "#888882";
                  return (
                    <View key={slot.index} style={styles.editRow}>
                      <TextInput style={styles.timeInput} value={slot.time} onChangeText={(v) => updateSlot(slot.index, "time", v)} placeholder="09:00" placeholderTextColor="#AAAAAA" />
                      <TextInput style={styles.slotInput} value={slot.subject} onChangeText={(v) => updateSlot(slot.index, "subject", v)} placeholder="Subject" placeholderTextColor="#AAAAAA" />
                      <TextInput style={styles.slotInput} value={slot.teacher} onChangeText={(v) => updateSlot(slot.index, "teacher", v)} placeholder="Teacher" placeholderTextColor="#AAAAAA" />
                      <TouchableOpacity style={[styles.removeBtn, { backgroundColor: color + "18" }]} onPress={() => removeSlot(slot.index)}>
                        <Feather name="trash-2" size={14} color={color} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
              <TouchableOpacity style={styles.addRowBtn} onPress={addSlot}>
                <Feather name="plus" size={16} color="#C0282A" />
                <Text style={styles.addRowText}>Add Slot</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              {(currentDay?.slots ?? []).map((slot, i) => {
                const color = SUBJECT_COLORS[slot.subject] ?? "#888882";
                return (
                  <View key={i} style={[styles.slotRow, i < (currentDay?.slots.length ?? 0) - 1 && styles.slotBorder]}>
                    <Text style={styles.slotTime}>{slot.time}</Text>
                    <View style={[styles.slotDot, { backgroundColor: color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slotSubject}>{slot.subject}</Text>
                      {slot.teacher ? <Text style={styles.slotTeacher}>{slot.teacher}</Text> : null}
                    </View>
                    <View style={[styles.slotColorBar, { backgroundColor: color + "20" }]}>
                      <View style={[styles.slotColorBarFill, { backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 8, paddingBottom: 16, overflow: "hidden" },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  saveHeaderBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  dayScroll: { backgroundColor: "#F5F4F2", flexGrow: 0 },
  dayChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.12)", backgroundColor: "#FFFFFF", marginRight: 8 },
  dayChipActive: { backgroundColor: "#C0282A", borderColor: "#C0282A" },
  dayChipText: { fontSize: 13, fontWeight: "600", color: "#555550" },
  dayChipTextActive: { color: "#FFFFFF" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: "hidden" },
  editBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF8EC", borderRadius: 12, padding: 12, marginBottom: 12 },
  editBannerText: { flex: 1, fontSize: 12, color: "#8B6010" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  addSlotBtn: { backgroundColor: "#C0282A", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  addSlotBtnText: { color: "#FFFFFF", fontWeight: "700" },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.08)" },
  timeInput: { width: 64, backgroundColor: "#F5F4F2", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, fontSize: 12, color: "#1A1A1A" },
  slotInput: { flex: 1, backgroundColor: "#F5F4F2", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, fontSize: 12, color: "#1A1A1A" },
  removeBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  addRowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  addRowText: { color: "#C0282A", fontWeight: "700" },
  slotRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  slotBorder: { borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.08)" },
  slotTime: { fontSize: 12, fontWeight: "600", color: "#888882", width: 48 },
  slotDot: { width: 8, height: 8, borderRadius: 4 },
  slotSubject: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  slotTeacher: { fontSize: 11, color: "#888882", marginTop: 2 },
  slotColorBar: { width: 4, height: "100%", minHeight: 40, borderRadius: 2, overflow: "hidden" },
  slotColorBarFill: { width: 4, flex: 1 },
});
