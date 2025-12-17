import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";

import { colors, sizes, font } from "../../../../shared/designSystem";
import api from "@/src/shared/api";
import RecipeCard from "../../../../components/RecipeCard";

/* =========================
   Backend Recipe Interface
========================= */
interface RecipeData {
  id: number;
  name: string;
  description: string;
  est_calories: string;
  pregnancy_benefit: string;
  serving_count: number;
  img_key: string | null;
}

/* =========================
   Categories (UI only for now)
========================= */
const CATEGORIES = ["All", "Halal", "Vegetarian", "Gluten-Free", "Low-Carb"];

/* =========================
   Image helper
========================= */
const getRecipeImage = (imgKey: string | null) => {
  if (!imgKey) {
    return "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe";
  }

  // later: S3 / Cloudinary
  return `https://your-cdn.com/${imgKey}`;
};

/* =========================
   Screen
========================= */
export default function RecipesScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  /* =========================
     Fetch recipes from backend
  ========================= */
  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: async (): Promise<RecipeData[]> => {
      const res = await api.get("/recipes");
      return res.data;
    },
  });

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RECIPES</Text>
        </View>

        {/* ================= BANNER ================= */}
        <View style={styles.bannerContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1543353071-087f9a7ce56e",
            }}
            style={styles.bannerImage}
          />

          <View style={styles.paginationContainer}>
            <View style={styles.dotInactive} />
            <View style={styles.dotActive} />
            <View style={styles.dotInactive} />
          </View>
        </View>

        {/* ================= CATEGORY ================= */}
        <View style={styles.categoryContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category</Text>
            <MaterialCommunityIcons name="heart-multiple-outline" size={24} color={colors.primary} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ================= RECIPE LIST ================= */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <Text style={{ textAlign: "center", marginTop: 20 }}>Loading recipes...</Text>
          ) : (
            <FlatList
              data={recipes}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <RecipeCard
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  estCalories={item.est_calories}
                  pregnancyBenefit={item.pregnancy_benefit}
                  servingCount={item.serving_count}
                  image={getRecipeImage(item.img_key)}
                  isSaved={false}
                  onViewPress={() => router.push(`/main/mother/recipe`)}
                  onSavePress={() => console.log("Save recipe:", item.id)}
                />
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================
   Styles
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },

  header: {
    alignItems: "center",
    paddingVertical: sizes.m,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: font.xl,
    fontWeight: "800",
    color: "#6D2121",
    letterSpacing: 2,
  },

  bannerContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  paginationContainer: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF8E8E",
  },
  dotInactive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  categoryContainer: {
    paddingVertical: sizes.m,
    backgroundColor: "#FFDCDC",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: sizes.m,
    marginBottom: sizes.s,
  },
  sectionTitle: {
    fontSize: font.l,
    fontWeight: "700",
    color: "#6D2121",
  },
  categoryList: {
    paddingHorizontal: sizes.m,
    gap: sizes.s,
  },
  categoryChip: {
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  categoryChipActive: {
    borderWidth: 1,
    borderColor: "#6D2121",
  },
  categoryText: {
    color: "#6D2121",
    fontWeight: "600",
  },
  categoryTextActive: {
    fontWeight: "800",
  },

  listContainer: {
    backgroundColor: "#FFDCDC",
    paddingBottom: sizes.l,
  },
});
