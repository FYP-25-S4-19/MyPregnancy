import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, sizes, font } from "../../shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

// const specializationColors: Record<string, string> = {
//   "Obstetrics and Gynaecology": "#FF8C00",      // Dark Orange
//   "Reproductive Endocrinology": "#FF1493",      // Deep Pink
//   "Prenatal Care": "#1E90FF",                   // Dodger Blue
//   "Perinatal Medicine": "#20B2AA",              // Light Sea Green
//   "General Practitioner": "#32CD32",            // Lime Green
//   "Midwifery": "#673AB7",                       // Deep Purple
//   "Internal Medicine": "#009688",               // Teal
//   "Family Medicine": "#FF4500",                 // Orange Red
//   "High-Risk Pregnancy": "#DC143C",
//   "Maternal-Fetal Medicine": "#8B4513",
//   // add all specializations dynamically later if needed
// };

// const getSpecializationColor = (specialization?: string) => {
//   if (!specialization) return "#ccc"; // default color
//   return specializationColors[specialization] || "#ccc"; // fallback
// };

interface DoctorCardProps {
  id: string;
  name: string;
  image: string | null;
  specialization?: string;
  rating?: number | null;
  ratingCount?: number;
  isFavorite?: boolean;
  onChatPress?: () => void;
  onFavoritePress?: () => void;
}

export default function DoctorCard({
  name,
  image,
  specialization,
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
          console.log("Failed to load image:", err.error);
        }}
      />

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.name}>{name}</Text>

            {specialization && (
              <View style={styles.specializationChip}>
                <Text style={styles.specializationChipText}>{specialization}</Text>
              </View>
            )}
          </View>

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
            <Text style={styles.ratingText}>{typeof rating === "number" ? rating.toFixed(1) : "-"}</Text>
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
  specializationBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: sizes.s,
    paddingVertical: sizes.xs / 2,
    borderRadius: sizes.s * 2,
  },

  specializationText: {
    fontSize: font.xs,
    fontWeight: "500",
    color: colors.black,
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
  specializationChip: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    paddingHorizontal: sizes.s,
    paddingVertical: sizes.xs / 2,
    borderRadius: sizes.l,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },

  specializationChipText: {
    fontSize: font.xs,
    fontWeight: "600",
    color: colors.text,
  },
});
