import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { router } from "expo-router";

import { colors, sizes, font } from "@/src/shared/designSystem";
import { useProductCategories, useProductPreviews } from "@/src/shared/hooks/useProducts";
import { CategoryPills } from "@/src/components/CategoryPills";
import { ProductGrid } from "@/src/components/ProductGrid";
import useCartStore from "@/src/shared/cartStore";

export default function MotherShopScreen() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: productCategories } = useProductCategories();
  const { data: productPreviews, isLoading } = useProductPreviews(20);

  const totalItems = useCartStore((state) => state.getTotalItems());

  const products = useMemo(() => {
    const list = productPreviews?.products ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [productPreviews?.products, searchQuery]);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>SHOP</Text>

          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push("/main/mother/(home)/shop/cart" as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={26} color={colors.text} />
            {totalItems > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.tabIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            placeholderTextColor={colors.tabIcon}
            style={styles.searchInput}
          />
        </View>

        {/* Banner Image (optional) */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: "https://via.placeholder.com/900x300/f8c6cc/111111?text=Baby+Essentials" }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Category */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Category</Text>
            <Ionicons name="heart-outline" size={24} color={colors.text} />
          </View>

          {productCategories ? (
            <CategoryPills
              categories={productCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              showAllOption
            />
          ) : null}
        </View>

        {/* Products */}
        <View style={styles.productsContainer}>
          {isLoading ? <Text style={styles.loadingText}>Loading products…</Text> : null}
          {products.length > 0 ? (
            <ProductGrid
              products={products}
              selectedCategory={selectedCategory}
              onProductCardPress={(productId) =>
                router.push({ pathname: "/main/mother/(home)/shop/[id]", params: { id: String(productId) } } as any)
              }
            />
          ) : (
            <Text style={styles.emptyText}>No products found.</Text>
          )}
        </View>
      </ScrollView>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: sizes.l,
    paddingBottom: sizes.m,
    paddingHorizontal: sizes.l,
  },
  pageTitle: {
    flex: 1,
    fontSize: font.xxl,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },
  cartButton: {
    position: "absolute",
    right: sizes.l,
    top: sizes.l,
    padding: sizes.s,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  searchContainer: {
    marginHorizontal: sizes.l,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingVertical: 10,
    paddingHorizontal: sizes.m,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.s,
  },
  searchInput: {
    flex: 1,
    fontSize: font.s,
    color: colors.text,
  },
  bannerContainer: {
    width: "100%",
    height: 180,
    marginTop: sizes.l,
    marginBottom: sizes.m,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  categorySection: {
    paddingHorizontal: sizes.l,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: sizes.s,
  },
  categoryTitle: {
    fontSize: font.l,
    fontWeight: "bold",
    color: colors.text,
  },
  productsContainer: {
    paddingHorizontal: sizes.l,
    paddingTop: sizes.m,
  },
  loadingText: {
    color: colors.text,
    textAlign: "center",
    marginBottom: sizes.m,
  },
  emptyText: {
    color: colors.tabIcon,
    textAlign: "center",
    marginTop: sizes.l,
  },
});