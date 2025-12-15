import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";

interface JournalData {
  bloodPressure: { systolic: number; diastolic: number } | null;
  sugarLevel: number | null;
  heartRate: number | null;
  weight: number | null;
  kickCounter: number | null;
}

interface JournalCardProps {
  data: JournalData;
  onEdit?: () => void;
}

export default function JournalCardViewOnly({ data, onEdit }: JournalCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Journal</Text>
          <Text style={styles.subtitle}>Tap to write your daily journal!</Text>
        </View>
        {onEdit && (
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.metricsContainer}>
        <MetricRow
          label="Blood Pressure"
          value={data.bloodPressure ? `${data.bloodPressure.systolic} / ${data.bloodPressure.diastolic}` : ""}
          unit=""
        />
        <MetricRow label="Sugar Level" value={data.sugarLevel?.toString() || ""} unit="mmol/L" />
        <MetricRow label="Heart Rate" value={data.heartRate?.toString() || ""} unit="bpm" />
        <MetricRow label="Weight" value={data.weight?.toString() || ""} unit="kg" />
        <MetricRow label="Kick Counter" value={data.kickCounter?.toString() || ""} unit="kicks" />
      </View>
    </View>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  unit: string;
}

function MetricRow({ label, value, unit }: MetricRowProps) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>• {label}</Text>
      <View style={styles.metricValueContainer}>
        <View style={styles.valueBox}>
          <Text style={styles.metricValue}>{value}</Text>
        </View>
        <Text style={styles.metricUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.l,
    marginHorizontal: sizes.m,
    marginBottom: sizes.m,
    ...shadows.small,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: sizes.m,
  },
  title: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.xs,
  },
  subtitle: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.7,
  },
  editButton: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "500",
  },
  metricsContainer: {
    gap: sizes.s,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
  },
  metricValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.s,
  },
  valueBox: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: sizes.xs,
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.xs,
    minWidth: 60,
  },
  metricValue: {
    fontSize: font.s,
    color: colors.text,
    textAlign: "center",
  },
  metricUnit: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
    minWidth: 50,
  },
});
