import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, sizes, font } from "../shared/designSystem";

interface RecipeCardProps {
  id: number;
  name: string;
  description: string;
  estCalories: string;
  pregnancyBenefit?: string;
  servingCount: number;
  image: string | null;
  isSaved?: boolean;
  onViewPress?: () => void;
  onSavePress?: () => void;
}

export default function RecipeCard({
  name,
  description,
  estCalories,
  pregnancyBenefit,
  servingCount,
  image,
  isSaved = false,
  onViewPress,
  onSavePress,
}: RecipeCardProps) {
  return (
    <View style={styles.card}>
      {/* Recipe Image */}
      <Image
        source={{ uri: image || "" }}
        style={styles.image}
        onError={(err) => {
          console.log("Failed to load image:", err.nativeEvent.error);
        }}
      />

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {/* Header Row: Name + Save Button */}
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <TouchableOpacity onPress={onSavePress}>
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={sizes.icon + 4} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        {/* Info Row: Calories + Servings */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="flame-outline" size={16} color={colors.warning} />
            <Text style={styles.infoText}>{estCalories}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{servingCount} serving{servingCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Footer Row: View Button + Benefit */}
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.viewButton} onPress={onViewPress}>
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>

          {/* Pregnancy Benefit (if available) */}
          {pregnancyBenefit && (
            <View style={styles.benefitContainer}>
              <Ionicons name="heart-outline" size={14} color={colors.primary} />
              <Text style={styles.benefitText} numberOfLines={1}>
                {pregnancyBenefit}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f2f9f8",
    borderRadius: sizes.borderRadius * 1.5,
    padding: sizes.m,
    marginHorizontal: sizes.l,
    marginBottom: sizes.m,
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 120,
    borderRadius: sizes.borderRadius * 2,
    backgroundColor: colors.lightGray,
  },
  contentContainer: {
    flex: 1,
    marginLeft: sizes.m,
    gap: sizes.m, 
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: sizes.s,
  },
  description: {
    fontSize: font.s,
    color: colors.text,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.m,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "500",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewButton: {
    backgroundColor: colors.background,
    paddingHorizontal: sizes.l,
    paddingVertical: sizes.xs,
    borderRadius: sizes.l,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  viewButtonText: {
    fontSize: font.s,
    color: colors.tabIcon,
    fontWeight: "500",
  },
  benefitContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary + "10",
    paddingHorizontal: sizes.s,
    paddingVertical: sizes.xs,
    borderRadius: sizes.xs,
    flex: 1,
    marginLeft: sizes.s,
  },
  benefitText: {
    fontSize: font.xs,
    color: colors.primary,
    fontWeight: "500",
    flex: 1,
  },
});