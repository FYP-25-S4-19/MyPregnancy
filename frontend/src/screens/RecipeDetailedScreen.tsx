import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors, sizes, font, shadows } from "../shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "../shared/api";
import { useSaveRecipe, useUnsaveRecipe } from "../shared/hooks/useRecipes";
import React from "react";

interface RecipeDetail {
  id: number;
  name: string;
  description: string;
  est_calories: string;
  pregnancy_benefit: string;
  img_url: string;
  serving_count: number;
  ingredients: string;
  instructions: string;
  category: string;
  is_saved: boolean;
}

interface RecipeDetailedScreenProps {
  recipeId: number;
}

export default function RecipeDetailedScreen({ recipeId }: RecipeDetailedScreenProps) {
  const saveRecipeMutation = useSaveRecipe();
  const unsaveRecipeMutation = useUnsaveRecipe();

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      const res = await api.get<RecipeDetail>(`/recipes/${recipeId}`);
      return res.data;
    },
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

  const handleToggleSave = () => {
    if (recipe.is_saved) {
      unsaveRecipeMutation.mutate(recipeId);
    } else {
      saveRecipeMutation.mutate(recipeId);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
        <View style={styles.imageContainer}>
          <Image source={{ uri: recipe.img_url }} style={styles.image} resizeMode="cover" />
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.metaHeader}>
            <View>
              <Text style={styles.labelTitle}>Estimated Calories:</Text>
              <Text style={styles.bodyText}>{recipe.est_calories}</Text>
            </View>
            <TouchableOpacity onPress={handleToggleSave}>
              <Ionicons name={recipe.is_saved ? "heart" : "heart-outline"} size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.labelTitle}>Pregnancy Benefit:</Text>
            <Text style={styles.bodyText}>{recipe.pregnancy_benefit}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.labelTitle}>Ingredients ({recipe.serving_count} serving):</Text>
            <View style={styles.listContainer}>{renderIngredients(recipe.ingredients)}</View>
          </View>

          <View style={styles.section}>
            <Text style={styles.labelTitle}>Steps:</Text>
            <View style={styles.listContainer}>{renderSteps(recipe.instructions)}</View>
          </View>

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
  imageContainer: {
    width: "100%",
    height: 250,
    zIndex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  cardContainer: {
    marginTop: -20,
    backgroundColor: colors.white,
    borderTopLeftRadius: sizes.borderRadius * 3,
    borderTopRightRadius: sizes.borderRadius * 3,
    paddingHorizontal: sizes.l,
    paddingTop: sizes.xl,
    paddingBottom: sizes.m,
    minHeight: 500,
    ...shadows.medium,
  },
  metaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: sizes.m,
  },
  section: {
    marginBottom: sizes.m,
  },
  labelTitle: {
    fontSize: font.m,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.xs,
  },
  bodyText: {
    fontSize: font.s,
    color: colors.text,
    lineHeight: 22,
  },
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
    flex: 1,
    lineHeight: 22,
  },
});
