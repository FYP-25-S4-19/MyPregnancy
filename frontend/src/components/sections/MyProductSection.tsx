import { View, StyleSheet, ScrollView, Text, TouchableOpacity, TextInput, Image } from "react-native";
import { useProductCategories, useProductPreviews } from "@/src/shared/hooks/useProducts";
import { colors, font, shadows, sizes } from "@/src/shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import utils from "@/src/shared/utils";
import { FC, useState } from "react";

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {productCategories &&
          productCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, cat.label === selectedCategory && styles.activePill]}
              onPress={() => {
                setSelectedCategory((oldLabel) => {
                  return cat.label === oldLabel ? "" : cat.label;
                });
              }}
            >
              <Text style={[styles.pillText]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
      </ScrollView>

      {/* Product Grid */}
      <View style={styles.grid}>
        {productPreviews?.products &&
          productPreviews.products.flatMap((item) => {
            return (
              ((selectedCategory.length > 0 && item.category === selectedCategory) ||
                selectedCategory.length === 0) && (
                <View key={item.id} style={styles.card}>
                  <Image source={{ uri: item.img_url || "" }} style={styles.productImage} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productPrice}>
                      {"$"}
                      {utils.centsToDollarStr(item.price_cents)}
                    </Text>
                  </View>
                </View>
              )
            );
          })}
      </View>
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
  categories: {
    marginVertical: sizes.m,
  },
  pill: {
    backgroundColor: colors.white,
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    borderRadius: 20,
    marginRight: sizes.s,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  activePill: {
    borderColor: colors.black,
    borderWidth: 1.5,
  },
  pillText: { color: colors.text, fontWeight: "500" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: colors.white,
    width: "48%",
    borderRadius: sizes.borderRadius,
    marginBottom: sizes.m,
    overflow: "hidden",
    ...shadows.small,
  },
  productImage: {
    width: "100%",
    height: 120,
    backgroundColor: colors.lightGray,
  },
  cardInfo: {
    padding: sizes.s,
  },
  productName: {
    fontSize: font.s,
    fontWeight: "600",
    color: colors.text,
  },
  productPrice: {
    fontSize: font.xs,
    color: colors.text,
    marginTop: 4,
  },
});
