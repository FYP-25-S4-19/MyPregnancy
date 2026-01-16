import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, sizes, font } from "@/src/shared/designSystem";

export interface DraftProductCardProps {
  id: number;
  name: string | null;
  description: string | null;
  imgUrl: string | null;
  updatedAt: string;
  onPress: () => void;
}

const getImageUrl = (imgKey: string | null) => {
  if (!imgKey) {
    return null;
  }
  return `${process.env.EXPO_PUBLIC_API_URL}/files/${imgKey}`;
};

export const DraftProductCard: React.FC<DraftProductCardProps> = ({
  id,
  name,
  description,
  imgUrl,
  updatedAt,
  onPress,
}) => {
  const hasContent = name || description;
  const completionPercentage = Math.round(
    (Number(!!name) + Number(!!description) + Number(!!imgUrl)) * 33.33
  );

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={32} color={colors.lightGray} />
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {name && name.trim() ? name : "Untitled Draft"}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {description && description.trim()
            ? description
            : "No description added yet"}
        </Text>

        {/* Completion Indicator */}
        <View style={styles.completionSection}>
          <View style={styles.completionBar}>
            <View
              style={[
                styles.completionProgress,
                { width: `${completionPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.completionText}>{completionPercentage}%</Text>
        </View>

        {/* Last Edited */}
        <Text style={styles.updatedAt}>
          Last edited {new Date(updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: sizes.l,
    padding: sizes.m,
    marginBottom: sizes.m,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: sizes.m,
    overflow: "hidden",
    backgroundColor: colors.veryLightPink,
    marginRight: sizes.m,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.inputFieldBackground,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.xs,
  },
  description: {
    fontSize: font.s,
    color: colors.text,
    marginBottom: sizes.s,
    lineHeight: 18,
  },
  completionSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: sizes.xs,
  },
  completionBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    marginRight: sizes.xs,
    overflow: "hidden",
  },
  completionProgress: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  completionText: {
    fontSize: font.xs,
    color: colors.lightGray,
    fontWeight: "600",
    minWidth: 30,
  },
  updatedAt: {
    fontSize: font.xs,
    color: colors.lightGray,
  },
});
