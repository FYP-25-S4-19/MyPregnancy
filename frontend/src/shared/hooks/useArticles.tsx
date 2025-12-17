import { useQuery } from "@tanstack/react-query";
import api from "../api";
import { ArticlePreviewData } from "../typesAndInterfaces";

export const useArticleCategoriesQuery = () => {
  return useQuery({
    queryKey: ["Article Categories"],
    queryFn: async () => {
      const response = await api.get<string[]>("/articles/categories");
      return response.data;
    },
  });
};

export const useArticlePreviewsQuery = (limit: number) => {
  return useQuery({
    queryKey: ["Article Previews", limit],
    queryFn: async () => {
      const response = await api.get<ArticlePreviewData[]>(`/articles/previews?limit=${limit}`);
      return response.data;
    },
  });
};
