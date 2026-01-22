import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { router } from "expo-router";

import { colors, sizes, font, shadows } from "@/src/shared/designSystem";
import useCartStore from "@/src/shared/cartStore";
import utils from "@/src/shared/utils";

type PaymentMethod = "CARD" | "PAYNOW" | "GPAY";

export default function CheckoutScreen() {
  const items = useCartStore((s) => Object.values(s.items));
  const subtotalCents = useCartStore((s) => s.getSubtotalCents());

  const [address, setAddress] = useState("100 Clementi Rd, #01-01");
  const [postal, setPostal] = useState("234567");
  const [phone, setPhone] = useState("(+65) 98765432");

  const [method, setMethod] = useState<PaymentMethod>("CARD");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const shippingCents = 200;

  const totalCents = useMemo(() => subtotalCents + shippingCents, [subtotalCents]);

  const canPlaceOrder = useMemo(() => {
    if (items.length === 0) return false;
    if (!address.trim() || !postal.trim() || !phone.trim()) return false;

    if (method === "CARD") {
      if (!cardName.trim()) return false;
      if (!cardNumber.trim()) return false;
      if (!expiry.trim()) return false;
      if (!cvc.trim()) return false;
    }

    return true;
  }, [items.length, address, postal, phone, method, cardName, cardNumber, expiry, cvc]);

  const placeOrder = () => {
    if (!canPlaceOrder) {
      Alert.alert("Missing details", "Please fill in required fields.");
      return;
    }

    // Fake payment: go to verification screen, then success.
    router.push("/main/mother/(home)/shop/paymentVerification" as any);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Address */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Shipping Address</Text>
          </View>

          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Address"
            placeholderTextColor={colors.tabIcon}
            style={styles.input}
          />
          <View style={{ flexDirection: "row", gap: sizes.s }}>
            <TextInput
              value={postal}
              onChangeText={setPostal}
              placeholder="Postal"
              placeholderTextColor={colors.tabIcon}
              style={[styles.input, { flex: 1 }]}
              keyboardType="numeric"
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone"
              placeholderTextColor={colors.tabIcon}
              style={[styles.input, { flex: 1 }]}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Items summary */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="basket-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Items</Text>
          </View>
          <Text style={styles.summaryText}>Total {items.reduce((sum, i) => sum + i.quantity, 0)} item(s)</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push("/main/mother/(home)/shop/cart" as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.linkText}>View cart</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.tabIcon} />
          </TouchableOpacity>
        </View>

        {/* Payment methods */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="card-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Payment Methods</Text>
          </View>

          <View style={styles.methodRow}>
            <MethodPill label="Credit / Debit Card" active={method === "CARD"} onPress={() => setMethod("CARD")} />
            <MethodPill label="PAYNOW" active={method === "PAYNOW"} onPress={() => setMethod("PAYNOW")} />
            <MethodPill label="G Pay" active={method === "GPAY"} onPress={() => setMethod("GPAY")} />
          </View>

          {method === "CARD" ? (
            <View style={{ marginTop: sizes.m }}>
              <TextInput
                value={cardName}
                onChangeText={setCardName}
                placeholder="Cardholder's Name"
                placeholderTextColor={colors.tabIcon}
                style={styles.input}
              />
              <TextInput
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="Card Number"
                placeholderTextColor={colors.tabIcon}
                style={styles.input}
                keyboardType="number-pad"
              />
              <View style={{ flexDirection: "row", gap: sizes.s }}>
                <TextInput
                  value={expiry}
                  onChangeText={setExpiry}
                  placeholder="Expiry Date (MM/YY)"
                  placeholderTextColor={colors.tabIcon}
                  style={[styles.input, { flex: 1 }]}
                />
                <TextInput
                  value={cvc}
                  onChangeText={setCvc}
                  placeholder="CVC"
                  placeholderTextColor={colors.tabIcon}
                  style={[styles.input, { flex: 1 }]}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          ) : (
            <Text style={styles.summaryText}>This is a fake payment method for demo only.</Text>
          )}
        </View>

        {/* Totals */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>

          <Row label="Merchandise Subtotal" value={`$${utils.centsToDollarStr(subtotalCents)}`} />
          <Row label="Shipping Subtotal" value={`$${utils.centsToDollarStr(shippingCents)}`} />
          <Row label="Total Payment" value={`$${utils.centsToDollarStr(totalCents)}`} bold />
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, !canPlaceOrder && { opacity: 0.6 }]}
          onPress={placeOrder}
          disabled={!canPlaceOrder}
          activeOpacity={0.9}
        >
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MethodPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.methodPill, active && styles.methodPillActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.methodText, active && styles.methodTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, bold && { fontWeight: "900" }]}>{label}</Text>
      <Text style={[styles.totalValue, bold && { fontWeight: "900" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
  },
  iconButton: {
    padding: sizes.xs,
    width: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: font.l,
    fontWeight: "800",
    color: colors.text,
  },
  content: {
    paddingHorizontal: sizes.l,
    paddingBottom: sizes.xl,
    gap: sizes.m,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius * 2,
    padding: sizes.l,
    ...shadows.small,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.s,
    marginBottom: sizes.m,
  },
  cardTitle: {
    fontSize: font.s,
    fontWeight: "900",
    color: colors.text,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: sizes.borderRadius,
    paddingHorizontal: sizes.m,
    fontSize: font.xs,
    color: colors.text,
    backgroundColor: colors.white,
    marginBottom: sizes.s,
  },
  summaryText: {
    color: colors.tabIcon,
    fontSize: font.xs,
    fontWeight: "700",
  },
  linkRow: {
    marginTop: sizes.s,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  linkText: {
    color: colors.primary,
    fontSize: font.xs,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  methodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sizes.s,
  },
  methodPill: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  methodPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
  },
  methodText: {
    fontSize: font.xs,
    fontWeight: "800",
    color: colors.text,
  },
  methodTextActive: {
    color: colors.text,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: font.xs,
    fontWeight: "800",
    color: colors.text,
  },
  totalValue: {
    fontSize: font.xs,
    fontWeight: "800",
    color: colors.text,
  },
  placeOrderBtn: {
    marginTop: sizes.s,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingVertical: sizes.m,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  placeOrderText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "900",
  },
});
