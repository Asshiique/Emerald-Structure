import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FeeRecord } from "@/data/mockData";

interface FeeHistoryRowProps {
  fee: FeeRecord;
  showBorder?: boolean;
}

export function FeeHistoryRow({ fee, showBorder = true }: FeeHistoryRowProps) {
  const isPaid = fee.status === "paid";
  const isOverdue = fee.status === "overdue";

  return (
    <View style={[styles.row, showBorder && styles.border]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.quarter}>{fee.quarter}</Text>
        <Text style={styles.sub}>
          {isPaid ? `Paid on ${fee.paidOn}` : isOverdue ? `Due ${fee.dueDate}` : `Due ${fee.dueDate}`}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.amount}>₹{fee.amount.toLocaleString("en-IN")}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: isPaid ? "#EAF3DE" : isOverdue ? "#F8EBEB" : "#FFF8EC" },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isPaid ? "#27500A" : isOverdue ? "#C0282A" : "#8B6010" },
            ]}
          >
            {isPaid ? "Paid" : isOverdue ? "Overdue" : "Pending"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  border: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  quarter: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  sub: {
    fontSize: 11,
    color: "#888882",
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
