import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from "react-native";
import { colors, sizes, font } from "../../../../shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import SearchBar from "../../../../components/SearchBar"; // Assuming you might want search here too, or remove if not needed
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { router } from "expo-router";
import api from "@/src/shared/api";

// 1. Define the Data Interface
interface RecipeData {
  recipe_id: string;
  title: string;
  description: string;
  image_url: string ;
  calories?: number;
  is_liked: boolean;
  category: string;
}

// Mock categories based on the image
const CATEGORIES = ["All", "Halal", "Vegetarian", "Gluten-Free", "Low-Carb"];

export default function RecipesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // 2. Fetch Data
  const { data } = useQuery({
    queryKey: ["list of recipes", selectedCategory],
    queryFn: async (): Promise<RecipeData[]> => {
      try {
        // In a real app, pass selectedCategory as a param
        const res = await api.get("/recipes", { params: { category: selectedCategory } });
        return res.data as RecipeData[];
      } catch {
        // Fallback mock data if API fails, just for visualization
        return [
          {
            recipe_id: "1",
            title: "Chicken Sandwich",
            description: "A healthy toasted chicken sandwich with fresh veggies and light dressing.",
            image_url: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
            is_liked: true,
            category: "Halal"
          },
          {
            recipe_id: "2",
            title: "Beef Lasagna",
            description: "A beef lasagna layered with rich sauce and cheese.",
            image_url: "https://images.unsplash.com/photo-1574868291636-2df5baa2542a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
            is_liked: false,
            category: "Halal"
          },
          {
            recipe_id: "3",
            title: "Grilled Salmon",
            description: "Grilled Salmon with Veggies and lemon butter sauce.",
            image_url: "https://images.unsplash.com/photo-1467003909585-2f8a7270028d?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
            is_liked: false,
            category: "Gluten-Free"
          }
        ];
      }
    },
  });

  const onRecipePress = (recipeId: string): void => {
    router.push(`/main/mother/recipe`);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RECIPES</Text>
        </View>

        {/* Featured Banner (Carousel Mockup) */}
        <View style={styles.bannerContainer}>
            <Image 
                source={{uri: "https://images.unsplash.com/photo-1543353071-087f9a7ce56e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"}} 
                style={styles.bannerImage} 
            />
            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
                <View style={styles.dotInactive} />
                <View style={styles.dotActive} />
                <View style={styles.dotInactive} />
            </View>
        </View>

        {/* Category Section */}
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
                        <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* Recipe List */}
        <View style={styles.listContainer}>
          {data &&
            data.map((recipe) => (
              <TouchableOpacity key={recipe.recipe_id} activeOpacity={0.9} onPress={() => onRecipePress(recipe.recipe_id)}>
                  <View style={styles.card}>
                      <Image source={{ uri: recipe.image_url }} style={styles.cardImage} />
                      <View style={styles.cardContent}>
                          <Text style={styles.cardTitle}>{recipe.title}</Text>
                          <Text style={styles.cardDesc} numberOfLines={3}>{recipe.description}</Text>
                          
                          <TouchableOpacity style={styles.favIcon}>
                              <Ionicons 
                                name={recipe.is_liked ? "heart" : "heart-outline"} 
                                size={20} 
                                color={colors.primary} 
                              />
                          </TouchableOpacity>
                      </View>
                  </View>
              </TouchableOpacity>
            ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Or "#FFFFFF" if distinct from theme
  },
  header: {
    alignItems: "center",
    paddingVertical: sizes.m,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: font.xl,
    fontWeight: "800",
    color: "#6D2121", // Dark brownish red from image
    letterSpacing: 2,
  },
  /* Banner Styles */
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
    backgroundColor: "#FF8E8E", // Pinkish dot
  },
  dotInactive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  /* Category Styles */
  categoryContainer: {
    paddingVertical: sizes.m,
    backgroundColor: "#FFDCDC", // Light pink background band
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -15, // Negative margin to overlap image slightly if desired, or 0
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    paddingBottom: sizes.s,
  },
  categoryChip: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryChipActive: {
    borderColor: "#6D2121",
    backgroundColor: "#FFFFFF",
  },
  categoryText: {
    color: "#6D2121",
    fontWeight: "600",
  },
  categoryTextActive: {
    fontWeight: "800",
  },
  /* Recipe Card Styles */
  listContainer: {
    padding: sizes.m,
    backgroundColor: "#FFDCDC", // Continuing the pink background
    minHeight: 500,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    flexDirection: "row",
    marginBottom: sizes.m,
    overflow: "hidden",
    elevation: 2, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 110,
  },
  cardImage: {
    width: 110,
    height: "100%",
    resizeMode: "cover",
  },
  cardContent: {
    flex: 1,
    padding: sizes.s,
    justifyContent: "center",
    position: "relative",
  },
  cardTitle: {
    fontSize: font.m,
    fontWeight: "700",
    color: "#4A4A4A",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: font.s,
    color: "#7A7A7A",
    lineHeight: 18,
    paddingRight: 20, // Space for heart icon
  },
  favIcon: {
    position: "absolute",
    bottom: sizes.s,
    right: sizes.s,
  },
});