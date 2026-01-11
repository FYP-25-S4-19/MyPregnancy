import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { colors, sizes, font } from "../../shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface DoctorCardProps {
  id: string;
  name: string;
  image: string | null;
  rating?: number | null;
  ratingCount?: number;
  isFavorite?: boolean;
  onChatPress?: () => void;
  onFavoritePress?: () => void;
}

export default function DoctorCard({
  name,
  image,
  rating,
  ratingCount,
  isFavorite = false,
  onChatPress,
  onFavoritePress,
}: DoctorCardProps) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: image || "" }}
        style={styles.image}
        onError={(err) => {
          console.log("Failed to load image:", err.nativeEvent.error);
        }}
      />

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{name}</Text>
          <TouchableOpacity onPress={onFavoritePress}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={sizes.icon + 4} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.chatButton} onPress={onChatPress}>
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={25} color={colors.warning} />
            <Text style={styles.ratingText}>
              {typeof rating === "number" ? rating.toFixed(1) : "-"}
            </Text>

          
          </View>
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
    gap: sizes.xl,
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
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatButton: {
    backgroundColor: colors.white,
    paddingHorizontal: sizes.l,
    paddingVertical: sizes.xs,
    borderRadius: sizes.l,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  chatButtonText: {
    fontSize: font.s,
    color: colors.tabIcon,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: font.s + 2,
    fontWeight: "600",
    color: colors.text,
  },
});
