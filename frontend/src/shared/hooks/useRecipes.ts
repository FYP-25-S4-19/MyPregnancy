import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/src/shared/api";

export const useSaveRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: number) => {
      const response = await api.post(`/recipes/${recipeId}/save`);
      return response.data;
    },
    onSuccess: (_, recipeId) => {
      queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["Paginated recipe previews"] });
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
    onSuccess: (_, recipeId) => {
      queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["Paginated recipe previews"] });
    },
  });
};
