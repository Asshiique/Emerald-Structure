import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PhotoAvatarProps {
  photo?: string;
  name: string;
  size?: number;
  onPress?: () => void;
  showCamera?: boolean;
  borderColor?: string;
  fontSize?: number;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
}

export function PhotoAvatar({ photo, name, size = 44, onPress, showCamera = false, borderColor = "#C0282A", fontSize }: PhotoAvatarProps) {
  const initials = getInitials(name || "?");
  const fs = fontSize ?? Math.floor(size * 0.35);
  const cameraSize = Math.max(18, Math.floor(size * 0.32));

  const inner = photo ? (
    <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
  ) : (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2, borderColor, borderWidth: size > 50 ? 3 : 2, backgroundColor: "#F8EBEB" }]}>
      <Text style={[styles.initials, { fontSize: fs, color: borderColor }]}>{initials}</Text>
    </View>
  );

  if (!onPress) return <View style={{ position: "relative" }}>{inner}</View>;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ position: "relative" }}>
      {inner}
      {showCamera && (
        <View style={[styles.cameraBtn, { width: cameraSize, height: cameraSize, borderRadius: cameraSize / 2, bottom: 0, right: 0 }]}>
          <Feather name="camera" size={cameraSize * 0.55} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: "center", justifyContent: "center" },
  initials: { fontWeight: "700" },
  cameraBtn: { position: "absolute", backgroundColor: "#C0282A", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" },
});
