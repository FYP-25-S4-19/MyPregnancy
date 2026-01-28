import { Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";

interface PendingRequestsCardProps {
  count: number;
  onPress?: () => void;
  isLoading?: boolean;
}

export default function PendingRequestsCard({ count, onPress, isLoading = false }: PendingRequestsCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress || isLoading}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.title}>Pending Requests</Text>
      {isLoading ? <ActivityIndicator size="small" color={colors.text} /> : <Text style={styles.count}>{count}</Text>}
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
