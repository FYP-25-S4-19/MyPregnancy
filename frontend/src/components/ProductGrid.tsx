import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { colors, font, shadows, sizes } from "@/src/shared/designSystem";
import { ProductPreview } from "@/src/shared/typesAndInterfaces";
import { router } from "expo-router";
import { FC } from "react";
import utils from "@/src/shared/utils";
import { Ionicons } from "@expo/vector-icons";

interface ProductGridProps {
  products: ProductPreview[];
  selectedCategory?: string;
}

export const ProductGrid: FC<ProductGridProps> = ({ products, selectedCategory = "" }) => {
  const filteredProducts = products.filter(
    (item) => selectedCategory.length === 0 || item.category === selectedCategory
  );

  const handleProductPress = (productId: number) => {
    router.push(`/main/merchant/shop/${productId}`);
  };

  return (
    <View style={styles.grid}>
      {filteredProducts.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => handleProductPress(item.id)}
          activeOpacity={0.7}
        >
          {item.img_url ? (
            <Image source={{ uri: item.img_url }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={40} color={colors.tabIcon} />
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productPrice}>${utils.centsToDollarStr(item.price_cents)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
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
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.inputFieldBackground,
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
