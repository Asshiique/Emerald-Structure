/**
 * StarRating — interactive 5-star rating component.
 * Uses Reanimated spring scale for a satisfying press feel.
 */

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type Props = {
  value: number;         // 0–5
  onChange: (v: number) => void;
  size?: number;         // star size in px, default 36
  readonly?: boolean;
};

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

function Star({ filled, onPress, size }: { filled: boolean; onPress: () => void; size: number }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableOpacity
      onPress={() => {
        scale.value = withSpring(1.35, { damping: 8, stiffness: 400 }, () => {
          scale.value = withSpring(1, { damping: 12 });
        });
        onPress();
      }}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Animated.View style={animStyle}>
        <Text style={{ fontSize: size, lineHeight: size + 8 }}>{filled ? "⭐" : "☆"}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function StarRating({ value, onChange, size = 34, readonly = false }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) =>
          readonly ? (
            <Text key={n} style={{ fontSize: size * 0.7, lineHeight: size }}>{n <= value ? "⭐" : "☆"}</Text>
          ) : (
            <Star key={n} filled={n <= value} onPress={() => onChange(n)} size={size} />
          )
        )}
      </View>
      {value > 0 && (
        <Text style={styles.label}>{LABELS[value]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 6 },
  starsRow: { flexDirection: "row", gap: 4 },
  label: { fontSize: 13, fontWeight: "600", color: "#C8972A" },
});
