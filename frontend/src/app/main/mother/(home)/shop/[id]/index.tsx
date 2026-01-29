import { useProductDetail, useLikeProductMutation, useUnlikeProductMutation } from "@/src/shared/hooks/useProducts";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import utils from "@/src/shared/utils";
import useCartStore from "@/src/shared/cartStore";
import { Image } from "expo-image";

const COLOR_OPTIONS = ["White", "Brown"] as const;

export default function MotherProductDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id || "0", 10);

  const { data: product, isLoading, error } = useProductDetail(productId);
  const { mutate: likeProduct, isPending: isLiking } = useLikeProductMutation();
  const { mutate: unlikeProduct, isPending: isUnliking } = useUnlikeProductMutation();

  const addItem = useCartStore((s) => s.addItem);
  const totalItems = useCartStore((s) => s.getTotalItems());

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<(typeof COLOR_OPTIONS)[number]>("White");
  const [qty, setQty] = useState(1);

  const priceStr = useMemo(() => {
    if (!product) return "";
    return utils.centsToDollarStr(product.price_cents);
  }, [product]);

  const handleToggleLike = (): void => {
    if (!product) return;
    if (product.is_liked) {
      unlikeProduct(productId);
    } else {
      likeProduct(productId);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      priceCents: product.price_cents,
      imgUrl: product.img_url,
      color: selectedColor,
      quantity: qty,
    });
    setShowAddModal(false);
    setQty(1);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load product details</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {product.name}
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleToggleLike}
              disabled={isLiking || isUnliking}
              activeOpacity={0.8}
            >
              <Ionicons name={product.is_liked ? "heart" : "heart-outline"} size={24} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => router.push("/main/mother/(home)/shop/cart" as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={24} color={colors.text} />
              {totalItems > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalItems}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.img_url ? (
            <Image source={{ uri: product.img_url }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={60} color={colors.tabIcon} />
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{product.category.label}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.priceValue}>${priceStr}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.descriptionValue}>{product.description}</Text>
          </View>

          <TouchableOpacity style={styles.addToCartButton} onPress={() => setShowAddModal(true)} activeOpacity={0.9}>
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add-to-cart modal (variants + quantity) */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={modalStyles.overlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={modalStyles.sheet} onPress={() => {}}>
            <TouchableOpacity style={modalStyles.close} onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={modalStyles.rowTop}>
              {product.img_url ? (
                <Image source={{ uri: product.img_url }} style={modalStyles.thumb} />
              ) : (
                <View style={[modalStyles.thumb, { alignItems: "center", justifyContent: "center" }]}>
                  <Ionicons name="image-outline" size={24} color={colors.tabIcon} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.name} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={modalStyles.price}>${priceStr}</Text>
              </View>
            </View>

            <Text style={modalStyles.sectionTitle}>Color</Text>
            <View style={modalStyles.pillsRow}>
              {COLOR_OPTIONS.map((c) => {
                const active = c === selectedColor;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[modalStyles.pill, active && modalStyles.pillActive]}
                    onPress={() => setSelectedColor(c)}
                    activeOpacity={0.85}
                  >
                    <Text style={[modalStyles.pillText, active && modalStyles.pillTextActive]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={modalStyles.qtyRow}>
              <Text style={modalStyles.sectionTitle}>Quantity</Text>
              <View style={modalStyles.stepper}>
                <TouchableOpacity
                  style={[modalStyles.stepperBtn, qty <= 1 && { opacity: 0.5 }]}
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  <Ionicons name="remove" size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={modalStyles.qtyText}>{qty}</Text>
                <TouchableOpacity style={modalStyles.stepperBtn} onPress={() => setQty((q) => q + 1)}>
                  <Ionicons name="add" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={modalStyles.cta} onPress={handleAddToCart} activeOpacity={0.9}>
              <Text style={modalStyles.ctaText}>Add to Cart</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: sizes.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: sizes.xl,
  },
  errorText: {
    fontSize: font.l,
    color: colors.text,
    textAlign: "center",
    marginBottom: sizes.l,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: sizes.m,
    paddingHorizontal: sizes.xl,
    borderRadius: sizes.borderRadius,
  },
  backButtonText: {
    color: colors.white,
    fontSize: font.m,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
  },
  iconButton: {
    padding: sizes.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: font.l,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: sizes.s,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.s,
  },
  cartButton: {
    padding: sizes.xs,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  imageContainer: {
    width: "100%",
    height: 320,
    backgroundColor: colors.white,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.inputFieldBackground,
  },
  detailsCard: {
    backgroundColor: colors.white,
    marginTop: sizes.l,
    marginHorizontal: sizes.l,
    borderRadius: sizes.borderRadius * 2,
    padding: sizes.xl,
    ...shadows.medium,
  },
  detailSection: {
    marginBottom: sizes.l,
  },
  detailLabel: {
    fontSize: font.m,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.xs,
  },
  detailValue: {
    fontSize: font.s,
    color: colors.text,
  },
  priceValue: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "800",
  },
  descriptionValue: {
    fontSize: font.s,
    color: colors.text,
    lineHeight: font.l,
  },
  addToCartButton: {
    marginTop: sizes.l,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingVertical: sizes.m,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  addToCartText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "900",
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: sizes.borderRadius * 2,
    borderTopRightRadius: sizes.borderRadius * 2,
    padding: sizes.l,
    ...shadows.medium,
  },
  close: {
    position: "absolute",
    right: sizes.l,
    top: sizes.l,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  rowTop: {
    flexDirection: "row",
    gap: sizes.m,
    paddingTop: sizes.m,
    paddingRight: 44,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: sizes.borderRadius,
    backgroundColor: colors.lightGray,
  },
  name: {
    fontSize: font.s,
    fontWeight: "900",
    color: colors.text,
  },
  price: {
    marginTop: 4,
    fontSize: font.s,
    fontWeight: "800",
    color: colors.text,
  },
  sectionTitle: {
    marginTop: sizes.l,
    marginBottom: sizes.s,
    fontSize: font.s,
    fontWeight: "900",
    color: colors.text,
  },
  pillsRow: {
    flexDirection: "row",
    gap: sizes.s,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
  },
  pillText: {
    fontSize: font.xs,
    fontWeight: "800",
    color: colors.text,
  },
  pillTextActive: {
    color: colors.text,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    width: 44,
    textAlign: "center",
    fontSize: font.s,
    fontWeight: "900",
    color: colors.text,
  },
  cta: {
    marginTop: sizes.l,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingVertical: sizes.m,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: font.s,
    fontWeight: "900",
    color: colors.text,
  },
});
