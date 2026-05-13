import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { FadeSlideIn } from "@/components/FadeSlideIn";
import { StarRating } from "@/components/StarRating";

type FeedbackType = "complaint" | "suggestion" | "appreciation";
type Category = "teacher" | "facility" | "curriculum" | "fees" | "transport" | "other";

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: "teacher", label: "Teacher", icon: "user" },
  { key: "facility", label: "Facility", icon: "home" },
  { key: "curriculum", label: "Curriculum", icon: "book-open" },
  { key: "fees", label: "Fees", icon: "credit-card" },
  { key: "transport", label: "Transport", icon: "truck" },
  { key: "other", label: "Other", icon: "more-horizontal" },
];

const TYPE_CONFIG = {
  complaint:    { label: "Complaint",    icon: "alert-circle", color: "#C0282A", bg: "#F8EBEB" },
  suggestion:   { label: "Suggestion",   icon: "zap",          color: "#185FA5", bg: "#EAF0FB" },
  appreciation: { label: "Appreciation", icon: "heart",        color: "#C8972A", bg: "#FFF8EC" },
} as const;

export default function FeedbackPage() {
  const { user } = useAuth();
  const { data } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [type, setType] = useState<FeedbackType>("suggestion");
  const [category, setCategory] = useState<Category>("other");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const student = data.students.find(
    (s) => s.parentEmail?.toLowerCase() === user?.email?.toLowerCase()
  );

  // When appreciation, auto-set category to teacher if a teacher is selected
  const effectiveCategory = type === "appreciation" && selectedTeacherId ? "teacher" : category;
  const selectedTeacher = data.staff.find((s) => s.id === selectedTeacherId);

  const handleTypeChange = (t: FeedbackType) => {
    setType(t);
    if (t === "appreciation") setRating(0);
  };

  const handleSubmit = async () => {
    if (type === "appreciation" && rating === 0) {
      Alert.alert("Rating required", "Please give a star rating before submitting.");
      return;
    }
    if (message.trim().length < 10) {
      Alert.alert("Too short", "Please write at least 10 characters.");
      return;
    }

    setSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await addDoc(collection(db, "feedback"), {
        type,
        category: effectiveCategory,
        message: message.trim(),
        rating: type === "appreciation" ? rating : null,
        appreciatedTeacherId: type === "appreciation" ? (selectedTeacherId ?? null) : null,
        appreciatedTeacherName: type === "appreciation" ? (selectedTeacher?.name ?? null) : null,
        anonymous,
        parentName: anonymous ? null : (user?.name ?? null),
        parentEmail: anonymous ? null : (user?.email ?? null),
        studentName: anonymous ? null : (student?.name ?? null),
        classSection: student?.classSection ?? user?.classSection ?? null,
        status: "pending",
        adminReply: null,
        createdAt: serverTimestamp(),
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch {
      Alert.alert("Error", "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const tc = TYPE_CONFIG[type];
    return (
      <View style={styles.successContainer}>
        <FadeSlideIn delay={0}>
          <View style={[styles.successIcon, { backgroundColor: tc.bg }]}>
            <Text style={{ fontSize: 52 }}>{type === "appreciation" ? "⭐" : type === "complaint" ? "📝" : "💡"}</Text>
          </View>
          <Text style={styles.successTitle}>
            {type === "appreciation" ? "Thank you! 🎉" : "Submitted!"}
          </Text>
          <Text style={styles.successSub}>
            {type === "appreciation"
              ? `Your appreciation${selectedTeacher ? ` for ${selectedTeacher.name}` : ""} has been shared with the school.`
              : `Your ${type} has been submitted to the administration and will be reviewed shortly.`}
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </FadeSlideIn>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Feedback</Text>
            <Text style={styles.headerSub}>Complaints, Suggestions & Appreciation</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Type selector */}
          <FadeSlideIn delay={0}>
            <Text style={styles.sectionLabel}>I WANT TO</Text>
            <View style={styles.typeGrid}>
              {(Object.entries(TYPE_CONFIG) as [FeedbackType, typeof TYPE_CONFIG[FeedbackType]][]).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.typeCard, type === key && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                  onPress={() => handleTypeChange(key)}
                  activeOpacity={0.8}
                >
                  <Feather name={cfg.icon as any} size={20} color={type === key ? cfg.color : "#888882"} />
                  <Text style={[styles.typeCardText, type === key && { color: cfg.color, fontWeight: "700" }]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FadeSlideIn>

          {/* Star rating — only for appreciation */}
          {type === "appreciation" && (
            <FadeSlideIn delay={60}>
              <Text style={styles.sectionLabel}>RATING</Text>
              <View style={styles.ratingCard}>
                <Text style={styles.ratingPrompt}>How would you rate your experience?</Text>
                <StarRating value={rating} onChange={setRating} size={38} />
              </View>
            </FadeSlideIn>
          )}

          {/* Teacher selector — only for appreciation */}
          {type === "appreciation" && data.staff.length > 0 && (
            <FadeSlideIn delay={120}>
              <Text style={styles.sectionLabel}>APPRECIATING (OPTIONAL)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                <TouchableOpacity
                  style={[styles.teacherChip, !selectedTeacherId && styles.teacherChipActive]}
                  onPress={() => setSelectedTeacherId(null)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.teacherChipText, !selectedTeacherId && styles.teacherChipTextActive]}>
                    School Overall
                  </Text>
                </TouchableOpacity>
                {data.staff.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.teacherChip, selectedTeacherId === s.id && styles.teacherChipActive]}
                    onPress={() => setSelectedTeacherId(s.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.teacherChipText, selectedTeacherId === s.id && styles.teacherChipTextActive]}>
                      {s.name.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </FadeSlideIn>
          )}

          {/* Category — only for complaint/suggestion */}
          {type !== "appreciation" && (
            <FadeSlideIn delay={80}>
              <Text style={styles.sectionLabel}>CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catBtn, category === cat.key && styles.catBtnActive]}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.8}
                  >
                    <Feather name={cat.icon as any} size={14} color={category === cat.key ? "#C0282A" : "#555550"} />
                    <Text style={[styles.catText, category === cat.key && { color: "#C0282A", fontWeight: "600" }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FadeSlideIn>
          )}

          {/* Message */}
          <FadeSlideIn delay={160}>
            <Text style={styles.sectionLabel}>
              {type === "appreciation" ? "YOUR KIND WORDS" : "YOUR MESSAGE"}
            </Text>
            <View style={styles.messageCard}>
              <TextInput
                style={styles.messageInput}
                placeholder={
                  type === "complaint"
                    ? "Describe the issue clearly. What happened? When?"
                    : type === "suggestion"
                    ? "Share your idea to help improve the school…"
                    : "Write something kind — teachers love hearing this! 🌟"
                }
                placeholderTextColor="#AAAAAA"
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.charCount}>{message.length}/1000</Text>
            </View>
          </FadeSlideIn>

          {/* Anonymous toggle */}
          <FadeSlideIn delay={240}>
            <View style={styles.anonCard}>
              <View style={styles.anonLeft}>
                <View style={styles.anonIcon}>
                  <Feather name="eye-off" size={16} color="#555550" />
                </View>
                <View>
                  <Text style={styles.anonTitle}>Submit anonymously</Text>
                  <Text style={styles.anonSub}>Your name won't be shown</Text>
                </View>
              </View>
              <Switch
                value={anonymous}
                onValueChange={setAnonymous}
                trackColor={{ false: "#E0E0E0", true: "#C0282A" }}
                thumbColor="#FFFFFF"
              />
            </View>
            {!anonymous && (
              <View style={styles.identityCard}>
                <Feather name="user" size={13} color="#555550" />
                <Text style={styles.identityText}>
                  Submitting as{" "}
                  <Text style={{ fontWeight: "600", color: "#1A1A1A" }}>{user?.name ?? user?.email}</Text>
                  {student ? ` · Parent of ${student.name}` : ""}
                </Text>
              </View>
            )}
          </FadeSlideIn>

          {/* Submit */}
          <FadeSlideIn delay={320}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                submitting && { opacity: 0.7 },
                type === "appreciation" && { backgroundColor: "#C8972A" },
                type === "suggestion" && { backgroundColor: "#185FA5" },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Feather name={type === "appreciation" ? "heart" : "send"} size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>
                {submitting ? "Submitting…" : `Submit ${TYPE_CONFIG[type].label}`}
              </Text>
            </TouchableOpacity>
            <Text style={styles.disclaimer}>All feedback is reviewed by school administration.</Text>
          </FadeSlideIn>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },
  typeGrid: { flexDirection: "row", gap: 8 },
  typeCard: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#FFFFFF", borderRadius: 14, paddingVertical: 16,
    borderWidth: 1.5, borderColor: "rgba(0,0,0,0.08)",
  },
  typeCardText: { fontSize: 12, fontWeight: "500", color: "#888882" },
  ratingCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 20, alignItems: "center", gap: 12, borderWidth: 0.5, borderColor: "rgba(200,151,42,0.3)" },
  ratingPrompt: { fontSize: 14, color: "#555550", textAlign: "center" },
  teacherChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  teacherChipActive: { backgroundColor: "#FFF8EC", borderColor: "rgba(200,151,42,0.4)" },
  teacherChipText: { fontSize: 13, fontWeight: "500", color: "#555550" },
  teacherChipTextActive: { color: "#C8972A", fontWeight: "700" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  catBtnActive: { backgroundColor: "#F8EBEB", borderColor: "rgba(192,40,42,0.3)" },
  catText: { fontSize: 13, fontWeight: "500", color: "#555550" },
  messageCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.1)" },
  messageInput: { fontSize: 14, color: "#1A1A1A", minHeight: 130, lineHeight: 22 },
  charCount: { fontSize: 11, color: "#AAAAAA", textAlign: "right", marginTop: 8 },
  anonCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, gap: 12, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)" },
  anonLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  anonIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F5F4F2", alignItems: "center", justifyContent: "center" },
  anonTitle: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  anonSub: { fontSize: 12, color: "#888882", marginTop: 2 },
  identityCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EAF3DE", borderRadius: 10, padding: 12, marginTop: 8 },
  identityText: { fontSize: 12, color: "#555550", flex: 1 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#C0282A", borderRadius: 14, paddingVertical: 16, marginTop: 24 },
  submitText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  disclaimer: { fontSize: 11, color: "#AAAAAA", textAlign: "center", marginTop: 12 },
  successContainer: { flex: 1, backgroundColor: "#F5F4F2", alignItems: "center", justifyContent: "center", padding: 32 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 24, alignSelf: "center" },
  successTitle: { fontSize: 26, fontWeight: "700", color: "#1A1A1A", textAlign: "center", marginBottom: 12 },
  successSub: { fontSize: 14, color: "#555550", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  doneBtn: { backgroundColor: "#C0282A", borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, alignSelf: "center" },
  doneBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
