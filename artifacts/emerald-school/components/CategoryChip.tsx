import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface CategoryChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export function CategoryChip({ label, isSelected, onPress }: CategoryChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, isSelected && styles.selectedChip]}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, isSelected && styles.selectedLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: "#C0282A",
    borderColor: "#C0282A",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555550",
  },
  selectedLabel: {
    color: "#FFFFFF",
  },
});
