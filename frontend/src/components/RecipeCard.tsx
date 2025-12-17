import { colors, sizes, font, shadows } from "../shared/designSystem";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

const IMAGE_WIDTH = 110;
const IMAGE_HEIGHT = 120;

interface RecipeCardProps {
  id: number;
  name: string;
  description: string;
  imgUrl: string | null;
  isSaved?: boolean;
  onViewPress?: () => void;
  onSavePress?: () => void;
}

export default function RecipeCard({
  name,
  description,
  imgUrl,
  isSaved = false,
  onViewPress,
  onSavePress,
}: RecipeCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onViewPress} activeOpacity={0.9}>
      {/* Left Side: Image */}
      <View style={styles.imageContainer}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholderImage]} />
        )}
      </View>

      {/* Right Side: Content */}
      <View style={styles.contentContainer}>
        <View style={styles.textWrapper}>
          <Text style={styles.title} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.description} numberOfLines={4}>
            {description}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.heartButton}
          onPress={onSavePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={sizes.l} // approx 24px
            color={colors.primary} // Pink color from design system
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius * 1.2,
    padding: sizes.s,
    marginHorizontal: sizes.m,
    marginBottom: sizes.m,

    ...shadows.small,
    borderWidth: 1,
    borderColor: colors.veryLightPink,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    marginRight: sizes.m,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: sizes.borderRadius,
  },
  placeholderImage: {
    backgroundColor: colors.lightGray,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    flexDirection: "row",
    height: IMAGE_HEIGHT,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: font.s,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.xs,
  },
  description: {
    fontSize: font.xs,
    color: colors.text,
  },
  heartButton: {
    alignSelf: "flex-end",
    paddingBottom: sizes.s,
  },
});
