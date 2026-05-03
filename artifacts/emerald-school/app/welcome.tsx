import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const FEATURES = [
  { icon: "bell", title: "Stay Informed", desc: "View school notices, events, and urgent updates instantly." },
  { icon: "bar-chart-2", title: "Track Progress", desc: "See your child's marks, attendance, and homework status." },
  { icon: "credit-card", title: "Manage Fees", desc: "Check fee status, due dates, and payment history." },
];

export default function WelcomePage() {
  const { user } = useAuth();
  const { markParentFirstLogin } = useData();
  const insets = useSafeAreaInsets();

  const handleGetStarted = async () => {
    if (user?.email) await markParentFirstLogin(user.email);
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.iconBox}>
          <Feather name="shield" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.schoolName}>Emerald International School</Text>
        {user && (
          <Text style={styles.studentName}>
            {user.name} · Class {user.classSection}
          </Text>
        )}
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        <Text style={styles.sectionLabel}>WHAT YOU CAN DO HERE</Text>
        {FEATURES.map((f) => (
          <View key={f.icon} style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Feather name={f.icon as any} size={22} color="#C0282A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.btn} onPress={handleGetStarted} activeOpacity={0.85}>
          <Text style={styles.btnText}>Get Started</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#C0282A", alignItems: "center", paddingHorizontal: 24, paddingBottom: 36, overflow: "hidden" },
  circle1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.06)", top: -60, right: -50 },
  circle2: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: -20 },
  iconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  welcomeText: { fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 4 },
  schoolName: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", textAlign: "center", marginBottom: 8 },
  studentName: { fontSize: 13, color: "rgba(255,255,255,0.7)", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, marginBottom: 12 },
  featureCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  featureIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: "#F8EBEB", alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 14, fontWeight: "600", color: "#1A1A1A", marginBottom: 4 },
  featureDesc: { fontSize: 12, color: "#666660", lineHeight: 18 },
  footer: { padding: 20 },
  btn: { backgroundColor: "#C0282A", borderRadius: 14, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  btnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
