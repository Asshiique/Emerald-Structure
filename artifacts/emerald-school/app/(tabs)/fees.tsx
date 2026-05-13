import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, Image, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { formatINR, getQrUrl, getUpiLink, UPI_ID, FEE_STRUCTURE_LABELS } from "@/lib/feeUtils";

export default function FeesPage() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { user } = useAuth();
  const { data } = useData();

  // Find all students belonging to this parent
  const myStudents = data.students.filter(
    (s) => s.parentEmail.toLowerCase() === (user?.email ?? "").toLowerCase()
  );
  const myFees = data.fees.filter(
    (f) => f.parentEmail.toLowerCase() === (user?.email ?? "").toLowerCase()
  );

  const totalFee = myFees.reduce((s, f) => s + f.totalFee, 0);
  const totalPaid = myFees.reduce((s, f) => s + f.paidAmount, 0);
  const totalPending = myFees.reduce((s, f) => s + f.pendingAmount, 0);

  const handlePayNow = () => {
    const link = getUpiLink(totalPending > 0 ? totalPending : undefined);
    Linking.openURL(link).catch(() =>
      Alert.alert("No UPI App Found", "Please install a UPI app (PhonePe, GPay, Paytm) or scan the QR code above.")
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F4F2" }}
      contentContainerStyle={{ paddingBottom: (isWeb ? 34 : insets.bottom) + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: (isWeb ? 67 : insets.top) + 16 }]}>
        <View style={s.circle1} /><View style={s.circle2} />
        <Text style={s.headerTitle}>Fees</Text>
        <Text style={s.headerSub}>Academic Year 2025–26</Text>
      </View>

      {/* Summary cards */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { borderLeftColor: "#C0282A" }]}>
          <Text style={s.summaryLabel}>Total Fee</Text>
          <Text style={[s.summaryValue, { color: "#1A1A1A" }]}>{formatINR(totalFee)}</Text>
        </View>
        <View style={[s.summaryCard, { borderLeftColor: "#27AE60" }]}>
          <Text style={s.summaryLabel}>Paid</Text>
          <Text style={[s.summaryValue, { color: "#27AE60" }]}>{formatINR(totalPaid)}</Text>
        </View>
        <View style={[s.summaryCard, { borderLeftColor: totalPending > 0 ? "#E67E22" : "#27AE60" }]}>
          <Text style={s.summaryLabel}>Pending</Text>
          <Text style={[s.summaryValue, { color: totalPending > 0 ? "#C0282A" : "#27AE60" }]}>{formatINR(totalPending)}</Text>
        </View>
      </View>

      {/* Progress bar */}
      {totalFee > 0 && (
        <View style={s.progressWrap}>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${Math.min(100, (totalPaid / totalFee) * 100)}%` as any }]} />
          </View>
          <Text style={s.progressLabel}>{Math.round((totalPaid / totalFee) * 100)}% paid</Text>
        </View>
      )}

      {/* UPI QR Payment Card */}
      <Text style={s.sectionLabel}>PAY VIA UPI</Text>
      <View style={s.qrCard}>
        <Text style={s.qrTitle}>Scan & Pay</Text>
        <Text style={s.qrSub}>Indian Bank • BHIM UPI</Text>
        <Image
          source={{ uri: getQrUrl(220) }}
          style={s.qrImage}
          resizeMode="contain"
        />
        <View style={s.upiIdRow}>
          <Feather name="link" size={13} color="#555550" />
          <Text style={s.upiIdText}>{UPI_ID}</Text>
        </View>
        <TouchableOpacity style={s.payBtn} onPress={handlePayNow} activeOpacity={0.85}>
          <Feather name="smartphone" size={15} color="#FFFFFF" />
          <Text style={s.payBtnText}>Open UPI App</Text>
        </TouchableOpacity>
        <Text style={s.qrNote}>
          After payment, please share the transaction screenshot with the school office.
          The office will update your payment record.
        </Text>
      </View>

      {/* Per-student fee breakdown */}
      {myFees.map((fee) => (
        <StudentFeeCard key={fee.studentId} fee={fee} />
      ))}

      {myFees.length === 0 && (
        <View style={s.emptyBox}>
          <Feather name="info" size={20} color="#888882" />
          <Text style={s.emptyText}>No fee records found. Contact school office.</Text>
        </View>
      )}

      {/* Fee Structure reference */}
      <Text style={s.sectionLabel}>FEE STRUCTURE 2025–26</Text>
      <View style={s.structCard}>
        {FEE_STRUCTURE_LABELS.map((row, i) => (
          <View key={row.label}>
            {i > 0 && <View style={s.divider} />}
            <View style={s.structRow}>
              <Text style={s.structLabel}>{row.label}</Text>
              <Text style={s.structAmt}>{formatINR(row.amount)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={s.noteBox}>
        <Feather name="phone" size={13} color="#8B6010" />
        <Text style={s.noteText}>
          For fee queries contact the school office:{" "}
          <Text style={{ fontWeight: "700" }}>+91 6238960292</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

function StudentFeeCard({ fee }: { fee: import("@/context/DataContext").FeeRecord }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={s.feeCard}>
      <TouchableOpacity style={s.feeCardHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={{ flex: 1 }}>
          <Text style={s.feeCardName}>{fee.studentName}</Text>
          <Text style={s.feeCardClass}>Class {fee.classSection}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <View style={[s.statusChip, { backgroundColor: fee.pendingAmount > 0 ? "#F8EBEB" : "#E8F7EE" }]}>
            <Text style={[s.statusText, { color: fee.pendingAmount > 0 ? "#C0282A" : "#27AE60" }]}>
              {fee.pendingAmount > 0 ? `${formatINR(fee.pendingAmount)} due` : "Fully Paid"}
            </Text>
          </View>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#888882" />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={s.divider} />
          {[
            { label: "Course Fee", amount: fee.courseFee },
            ...(fee.busFee > 0 ? [{ label: "Bus Fee", amount: fee.busFee }] : []),
            ...fee.otherFees.map((f) => ({ label: f.label, amount: f.amount })),
          ].map((row) => (
            <View key={row.label} style={s.breakdownRow}>
              <Text style={s.breakdownLabel}>{row.label}</Text>
              <Text style={s.breakdownAmt}>{formatINR(row.amount)}</Text>
            </View>
          ))}
          <View style={[s.divider, { marginVertical: 8 }]} />
          <View style={s.breakdownRow}>
            <Text style={[s.breakdownLabel, { fontWeight: "700", color: "#1A1A1A" }]}>Total Fee</Text>
            <Text style={[s.breakdownAmt, { fontWeight: "700" }]}>{formatINR(fee.totalFee)}</Text>
          </View>
          <View style={s.breakdownRow}>
            <Text style={[s.breakdownLabel, { color: "#27AE60" }]}>Paid</Text>
            <Text style={[s.breakdownAmt, { color: "#27AE60" }]}>{formatINR(fee.paidAmount)}</Text>
          </View>

          {fee.payments.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { paddingHorizontal: 0, paddingTop: 12 }]}>PAYMENT HISTORY</Text>
              {[...fee.payments].reverse().map((p) => (
                <View key={p.id} style={s.payHistRow}>
                  <View style={s.payHistIcon}><Feather name="check-circle" size={14} color="#27AE60" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.payHistAmt}>{formatINR(p.amount)}</Text>
                    <Text style={s.payHistMeta}>{p.date}{p.note ? ` • ${p.note}` : ""}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: "#C0282A", paddingHorizontal: 20, paddingBottom: 22, overflow: "hidden" },
  circle1: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.06)", top: -40, right: -30 },
  circle2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: -20 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  summaryRow: { flexDirection: "row", padding: 16, gap: 8 },
  summaryCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, borderLeftWidth: 3, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  summaryLabel: { fontSize: 10, color: "#888882", marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: "700" },
  progressWrap: { paddingHorizontal: 16, marginBottom: 4, flexDirection: "row", alignItems: "center", gap: 10 },
  progressBg: { flex: 1, height: 6, backgroundColor: "#E0E0DC", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: "#27AE60", borderRadius: 3 },
  progressLabel: { fontSize: 11, color: "#888882", width: 55 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.8, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  qrCard: { backgroundColor: "#FFFFFF", borderRadius: 16, marginHorizontal: 16, padding: 20, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, marginBottom: 16 },
  qrTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  qrSub: { fontSize: 12, color: "#888882", marginTop: 2, marginBottom: 14 },
  qrImage: { width: 220, height: 220, borderRadius: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  upiIdRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  upiIdText: { fontSize: 13, color: "#555550", fontWeight: "500" },
  payBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#C0282A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 14 },
  payBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  qrNote: { fontSize: 11, color: "#888882", textAlign: "center", marginTop: 12, lineHeight: 16 },
  feeCard: { backgroundColor: "#FFFFFF", borderRadius: 14, marginHorizontal: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  feeCardHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
  feeCardName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  feeCardClass: { fontSize: 12, color: "#888882", marginTop: 2 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "600" },
  divider: { height: 0.5, backgroundColor: "rgba(0,0,0,0.08)", marginHorizontal: 0, marginVertical: 4 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  breakdownLabel: { fontSize: 13, color: "#555550" },
  breakdownAmt: { fontSize: 13, color: "#1A1A1A", fontWeight: "500" },
  payHistRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  payHistIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#E8F7EE", alignItems: "center", justifyContent: "center" },
  payHistAmt: { fontSize: 13, fontWeight: "700", color: "#1A1A1A" },
  payHistMeta: { fontSize: 11, color: "#888882", marginTop: 1 },
  structCard: { backgroundColor: "#FFFFFF", borderRadius: 14, marginHorizontal: 16, paddingVertical: 4, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  structRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 },
  structLabel: { fontSize: 14, color: "#555550" },
  structAmt: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, margin: 16, padding: 14, backgroundColor: "#FFF8EC", borderRadius: 12 },
  noteText: { flex: 1, fontSize: 12, color: "#8B6010", lineHeight: 18 },
  emptyBox: { alignItems: "center", padding: 32, gap: 10 },
  emptyText: { fontSize: 14, color: "#888882", textAlign: "center" },
});
