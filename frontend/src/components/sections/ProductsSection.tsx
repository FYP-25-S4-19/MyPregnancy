import { View, StyleSheet, Text, TextInput, LayoutAnimation, Platform, UIManager } from "react-native";
import { useProductCategories, useProductPreviews } from "@/src/shared/hooks/useProducts";
import { ProductCategory, ProductPreview } from "@/src/shared/typesAndInterfaces";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { CategoryPills } from "../CategoryPills";
import { Ionicons } from "@expo/vector-icons";
import { ProductGrid } from "../ProductGrid";
import { FC, useState } from "react";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProductsSectionProps {
  title?: string;
  products?: ProductPreview[];
  categories?: ProductCategory[];
  showSearch?: boolean;
  showCategoryFilter?: boolean;
  showAllCategoryOption?: boolean;
  onProductCardPress: (productId: number) => void;
  onSearch?: (query: string) => void;
}

/**
 * Reusable products section component that can be used across different user types.
 * Can accept data as props or fetch data internally if not provided.
 */
export const ProductsSection: FC<ProductsSectionProps> = ({
  title = "Products",
  products: propProducts,
  categories: propCategories,
  showSearch = true,
  showCategoryFilter = true,
  showAllCategoryOption = false,
  onProductCardPress,
  onSearch,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch data only if not provided via props
  const { data: fetchedCategories } = useProductCategories();
  const { data: fetchedProductPreviews } = useProductPreviews(6);

  const categories = propCategories || fetchedCategories;
  const products = propProducts || fetchedProductPreviews?.products;

  const handleCategoryChange = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategory(category);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    onSearch?.(text);
  };

  // Filter products by search query if no custom onSearch handler is provided
  const filteredProducts = products
    ? !onSearch && searchQuery
      ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : products
    : [];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.tabIcon}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          <Ionicons name="search" size={20} color={colors.tabIcon} style={styles.searchIcon} />
        </View>
      )}

      {/* Category Pills */}
      {showCategoryFilter && categories && (
        <CategoryPills
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategoryChange}
          showAllOption={showAllCategoryOption}
        />
      )}

      {/* Product Grid */}
      {filteredProducts.length > 0 && (
        <ProductGrid
          products={filteredProducts}
          selectedCategory={selectedCategory}
          onProductCardPress={onProductCardPress}
        />
      )}

      {filteredProducts.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={48} color={colors.tabIcon} />
          <Text style={styles.emptyText}>No products found</Text>
        </View>
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: sizes.xxl,
  },
  emptyText: {
    fontSize: font.m,
    color: colors.tabIcon,
    marginTop: sizes.m,
  },
});
