import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { colors, sizes, font, shadows } from "@/src/shared/designSystem";

export default function PaymentStatusScreen() {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment Status</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={56} color={colors.white} />
        </View>
        <Text style={styles.bigText}>Congratulations</Text>
        <Text style={styles.subText}>Your payment is successfully</Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace("/main/mother/(home)/shop" as any)}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },
  header: {
    paddingHorizontal: sizes.l,
    paddingVertical: sizes.l,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: font.l,
    fontWeight: "900",
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: sizes.xl,
    gap: sizes.m,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bigText: {
    fontSize: font.xxl,
    fontWeight: "900",
    color: colors.primary,
    marginTop: sizes.m,
  },
  subText: {
    fontSize: font.s,
    fontWeight: "800",
    color: colors.text,
  },
  primaryBtn: {
    marginTop: sizes.l,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingVertical: sizes.m,
    paddingHorizontal: sizes.xl,
    ...shadows.small,
  },
  primaryBtnText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "900",
  },
});
