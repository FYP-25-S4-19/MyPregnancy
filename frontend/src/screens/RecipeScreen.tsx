import { FlatList, Image, ScrollView, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { RecipeCategory, RecipePaginatedResponse } from "../shared/typesAndInterfaces";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, font, sizes } from "../shared/designSystem";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import RecipeCard from "../components/RecipeCard";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import api from "../shared/api";

export default function RecipeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { data: recipeCategories } = useQuery({
    queryKey: ["Recipe categories"],
    queryFn: async () => {
      const res = await api.get<RecipeCategory[]>("/recipes/categories");
      return res.data;
    },
  });

  const { data: recipesResponse, isLoading } = useQuery({
    queryKey: ["Paginated recipe previews"],
    queryFn: async () => {
      const res = await api.get<RecipePaginatedResponse>(`/recipes/previews?limit=${7}`);
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
            source={{ uri: "https://images.unsplash.com/photo-1543353071-087f9a7ce56e" }}
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
            {recipeCategories?.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, selectedCategory === cat.label && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.label)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat.label && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
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
              data={recipesResponse?.recipes || []}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <RecipeCard
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  imgUrl={item.img_url}
                  isSaved={false}
                  onViewPress={() => router.push(`/main/mother/recipe/${item.id}`)}
                  onSavePress={() => console.log("TODO Save recipe:", item.id)}
                />
              )}
            />
          )}
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
