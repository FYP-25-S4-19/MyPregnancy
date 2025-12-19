import { RecipeCategory, RecipeData, RecipePaginatedResponse } from "../shared/typesAndInterfaces";
import { useSaveRecipe, useUnsaveRecipe } from "../shared/hooks/useRecipes";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, font, sizes } from "../shared/designSystem";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import RecipeCard from "../components/cards/RecipeCard";
import { router } from "expo-router";
import { useState } from "react";
import api from "../shared/api";
import {
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StyleSheet,
  FlatList,
  Image,
  Text,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function RecipePreviewsScreen() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["All"]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  const saveRecipeMutation = useSaveRecipe();
  const unsaveRecipeMutation = useUnsaveRecipe();

  const bannerImages = [
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
  ];

  const handleScroll = (event: any): void => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  const { data: recipeCategories } = useQuery({
    queryKey: ["Recipe categories"],
    queryFn: async () => {
      const res = await api.get<RecipeCategory[]>("/recipes/categories");
      return res.data;
    },
  });

  const {
    data: recipesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["Paginated recipe previews"],
    queryFn: async ({ pageParam }) => {
      const cursorParam = pageParam ? `&cursor=${pageParam}` : "";
      const res = await api.get<RecipePaginatedResponse>(`/recipes/previews?limit=${8}${cursorParam}`);
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.next_cursor : undefined;
    },
  });

  const allRecipes: RecipeData[] = recipesData?.pages.flatMap((page) => page.recipes) || [];
  const filteredRecipes: RecipeData[] = allRecipes.filter((recipe) => {
    if (selectedCategories.includes("All")) {
      return true;
    }
    return selectedCategories.includes(recipe.category);
  });

  const handleLoadMore = (): void => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const toggleCategory = (categoryLabel: string): void => {
    if (categoryLabel === "All") {
      setSelectedCategories(["All"]);
    } else {
      setSelectedCategories((prev) => {
        const withoutAll = prev.filter((cat) => cat !== "All");
        if (withoutAll.includes(categoryLabel)) {
          const updated = withoutAll.filter((cat) => cat !== categoryLabel);
          return updated.length === 0 ? ["All"] : updated;
        } else {
          return [...withoutAll, categoryLabel];
        }
      });
    }
  };

  const handleToggleSave = (recipeId: number, isSaved: boolean) => {
    if (isSaved) {
      unsaveRecipeMutation.mutate(recipeId);
    } else {
      saveRecipeMutation.mutate(recipeId);
    }
  };

  const renderHeader = () => (
    <>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RECIPES</Text>
      </View>

      {/* ================= BANNER ================= */}
      <View style={styles.bannerContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {bannerImages.map((imageUri, index) => (
            <Image key={index} source={{ uri: imageUri }} style={styles.bannerImage} />
          ))}
        </ScrollView>

        <View style={styles.paginationContainer}>
          {bannerImages.map((_, index) => (
            <View key={index} style={[index === currentImageIndex ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
      </View>

      {/* ================= CATEGORY ================= */}
      <View style={styles.categoryContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category</Text>
          <MaterialCommunityIcons name="heart-multiple-outline" size={24} color={colors.primary} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {/* Add "All" option */}
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategories.includes("All") && styles.categoryChipActive]}
            onPress={() => toggleCategory("All")}
          >
            <Text style={[styles.categoryText, selectedCategories.includes("All") && styles.categoryTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          {recipeCategories?.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategories.includes(cat.label) && styles.categoryChipActive]}
              onPress={() => toggleCategory(cat.label)}
            >
              <Text style={[styles.categoryText, selectedCategories.includes(cat.label) && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />;
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <RecipeCard
            id={item.id}
            name={item.name}
            description={item.description}
            imgUrl={item.img_url}
            isSaved={item.is_saved}
            onViewPress={() => router.push(`/main/mother/recipe/${item.id}`)}
            onSavePress={() => handleToggleSave(item.id, item.is_saved)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <Text style={{ textAlign: "center", marginTop: 20, color: "#6D2121" }}>No recipes found</Text>
          )
        }
      />
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
    paddingTop: sizes.l,
    paddingBottom: sizes.m,
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
    width: SCREEN_WIDTH,
    height: 200,
    resizeMode: "cover",
  },
  paginationContainer: {
    position: "absolute",
    bottom: 20,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  dotInactive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },

  categoryContainer: {
    paddingVertical: sizes.m,
    backgroundColor: "#FFDCDC",
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
  },
});
