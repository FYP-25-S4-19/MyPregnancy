import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { colors, sizes, font } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProductCategories, useProductPreviews } from "@/src/shared/hooks/useProducts";
import { CategoryPills } from "@/src/components/CategoryPills";
import { ProductGrid } from "@/src/components/ProductGrid";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";

export default function MerchantShopScreen() {
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: productCategories } = useProductCategories();
  const { data: productPreviews } = useProductPreviews(20);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header */}
        <Text style={styles.pageTitle}>SHOP</Text>

        {/* Banner Image */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: "https://via.placeholder.com/600x200/667eea/ffffff?text=Best+Baby+Strollers" }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Category Section */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Category</Text>
            <Ionicons name="heart-outline" size={28} color={colors.text} />
          </View>

          {/* Category Pills */}
          {productCategories && (
            <CategoryPills
              categories={productCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              showAllOption={true}
            />
          )}
        </View>

        {/* Product Grid */}
        <View style={styles.productsContainer}>
          {productPreviews?.products && (
            <ProductGrid
              products={productPreviews.products}
              selectedCategory={selectedCategory}
              onProductCardPress={(productId) => router.push(`/main/merchant/shop/${productId}`)}
            />
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
  },
  pageTitle: {
    fontSize: font.xxl,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    paddingVertical: sizes.xl,
  },
  bannerContainer: {
    width: "100%",
    height: 200,
    marginBottom: sizes.l,
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
    paddingBottom: sizes.xl,
  },
});
