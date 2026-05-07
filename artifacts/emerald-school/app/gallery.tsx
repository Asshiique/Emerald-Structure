import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { GalleryItem, useData } from "@/context/DataContext";
import { pickImageWithChoice } from "@/hooks/useImagePicker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_SIZE = (SCREEN_WIDTH - 48) / 2;

const CATEGORIES: GalleryItem["category"][] = ["Events", "Sports", "Academic", "Cultural"];
const CATEGORY_COLORS: Record<string, string> = { Events: "#BA7517", Sports: "#185FA5", Academic: "#3B6D11", Cultural: "#7B3F9E" };

function UploadModal({ visible, onClose, onUpload }: { visible: boolean; onClose: () => void; onUpload: (item: Omit<GalleryItem, "id" | "uploadedAt">) => Promise<void> }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GalleryItem["category"]>("Events");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    const uri = await pickImageWithChoice();
    if (uri) setPhoto(uri);
  };

  const handleUpload = async () => {
    if (!photo || !title.trim()) {
      Alert.alert("Missing Fields", "Please add a photo and a title.");
      return;
    }
    setLoading(true);
    try {
      await onUpload({ photo, title: title.trim(), category, date });
      setPhoto(null); setTitle(""); setCategory("Events"); setDate(new Date().toISOString().split("T")[0]);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        <View style={ms.modalHeader}>
          <Text style={ms.modalTitle}>Add Photo</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color="#1A1A1A" /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={ms.photoPickerBox} onPress={handlePickPhoto} activeOpacity={0.8}>
            {photo ? (
              <Image source={{ uri: photo }} style={{ width: "100%", height: 200, borderRadius: 12 }} resizeMode="cover" />
            ) : (
              <>
                <Feather name="camera" size={36} color="#888882" />
                <Text style={ms.photoPickerText}>Tap to select a photo</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={ms.fieldLabel}>Title *</Text>
          <View style={ms.inputRow}>
            <TextInput style={ms.input} value={title} onChangeText={setTitle} placeholder="e.g. Annual Day – Tarang 2025" placeholderTextColor="#AAAAAA" autoCapitalize="sentences" />
          </View>

          <Text style={ms.fieldLabel}>Category</Text>
          <View style={ms.catRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[ms.catChip, category === c && { backgroundColor: CATEGORY_COLORS[c], borderColor: CATEGORY_COLORS[c] }]} activeOpacity={0.7}>
                <Text style={[ms.catChipText, category === c && { color: "#FFFFFF" }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={ms.fieldLabel}>Date</Text>
          <View style={ms.inputRow}>
            <Feather name="calendar" size={14} color="#888882" style={{ marginLeft: 12 }} />
            <TextInput style={ms.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#AAAAAA" />
          </View>

          <TouchableOpacity style={ms.uploadBtn} onPress={handleUpload} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : (
              <><Feather name="upload" size={16} color="#FFFFFF" /><Text style={ms.uploadBtnText}>Upload Photo</Text></>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function GalleryPage() {
  const { user } = useAuth();
  const { data, addGalleryPhoto, removeGalleryPhoto } = useData();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const isAdmin = user?.role === "admin";

  const [filter, setFilter] = useState<GalleryItem["category"] | "All">("All");
  const [showUpload, setShowUpload] = useState(false);
  const [fullscreen, setFullscreen] = useState<GalleryItem | null>(null);

  const filtered = data.gallery.filter((g) => filter === "All" || g.category === filter);

  const handleDelete = (item: GalleryItem) => {
    Alert.alert("Delete Photo", `Delete "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeGalleryPhoto(item.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Gallery</Text>
          <Text style={styles.headerSub}>{data.gallery.length} photos</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowUpload(true)}>
            <Feather name="plus" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {!isAdmin && <View style={{ width: 44 }} />}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        {(["All", ...CATEGORIES] as (GalleryItem["category"] | "All")[]).map((c) => (
          <TouchableOpacity key={c} onPress={() => setFilter(c)} style={[styles.chip, filter === c && styles.chipActive]}>
            <Text style={[styles.chipText, filter === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="image" size={48} color="#C0282A" />
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptySub}>{isAdmin ? "Tap + to upload the first photo" : "No photos have been uploaded yet"}</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((item) => (
              <TouchableOpacity key={item.id} style={styles.gridItem} onPress={() => setFullscreen(item)} activeOpacity={0.85}>
                <Image source={{ uri: item.photo }} style={styles.gridImage} resizeMode="cover" />
                <View style={styles.gridOverlay}>
                  <View style={[styles.catBadge, { backgroundColor: CATEGORY_COLORS[item.category] ?? "#555550" }]}>
                    <Text style={styles.catBadgeText}>{item.category}</Text>
                  </View>
                  <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.gridDate}>{item.date}</Text>
                </View>
                {isAdmin && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={(e) => { e.stopPropagation(); handleDelete(item); }}>
                    <Feather name="trash-2" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {isAdmin && (
        <UploadModal visible={showUpload} onClose={() => setShowUpload(false)} onUpload={addGalleryPhoto} />
      )}

      {fullscreen && (
        <Modal visible animationType="fade" onRequestClose={() => setFullscreen(null)}>
          <View style={fs.container}>
            <TouchableOpacity style={fs.closeBtn} onPress={() => setFullscreen(null)}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Image source={{ uri: fullscreen.photo }} style={fs.image} resizeMode="contain" />
            <View style={fs.info}>
              <Text style={fs.title}>{fullscreen.title}</Text>
              <Text style={fs.meta}>{fullscreen.category} · {fullscreen.date}</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  addBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  chipScroll: { flexGrow: 0, backgroundColor: "#F5F4F2" },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  chipActive: { backgroundColor: "#C0282A", borderColor: "#C0282A" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#555550" },
  chipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridItem: { width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: 12, overflow: "hidden", backgroundColor: "#E0E0E0" },
  gridImage: { width: "100%", height: "100%" },
  gridOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: "rgba(0,0,0,0.45)" },
  catBadge: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 3 },
  catBadgeText: { fontSize: 9, fontWeight: "700", color: "#FFFFFF" },
  gridTitle: { fontSize: 11, fontWeight: "700", color: "#FFFFFF", lineHeight: 14 },
  gridDate: { fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  deleteBtn: { position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(192,40,42,0.85)", alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  emptySub: { fontSize: 13, color: "#888882", textAlign: "center" },
});

const ms = StyleSheet.create({
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 20, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.1)", backgroundColor: "#FFFFFF" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  photoPickerBox: { backgroundColor: "#FFFFFF", borderRadius: 14, height: 200, alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, borderWidth: 1.5, borderColor: "rgba(0,0,0,0.1)", borderStyle: "dashed", overflow: "hidden" },
  photoPickerText: { fontSize: 13, color: "#888882" },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 10, height: 48, gap: 8, marginBottom: 16, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.1)" },
  input: { flex: 1, fontSize: 14, color: "#1A1A1A", paddingHorizontal: 12 },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "rgba(0,0,0,0.12)", backgroundColor: "#F5F4F2" },
  catChipText: { fontSize: 13, fontWeight: "500", color: "#555550" },
  uploadBtn: { backgroundColor: "#C0282A", borderRadius: 12, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  uploadBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});

const fs = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000", justifyContent: "center" },
  closeBtn: { position: "absolute", top: 50, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "80%" },
  info: { position: "absolute", bottom: 60, left: 20, right: 20 },
  title: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  meta: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
});
