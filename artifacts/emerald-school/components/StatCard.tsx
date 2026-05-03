import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  value: string;
  label: string;
  sublabel: string;
}

export function StatCard({ value, label, sublabel }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.sublabel}>{sublabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  value: {
    fontSize: 26,
    fontWeight: "700",
    color: "#C0282A",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A1A1A",
    marginTop: 4,
  },
  sublabel: {
    fontSize: 11,
    color: "#888882",
    marginTop: 2,
  },
});
