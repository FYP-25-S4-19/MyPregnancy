import RecipeDetailedScreen from "@/src/screens/RecipeDetailedScreen";
import { useLocalSearchParams } from "expo-router";

export default function NutritionistRecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = parseInt(id || "0", 10);

  return <RecipeDetailedScreen recipeId={recipeId} />;
}
