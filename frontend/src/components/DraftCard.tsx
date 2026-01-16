import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from "react-native";
import { colors, font, shadows, sizes } from "@/src/shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";
import utils from "@/src/shared/utils";

export const DraftCard: FC<{
  id: number;
  name: string | null;
  category: string | null;
  price_cents: number | null;
  img_url: string | null;
  isVisible: boolean;
  onPress: (draftId: number) => void;
}> = ({ id, name, category, price_cents, img_url, isVisible, onPress }) => {
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

  const displayPrice = price_cents ? utils.centsToDollarStr(price_cents) : "0.00";

  return (
    <Animated.View style={[styles.cardWrapper, { opacity }]}>
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => onPress(id)}>
        {img_url ? (
          <Image source={{ uri: img_url }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={40} color={colors.tabIcon} />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {name || "Untitled Draft"}
          </Text>
          <Text style={styles.productPrice}>${displayPrice}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
