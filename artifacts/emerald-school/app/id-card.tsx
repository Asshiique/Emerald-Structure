import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

export default function IDCardPage() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "AS";

  const handleDownload = () => {
    Alert.alert(
      "Download ID Card",
      "PDF download will be available in the next update.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student ID Card</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 32, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.cardTopRow}>
              <View style={styles.shieldIconBox}>
                <Feather name="shield" size={26} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.schoolNameSmall}>EMERALD INTERNATIONAL SCHOOL</Text>
                <Text style={styles.schoolLocation}>Mannarkkad, Kerala</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardMiddle}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.studentName}>{user?.name ?? "Aryan Sharma"}</Text>
            <Text style={styles.studentClass}>
              Class {user?.classSection ?? "X-B"}
            </Text>
            <Text style={styles.studentId} numberOfLines={1}>
              {user?.rollNo ?? "EIS/2024/1024"}
            </Text>

            <View style={styles.divider} />

            <View style={styles.detailsGrid}>
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>ROLL NO.</Text>
                <Text style={styles.detailValue}>{user?.rollNo?.split("/").pop() ?? "1024"}</Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>BLOOD GROUP</Text>
                <Text style={styles.detailValue}>A+</Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>ACADEMIC YEAR</Text>
                <Text style={styles.detailValue}>2024–25</Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>DATE OF BIRTH</Text>
                <Text style={styles.detailValue}>12 Mar 2009</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardBottom}>
            <Text style={styles.validText}>Valid for Academic Year 2024–25</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          activeOpacity={0.7}
        >
          <Feather name="download" size={16} color="#C0282A" />
          <Text style={styles.downloadText}>Download ID Card</Text>
        </TouchableOpacity>

        <Text style={styles.gateNote}>Show this ID at school gate</Text>

        <View style={styles.infoBox}>
          <Feather name="info" size={14} color="#8B6010" />
          <Text style={styles.infoText}>
            This digital ID is valid within the school premises. For a physical card, contact the school office.
          </Text>
        </View>
      </ScrollView>
    </View>
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
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 20,
  },
  cardTop: {
    backgroundColor: "#C0282A",
    padding: 20,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -30,
    right: -20,
  },
  circle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -20,
    left: 60,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shieldIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  schoolNameSmall: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.8,
    lineHeight: 14,
  },
  schoolLocation: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 3,
  },
  cardMiddle: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#F8EBEB",
    borderWidth: 3,
    borderColor: "#C0282A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "700",
    color: "#C0282A",
  },
  studentName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
    textAlign: "center",
  },
  studentClass: {
    fontSize: 14,
    color: "#555550",
    marginBottom: 4,
  },
  studentId: {
    fontSize: 12,
    color: "#888882",
    letterSpacing: 0.8,
  },
  divider: {
    width: "100%",
    height: 0.5,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 16,
  },
  detailsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  detailCell: {
    width: "50%",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#888882",
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  cardBottom: {
    backgroundColor: "#F8EBEB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  validText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#C0282A",
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#C0282A",
    marginBottom: 12,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C0282A",
  },
  gateNote: {
    fontSize: 12,
    color: "#888882",
    marginBottom: 20,
    textAlign: "center",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    width: "100%",
    backgroundColor: "#FFF8EC",
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#8B6010",
    lineHeight: 18,
  },
});
