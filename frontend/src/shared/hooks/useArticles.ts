import {
  EduArticlePreviewData,
  EduArticleDetailedData,
  EduArticleCategoryData,
  CreateEduArticleData,
  UpdateEduArticleData,
  ArticlePreviewData,
} from "@/src/shared/typesAndInterfaces";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/src/shared/api";
import useAuthStore from "@/src/shared/authStore";

export const useArticleCategories = () => {
  return useQuery({
    queryKey: ["articleCategories"],
    queryFn: async (): Promise<EduArticleCategoryData[]> => {
      const response = await api.get<EduArticleCategoryData[]>("/articles/categories");
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useMyArticles = () => {
  const me = useAuthStore((state) => state.me);

  return useQuery({
    queryKey: ["articles", "my-articles"],
    queryFn: async (): Promise<EduArticlePreviewData[]> => {
      const response = await api.get<EduArticlePreviewData[]>("/articles/my-articles");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!me, // Only fetch when user is authenticated
  });
};

export const useArticle = (articleId: number) => {
  return useQuery({
    queryKey: ["articles", articleId],
    queryFn: async (): Promise<EduArticleDetailedData> => {
      const response = await api.get<EduArticleDetailedData>(`/articles/${articleId}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!articleId,
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleData: CreateEduArticleData) => {
      const formData = new FormData();
      formData.append("category_id", articleData.category_id.toString());
      formData.append("title", articleData.title);
      formData.append("content_markdown", articleData.content_markdown);
      formData.append("trimester", articleData.trimester.toString());

      const response = await api.post("/articles/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles", "my-articles"] });
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, articleData }: { articleId: number; articleData: UpdateEduArticleData }) => {
      const formData = new FormData();

      if (articleData.category_id !== undefined) {
        formData.append("category_id", articleData.category_id.toString());
      }
      if (articleData.title !== undefined) {
        formData.append("title", articleData.title);
      }
      if (articleData.content_markdown !== undefined) {
        formData.append("content_markdown", articleData.content_markdown);
      }
      if (articleData.trimester !== undefined) {
        formData.append("trimester", articleData.trimester.toString());
      }

      const response = await api.put(`/articles/${articleId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: ["articles", articleId] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles", "my-articles"] });
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: number) => {
      const response = await api.delete(`/articles/${articleId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles", "my-articles"] });
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
