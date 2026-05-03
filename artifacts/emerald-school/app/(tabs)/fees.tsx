import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeeHistoryRow } from "@/components/FeeHistoryRow";
import { FEES } from "@/data/mockData";

export default function FeesPage() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const overdueAmount = FEES.filter((f) => f.status === "overdue" || f.status === "pending")
    .reduce((s, f) => s + f.amount, 0);
  const paidAmount = FEES.filter((f) => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  const overdueItem = FEES.find((f) => f.status === "overdue");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F4F2" }}
      contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <Text style={styles.headerTitle}>Fees</Text>
        <Text style={styles.headerSub}>2024–25 Academic Year</Text>
      </View>

      {overdueItem && (
        <View style={styles.dueAlert}>
          <View style={styles.dueAlertIcon}>
            <Feather name="alert-circle" size={18} color="#C0282A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dueAlertTitle}>Payment Due</Text>
            <Text style={styles.dueAlertBody}>
              ₹{overdueAmount.toLocaleString("en-IN")} due by {overdueItem.dueDate}
            </Text>
          </View>
          <TouchableOpacity style={styles.payBtn} activeOpacity={0.8}>
            <Text style={styles.payBtnText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryValue, { color: "#27500A" }]}>
            ₹{paidAmount.toLocaleString("en-IN")}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Outstanding</Text>
          <Text style={[styles.summaryValue, { color: overdueAmount > 0 ? "#C0282A" : "#27500A" }]}>
            ₹{overdueAmount.toLocaleString("en-IN")}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>FEE STRUCTURE — 2024-25</Text>
      <View style={styles.structureCard}>
        <View style={styles.structureRow}>
          <Text style={styles.structureItem}>Quarterly Fee (×3)</Text>
          <Text style={styles.structureAmount}>₹55,500</Text>
        </View>
        <View style={styles.structureDivider} />
        <View style={styles.structureRow}>
          <Text style={styles.structureItem}>Annual Fee</Text>
          <Text style={styles.structureAmount}>₹5,000</Text>
        </View>
        <View style={styles.structureDivider} />
        <View style={styles.structureRow}>
          <Text style={[styles.structureItem, { fontWeight: "700", color: "#1A1A1A" }]}>
            Total Annual
          </Text>
          <Text style={[styles.structureAmount, { fontWeight: "700", color: "#C0282A" }]}>
            ₹60,500
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>PAYMENT HISTORY</Text>
      <View style={styles.historyCard}>
        {FEES.map((fee, i) => (
          <FeeHistoryRow key={fee.id} fee={fee} showBorder={i < FEES.length - 1} />
        ))}
      </View>

      <View style={styles.noteBox}>
        <Feather name="info" size={14} color="#8B6010" />
        <Text style={styles.noteText}>
          For fee-related queries, contact the school office at{" "}
          <Text style={{ fontWeight: "600" }}>+91 98765 43210</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#C0282A",
    paddingHorizontal: 20,
    paddingBottom: 22,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -40,
    right: -30,
  },
  circle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: -20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  dueAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8EBEB",
    borderRadius: 14,
    margin: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(192,40,42,0.2)",
  },
  dueAlertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  dueAlertTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B1A1B",
  },
  dueAlertBody: {
    fontSize: 12,
    color: "#C0282A",
    marginTop: 2,
  },
  payBtn: {
    backgroundColor: "#C0282A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 4,
  },
  summaryCard: {
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
  summaryLabel: {
    fontSize: 11,
    color: "#888882",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888882",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  structureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  structureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  structureDivider: {
    height: 0.5,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 16,
  },
  structureItem: {
    fontSize: 14,
    color: "#555550",
    fontWeight: "500",
  },
  structureAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    margin: 16,
    padding: 14,
    backgroundColor: "#FFF8EC",
    borderRadius: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: "#8B6010",
    lineHeight: 18,
  },
});
