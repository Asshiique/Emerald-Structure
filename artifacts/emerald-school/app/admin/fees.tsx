import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert, Modal, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import type { FeeRecord } from "@/context/DataContext";
import { formatINR, getCourseFee } from "@/lib/feeUtils";
import { useRoleGuard } from "@/hooks/useRoleGuard";

type FilterType = "all" | "pending" | "paid";

export default function AdminFeesPage() {
  useRoleGuard(["admin", "teacher"]);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { user } = useAuth();
  const { data, initStudentFee, recordFeePayment, setStudentBusFee, addStudentOtherFee, removeStudentOtherFee } = useData();

  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FeeRecord | null>(null);

  // For teachers: only show their class students
  const isTeacher = user?.role === "teacher";
  const mySection = user?.classSection ?? "";

  const students = data.students.filter((s) =>
    isTeacher ? s.classSection === mySection : true
  );

  // Students without a fee record (can be initialized)
  const uninitialized = students.filter((s) => !data.fees.find((f) => f.studentId === s.id));

  let fees = data.fees.filter((f) =>
    isTeacher ? f.classSection === mySection : true
  );

  if (search.trim()) {
    const q = search.toLowerCase();
    fees = fees.filter((f) =>
      f.studentName.toLowerCase().includes(q) ||
      f.classSection.toLowerCase().includes(q) ||
      f.parentName.toLowerCase().includes(q)
    );
  }
  if (filter === "pending") fees = fees.filter((f) => f.pendingAmount > 0);
  if (filter === "paid")    fees = fees.filter((f) => f.pendingAmount <= 0);

  const totalCollected = fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalPending   = fees.reduce((s, f) => s + f.pendingAmount, 0);

  const handleInit = async (studentId: string) => {
    const student = data.students.find((s) => s.id === studentId);
    if (!student) return;
    await initStudentFee(student);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[s.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Fee Management</Text>
          <Text style={s.headerSub}>{isTeacher ? `Class ${mySection}` : "All Classes"}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatCard label="Collected" value={formatINR(totalCollected)} color="#27AE60" />
        <StatCard label="Pending" value={formatINR(totalPending)} color={totalPending > 0 ? "#C0282A" : "#27AE60"} />
        <StatCard label="Students" value={String(fees.length)} color="#2980B9" />
      </View>

      {/* Search + Filter */}
      <View style={s.searchRow}>
        <Feather name="search" size={15} color="#888882" />
        <TextInput
          style={s.searchInput}
          placeholder="Search student or class…"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#AAAAAA"
        />
      </View>
      <View style={s.filterRow}>
        {(["all", "pending", "paid"] as FilterType[]).map((f) => (
          <TouchableOpacity key={f} style={[s.filterChip, filter === f && s.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Uninitialized students */}
        {uninitialized.length > 0 && (
          <View style={s.uninitCard}>
            <Feather name="alert-triangle" size={14} color="#8B6010" />
            <View style={{ flex: 1 }}>
              <Text style={s.uninitTitle}>{uninitialized.length} student(s) have no fee record</Text>
              {uninitialized.map((st) => (
                <TouchableOpacity key={st.id} style={s.uninitRow} onPress={() => handleInit(st.id)}>
                  <Text style={s.uninitName}>{st.name} ({st.classSection})</Text>
                  <Text style={s.uninitAction}>Initialize ₹{getCourseFee(st.classSection).toLocaleString("en-IN")}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {fees.map((fee) => (
          <FeeRow key={fee.studentId} fee={fee} onManage={() => setSelected(fee)} />
        ))}

        {fees.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 40, gap: 8 }}>
            <Feather name="inbox" size={32} color="#CCCCCC" />
            <Text style={{ color: "#888882", fontSize: 14 }}>No records found</Text>
          </View>
        )}
      </ScrollView>

      {/* Management Modal */}
      {selected && (
        <FeeManageModal
          fee={selected}
          staffName={user?.name ?? "Admin"}
          onClose={() => setSelected(null)}
          onRecordPayment={recordFeePayment}
          onSetBusFee={setStudentBusFee}
          onAddOtherFee={addStudentOtherFee}
          onRemoveOtherFee={removeStudentOtherFee}
        />
      )}
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function FeeRow({ fee, onManage }: { fee: FeeRecord; onManage: () => void }) {
  const pct = fee.totalFee > 0 ? (fee.paidAmount / fee.totalFee) * 100 : 0;
  return (
    <TouchableOpacity style={s.feeRow} onPress={onManage} activeOpacity={0.85}>
      <View style={{ flex: 1 }}>
        <Text style={s.feeRowName}>{fee.studentName}</Text>
        <Text style={s.feeRowMeta}>{fee.classSection} • {fee.parentName}</Text>
        <View style={s.miniBarBg}>
          <View style={[s.miniBarFill, { width: `${Math.min(100, pct)}%` as any }]} />
        </View>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View style={[s.chip, { backgroundColor: fee.pendingAmount > 0 ? "#F8EBEB" : "#E8F7EE" }]}>
          <Text style={[s.chipText, { color: fee.pendingAmount > 0 ? "#C0282A" : "#27AE60" }]}>
            {fee.pendingAmount > 0 ? `${formatINR(fee.pendingAmount)} due` : "Paid ✓"}
          </Text>
        </View>
        <Text style={s.feeRowTotal}>Total {formatINR(fee.totalFee)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function FeeManageModal({
  fee, staffName, onClose, onRecordPayment, onSetBusFee, onAddOtherFee, onRemoveOtherFee,
}: {
  fee: FeeRecord;
  staffName: string;
  onClose: () => void;
  onRecordPayment: (id: string, amt: number, note: string, by: string) => Promise<void>;
  onSetBusFee: (id: string, amt: number) => Promise<void>;
  onAddOtherFee: (id: string, label: string, amt: number) => Promise<void>;
  onRemoveOtherFee: (id: string, feeId: string) => Promise<void>;
}) {
  const [payAmt, setPayAmt] = useState("");
  const [payNote, setPayNote] = useState("");
  const [busAmt, setBusAmt] = useState(String(fee.busFee || ""));
  const [otherLabel, setOtherLabel] = useState("");
  const [otherAmt, setOtherAmt] = useState("");
  const [saving, setSaving] = useState(false);

  const handle = async (fn: () => Promise<void>) => {
    setSaving(true);
    try { await fn(); } catch (e: any) { Alert.alert("Error", e.message); } finally { setSaving(false); }
  };

  const doPayment = () => {
    const amt = parseInt(payAmt);
    if (!amt || amt <= 0) return Alert.alert("Invalid", "Enter a valid amount.");
    if (amt > fee.pendingAmount) return Alert.alert("Overpayment", `Pending is only ${formatINR(fee.pendingAmount)}.`);
    handle(() => onRecordPayment(fee.studentId, amt, payNote, staffName).then(() => { setPayAmt(""); setPayNote(""); }));
  };

  const doBusFee = () => {
    const amt = parseInt(busAmt) || 0;
    handle(() => onSetBusFee(fee.studentId, amt));
  };

  const doOtherFee = () => {
    const amt = parseInt(otherAmt);
    if (!otherLabel.trim() || !amt || amt <= 0) return Alert.alert("Invalid", "Enter label and amount.");
    handle(() => onAddOtherFee(fee.studentId, otherLabel.trim(), amt).then(() => { setOtherLabel(""); setOtherAmt(""); }));
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
        {/* Modal Header */}
        <View style={m.header}>
          <View style={{ flex: 1 }}>
            <Text style={m.name}>{fee.studentName}</Text>
            <Text style={m.sub}>Class {fee.classSection} • {fee.parentName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={m.closeBtn}>
            <Feather name="x" size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
          {/* Fee Summary */}
          <View style={m.card}>
            <Text style={m.cardTitle}>FEE SUMMARY</Text>
            {[
              { label: "Course Fee", value: formatINR(fee.courseFee) },
              ...(fee.busFee > 0 ? [{ label: "Bus Fee", value: formatINR(fee.busFee) }] : []),
              ...fee.otherFees.map((f) => ({ label: f.label, value: formatINR(f.amount), id: f.id })),
            ].map((row: any) => (
              <View key={row.label} style={m.row}>
                <Text style={m.rowLabel}>{row.label}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={m.rowAmt}>{row.value}</Text>
                  {row.id && (
                    <TouchableOpacity onPress={() => handle(() => onRemoveOtherFee(fee.studentId, row.id))}>
                      <Feather name="trash-2" size={13} color="#C0282A" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            <View style={m.divider} />
            <View style={m.row}>
              <Text style={[m.rowLabel, { fontWeight: "700", color: "#1A1A1A" }]}>Total</Text>
              <Text style={[m.rowAmt, { fontWeight: "700" }]}>{formatINR(fee.totalFee)}</Text>
            </View>
            <View style={m.row}>
              <Text style={[m.rowLabel, { color: "#27AE60" }]}>Paid</Text>
              <Text style={[m.rowAmt, { color: "#27AE60" }]}>{formatINR(fee.paidAmount)}</Text>
            </View>
            <View style={m.row}>
              <Text style={[m.rowLabel, { color: fee.pendingAmount > 0 ? "#C0282A" : "#27AE60" }]}>Pending</Text>
              <Text style={[m.rowAmt, { color: fee.pendingAmount > 0 ? "#C0282A" : "#27AE60" }]}>{formatINR(fee.pendingAmount)}</Text>
            </View>
          </View>

          {/* Record Payment */}
          <View style={m.card}>
            <Text style={m.cardTitle}>RECORD PAYMENT</Text>
            <TextInput style={m.input} placeholder="Amount (₹)" value={payAmt} onChangeText={setPayAmt} keyboardType="numeric" placeholderTextColor="#AAAAAA" />
            <TextInput style={m.input} placeholder="Note (optional)" value={payNote} onChangeText={setPayNote} placeholderTextColor="#AAAAAA" />
            <TouchableOpacity style={m.btn} onPress={doPayment} disabled={saving}>
              <Feather name="check-circle" size={15} color="#FFF" />
              <Text style={m.btnText}>Record Payment</Text>
            </TouchableOpacity>
          </View>

          {/* Bus Fee */}
          <View style={m.card}>
            <Text style={m.cardTitle}>BUS FEE</Text>
            <TextInput style={m.input} placeholder="Bus fee amount (₹)" value={busAmt} onChangeText={setBusAmt} keyboardType="numeric" placeholderTextColor="#AAAAAA" />
            <TouchableOpacity style={[m.btn, { backgroundColor: "#2980B9" }]} onPress={doBusFee} disabled={saving}>
              <Feather name="navigation" size={15} color="#FFF" />
              <Text style={m.btnText}>Set Bus Fee</Text>
            </TouchableOpacity>
          </View>

          {/* Other Fee */}
          <View style={m.card}>
            <Text style={m.cardTitle}>ADD OTHER FEE</Text>
            <TextInput style={m.input} placeholder="Label (e.g. Exam Fee)" value={otherLabel} onChangeText={setOtherLabel} placeholderTextColor="#AAAAAA" />
            <TextInput style={m.input} placeholder="Amount (₹)" value={otherAmt} onChangeText={setOtherAmt} keyboardType="numeric" placeholderTextColor="#AAAAAA" />
            <TouchableOpacity style={[m.btn, { backgroundColor: "#8E44AD" }]} onPress={doOtherFee} disabled={saving}>
              <Feather name="plus-circle" size={15} color="#FFF" />
              <Text style={m.btnText}>Add Fee</Text>
            </TouchableOpacity>
          </View>

          {/* Payment History */}
          {fee.payments.length > 0 && (
            <View style={m.card}>
              <Text style={m.cardTitle}>PAYMENT HISTORY</Text>
              {[...fee.payments].reverse().map((p) => (
                <View key={p.id} style={m.histRow}>
                  <View style={m.histIcon}><Feather name="check" size={12} color="#27AE60" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={m.histAmt}>{formatINR(p.amount)}</Text>
                    <Text style={m.histMeta}>{p.date} • {p.recordedBy}{p.note ? ` • ${p.note}` : ""}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: "#C0282A", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 16, gap: 4 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  statsRow: { flexDirection: "row", padding: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  statLabel: { fontSize: 10, color: "#888882", marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: "700" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, marginHorizontal: 12, paddingHorizontal: 12, height: 42, gap: 8, elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A" },
  filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  filterChipActive: { backgroundColor: "#C0282A", borderColor: "#C0282A" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#888882" },
  filterTextActive: { color: "#FFFFFF" },
  feeRow: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  feeRowName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  feeRowMeta: { fontSize: 12, color: "#888882", marginTop: 2 },
  miniBarBg: { height: 4, backgroundColor: "#E0E0DC", borderRadius: 2, marginTop: 8, overflow: "hidden" },
  miniBarFill: { height: 4, backgroundColor: "#27AE60", borderRadius: 2 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipText: { fontSize: 11, fontWeight: "600" },
  feeRowTotal: { fontSize: 11, color: "#888882" },
  uninitCard: { backgroundColor: "#FFF8EC", borderRadius: 12, padding: 14, flexDirection: "row", gap: 10, borderWidth: 1, borderColor: "rgba(230,160,0,0.3)" },
  uninitTitle: { fontSize: 12, fontWeight: "700", color: "#8B6010", marginBottom: 6 },
  uninitRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  uninitName: { fontSize: 12, color: "#555550" },
  uninitAction: { fontSize: 12, fontWeight: "600", color: "#C0282A" },
});

const m = StyleSheet.create({
  header: { backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 24, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.08)" },
  name: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  sub: { fontSize: 12, color: "#888882", marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F5F4F2", alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { fontSize: 10, fontWeight: "700", color: "#888882", letterSpacing: 0.8, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  rowLabel: { fontSize: 13, color: "#555550" },
  rowAmt: { fontSize: 13, fontWeight: "500", color: "#1A1A1A" },
  divider: { height: 0.5, backgroundColor: "rgba(0,0,0,0.08)", marginVertical: 6 },
  input: { backgroundColor: "#F5F4F2", borderRadius: 10, height: 46, paddingHorizontal: 14, fontSize: 14, color: "#1A1A1A", marginBottom: 10 },
  btn: { backgroundColor: "#C0282A", borderRadius: 12, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  histRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  histIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#E8F7EE", alignItems: "center", justifyContent: "center" },
  histAmt: { fontSize: 13, fontWeight: "700", color: "#1A1A1A" },
  histMeta: { fontSize: 11, color: "#888882", marginTop: 1 },
});
