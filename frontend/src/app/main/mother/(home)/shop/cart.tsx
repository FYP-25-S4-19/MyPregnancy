import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { colors, sizes, font, shadows } from "@/src/shared/designSystem";
import useCartStore, { CartItem } from "@/src/shared/cartStore";
import utils from "@/src/shared/utils";

export default function CartScreen() {
  const itemsMap = useCartStore((s) => s.items);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotalCents = useCartStore((s) => s.getSubtotalCents());

  const items = Object.values(itemsMap);

  const onCheckout = () => {
    if (items.length === 0) {
      Alert.alert("Cart is empty", "Add some items before checkout.");
      return;
    }
    router.push("/main/mother/(home)/shop/checkout");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CART</Text>
        <View style={{ width: 36 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cart-outline" size={56} color={colors.tabIcon} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace("/main/mother/(home)/shop" as any)}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>Go to Shop</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <CartRow
                item={item}
                onMinus={() => decrement(item.key)}
                onPlus={() => increment(item.key)}
                onRemove={() => removeItem(item.key)}
              />
            )}
          />

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${utils.centsToDollarStr(subtotalCents)}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckout} activeOpacity={0.9}>
              <Text style={styles.checkoutBtnText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function CartRow({
  item,
  onMinus,
  onPlus,
  onRemove,
}: {
  item: CartItem;
  onMinus: () => void;
  onPlus: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      {item.imgUrl ? (
        <Image source={{ uri: item.imgUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={24} color={colors.tabIcon} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {item.color ? <Text style={styles.meta}>Color: {item.color}</Text> : null}
        <Text style={styles.price}>${utils.centsToDollarStr(item.priceCents)}</Text>

        <View style={styles.rowBottom}>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepperBtn, item.quantity <= 1 && { opacity: 0.5 }]}
              onPress={onMinus}
              disabled={item.quantity <= 1}
            >
              <Ionicons name="remove" size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity style={styles.stepperBtn} onPress={onPlus}>
              <Ionicons name="add" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.removeBtn} onPress={onRemove} activeOpacity={0.85}>
            <Ionicons name="trash-outline" size={18} color={colors.primary} />
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  listContent: {
    paddingHorizontal: sizes.l,
    paddingBottom: sizes.l,
  },
  card: {
    flexDirection: "row",
    gap: sizes.m,
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius * 2,
    padding: sizes.m,
    marginBottom: sizes.m,
    ...shadows.small,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: sizes.borderRadius,
    backgroundColor: colors.lightGray,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputFieldBackground,
  },
  name: {
    fontSize: font.s,
    fontWeight: "800",
    color: colors.text,
  },
  meta: {
    marginTop: 4,
    fontSize: font.xs,
    color: colors.tabIcon,
    fontWeight: "600",
  },
  price: {
    marginTop: 6,
    fontSize: font.s,
    fontWeight: "800",
    color: colors.text,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: sizes.m,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 999,
    overflow: "hidden",
  },
  stepperBtn: {
    width: 34,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    width: 38,
    textAlign: "center",
    fontSize: font.s,
    fontWeight: "800",
    color: colors.text,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: sizes.s,
    paddingVertical: 6,
  },
  removeText: {
    fontSize: font.xs,
    fontWeight: "800",
    color: colors.primary,
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: sizes.l,
    paddingTop: sizes.m,
    paddingBottom: sizes.l,
    borderTopLeftRadius: sizes.borderRadius * 2,
    borderTopRightRadius: sizes.borderRadius * 2,
    ...shadows.medium,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: sizes.m,
  },
  totalLabel: {
    fontSize: font.m,
    fontWeight: "800",
    color: colors.text,
  },
  totalValue: {
    fontSize: font.m,
    fontWeight: "900",
    color: colors.text,
  },
  checkoutBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingVertical: sizes.m,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutBtnText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "900",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: sizes.xl,
    gap: sizes.m,
  },
  emptyTitle: {
    fontSize: font.m,
    fontWeight: "800",
    color: colors.text,
  },
  primaryBtn: {
    marginTop: sizes.s,
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
