import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";
import React from "react";

interface PendingRequestsCardProps {
  count: number;
  onPress?: () => void;
}

export default function PendingRequestsCard({ count, onPress }: PendingRequestsCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={styles.title}>Pending Requests</Text>
      <Text style={styles.count}>{count}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.m,
    marginHorizontal: sizes.m,
    marginBottom: sizes.m,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...shadows.small,
  },
  title: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
  },
  count: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
  },
});
