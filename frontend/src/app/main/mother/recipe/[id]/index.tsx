import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import api from "@/src/shared/api";
import React from "react";

interface RecipeDetail {
  id: number;
  name: string;
  description: string;
  est_calories: string;
  pregnancy_benefit: string;
  img_url: string;
  serving_count: number;
  ingredients: string; // "Item 1\nItem 2\nItem 3"
  instructions: string; // "Step 1\nStep 2\nStep 3"
  category: string;
  is_saved: boolean;
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch Logic
  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe", id],
    queryFn: async () => {
      const res = await api.get<RecipeDetail>(`/recipes/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading || !recipe) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.secondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderIngredients = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, index) => (
      <View key={index} style={styles.listItemRow}>
        <Text style={styles.bulletPoint}>•</Text>
        <Text style={styles.listText}>{line.trim()}</Text>
      </View>
    ));
  };

  const renderSteps = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, index) => (
      <View key={index} style={styles.listItemRow}>
        <Text style={styles.numberPoint}>{index + 1}.</Text>
        <Text style={styles.listText}>{line.trim()}</Text>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipe.name}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO IMAGE */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: recipe.img_url }} style={styles.image} resizeMode="cover" />
        </View>

        {/* CONTENT CARD */}
        <View style={styles.cardContainer}>
          {/* Section: Calories + Heart */}
          <View style={styles.metaHeader}>
            <View>
              <Text style={styles.labelTitle}>Estimated Calories:</Text>
              <Text style={styles.bodyText}>{recipe.est_calories}</Text>
            </View>
            <TouchableOpacity onPress={() => console.log("Toggle Save")}>
              <Ionicons name={recipe.is_saved ? "heart" : "heart-outline"} size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Section: Pregnancy Benefit */}
          <View style={styles.section}>
            <Text style={styles.labelTitle}>Pregnancy Benefit:</Text>
            <Text style={styles.bodyText}>{recipe.pregnancy_benefit}</Text>
          </View>

          {/* Section: Ingredients */}
          <View style={styles.section}>
            <Text style={styles.labelTitle}>Ingredients ({recipe.serving_count} serving):</Text>
            <View style={styles.listContainer}>{renderIngredients(recipe.ingredients)}</View>
          </View>

          {/* Section: Steps */}
          <View style={styles.section}>
            <Text style={styles.labelTitle}>Steps:</Text>
            <View style={styles.listContainer}>{renderSteps(recipe.instructions)}</View>
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    backgroundColor: colors.secondary,
  },
  headerTitle: {
    fontSize: font.l,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 4,
  },
  // Image
  imageContainer: {
    width: "100%",
    height: 250,
    zIndex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  // Content Card
  cardContainer: {
    marginTop: -20, // Negative margin to overlap image slightly if desired, or set to 0
    backgroundColor: colors.white,
    borderTopLeftRadius: sizes.borderRadius * 3,
    borderTopRightRadius: sizes.borderRadius * 3,
    paddingHorizontal: sizes.l,
    paddingTop: sizes.xl,
    paddingBottom: sizes.m,
    minHeight: 500, // Ensure it fills screen
    ...shadows.medium,
  },
  // Sections
  metaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: sizes.m,
  },
  section: {
    marginBottom: sizes.m,
  },
  // Typography
  labelTitle: {
    fontSize: font.m,
    fontWeight: "bold",
    color: colors.text, // Dark Red
    marginBottom: sizes.xs,
  },
  bodyText: {
    fontSize: font.s,
    color: colors.text,
    lineHeight: 22,
  },
  // Lists
  listContainer: {
    marginTop: sizes.xs,
  },
  listItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  bulletPoint: {
    fontSize: font.s,
    color: colors.text,
    marginRight: sizes.s,
    fontWeight: "bold",
  },
  numberPoint: {
    fontSize: font.s,
    color: colors.text,
    marginRight: sizes.s,
    fontWeight: "bold",
  },
  listText: {
    fontSize: font.s,
    color: colors.text,
    flex: 1, // Ensures text wraps correctly
    lineHeight: 22,
  },
});
