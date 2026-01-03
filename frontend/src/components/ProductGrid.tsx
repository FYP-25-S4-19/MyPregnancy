import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from "react-native";
import { colors, font, shadows, sizes } from "@/src/shared/designSystem";
import { ProductPreview } from "@/src/shared/typesAndInterfaces";
import { FC, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import utils from "@/src/shared/utils";

const ProductCard: FC<{
  item: ProductPreview;
  isVisible: boolean;
  onProductCardPress: (productId: number) => void;
}> = ({ item, isVisible, onProductCardPress }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [isVisible, opacity]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View style={[styles.cardWrapper, { opacity }]}>
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => onProductCardPress(item.id)}>
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
    </Animated.View>
  );
};

interface ProductGridProps {
  products: ProductPreview[];
  selectedCategory?: string;
  onProductCardPress: (productId: number) => void;
}

export const ProductGrid: FC<ProductGridProps> = ({ products, selectedCategory = "", onProductCardPress }) => {
  return (
    <View style={styles.grid}>
      {products.map((item) => {
        const isVisible = selectedCategory.length === 0 || item.category === selectedCategory;
        return <ProductCard key={item.id} item={item} isVisible={isVisible} onProductCardPress={onProductCardPress} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: "48%",
    marginBottom: sizes.m,
  },
  card: {
    backgroundColor: colors.white,
    width: "100%",
    borderRadius: sizes.borderRadius,
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
