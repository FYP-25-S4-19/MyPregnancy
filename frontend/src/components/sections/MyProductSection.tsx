import { View, StyleSheet, Text, TextInput } from "react-native";
import { useProductCategories, useProductPreviews } from "@/src/shared/hooks/useProducts";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { FC, useState } from "react";
import { CategoryPills } from "../CategoryPills";
import { ProductGrid } from "../ProductGrid";

export const MyProductsSection: FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: productCategories } = useProductCategories();
  const { data: productPreviews } = useProductPreviews(6);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>My Product</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholderTextColor={colors.tabIcon} />
        <Ionicons name="search" size={20} color={colors.tabIcon} style={styles.searchIcon} />
      </View>

      {/* Category Pills */}
      {productCategories && (
        <CategoryPills
          categories={productCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          showAllOption={false}
        />
      )}

      {/* Product Grid */}
      {productPreviews?.products && (
        <ProductGrid products={productPreviews.products} selectedCategory={selectedCategory} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: sizes.m,
  },
  sectionTitle: {
    fontSize: font.l,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.m,
  },
  searchContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sizes.m,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  searchInput: { flex: 1, color: colors.text },
  searchIcon: { marginLeft: sizes.s },
});
