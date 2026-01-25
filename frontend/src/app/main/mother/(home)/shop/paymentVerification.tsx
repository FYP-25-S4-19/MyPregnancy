import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { router } from "expo-router";

import { colors, sizes, font } from "@/src/shared/designSystem";
import useCartStore from "@/src/shared/cartStore";

export default function PaymentVerificationScreen() {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    const t = setTimeout(() => {
      // Fake success
      clearCart();
      router.replace("/main/mother/(home)/shop/paymentStatus" as any);
    }, 1400);

    return () => clearTimeout(t);
  }, [clearCart]);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={28} color={colors.veryLightPink} />
        <Text style={styles.headerTitle}>Payment Verification</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Verifying payment…</Text>
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
    fontWeight: "800",
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: sizes.m,
  },
  text: {
    color: colors.tabIcon,
    fontSize: font.s,
    fontWeight: "700",
  },
});
