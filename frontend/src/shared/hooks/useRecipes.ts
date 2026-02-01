import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/src/shared/api";
import { RecipeData } from "@/src/shared/typesAndInterfaces";

export const useSaveRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: number) => {
      const response = await api.post(`/recipes/${recipeId}/save`);
      return response.data;
    },
    onMutate: async (recipeId: number) => {
      // Cancel any ongoing refetches to avoid overwriting optimistic updates
      await queryClient.cancelQueries({ queryKey: ["Paginated recipe previews"] });
      await queryClient.cancelQueries({ queryKey: ["recipe", recipeId] });

      // Snapshot the previous data for rollback if needed
      const previousData = queryClient.getQueryData(["Paginated recipe previews"]);

      // Optimistically update the paginated recipes list
      queryClient.setQueryData(
        ["Paginated recipe previews"],
        (data: { pages: { recipes: RecipeData[] }[] } | undefined) => {
          if (!data?.pages) return data;

          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              recipes: page.recipes.map((recipe: RecipeData) =>
                recipe.id === recipeId ? { ...recipe, is_saved: true } : recipe,
              ),
            })),
          };
        },
      );

      return { previousData };
    },
    onError: (_error, _recipeId, context) => {
      // Rollback to previous data if mutation fails
      if (context?.previousData) {
        queryClient.setQueryData(["Paginated recipe previews"], context.previousData);
      }
    },
    onSuccess: (_, recipeId) => {
      // Update individual recipe cache as well
      queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
    },
  });
};

export const useUnsaveRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: number) => {
      const response = await api.delete(`/recipes/${recipeId}/save`);
      return response.data;
    },
    onMutate: async (recipeId: number) => {
      // Cancel any ongoing refetches to avoid overwriting optimistic updates
      await queryClient.cancelQueries({ queryKey: ["Paginated recipe previews"] });
      await queryClient.cancelQueries({ queryKey: ["recipe", recipeId] });

      // Snapshot the previous data for rollback if needed
      const previousData = queryClient.getQueryData(["Paginated recipe previews"]);

      // Optimistically update the paginated recipes list
      queryClient.setQueryData(
        ["Paginated recipe previews"],
        (data: { pages: { recipes: RecipeData[] }[] } | undefined) => {
          if (!data?.pages) return data;

          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              recipes: page.recipes.map((recipe: RecipeData) =>
                recipe.id === recipeId ? { ...recipe, is_saved: false } : recipe,
              ),
            })),
          };
        },
      );

      return { previousData };
    },
    onError: (_error, _recipeId, context) => {
      // Rollback to previous data if mutation fails
      if (context?.previousData) {
        queryClient.setQueryData(["Paginated recipe previews"], context.previousData);
      }
    },
    onSuccess: (_, recipeId) => {
      // Update individual recipe cache as well
      queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
    },
  });
};
