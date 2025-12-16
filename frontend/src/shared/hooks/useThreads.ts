import { ThreadPreviewData, ThreadData, CreateCommentData, ThreadCategoryData } from "@/src/shared/typesAndInterfaces";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/src/shared/api";

export const useThreads = () => {
  return useQuery({
    queryKey: ["threads"],
    queryFn: async (): Promise<ThreadPreviewData[]> => {
      const response = await api.get<ThreadPreviewData[]>("/threads");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useThreadsPreviews = (limit: number = 5) => {
  return useQuery({
    queryKey: ["threads", "preview", limit],
    queryFn: async (): Promise<ThreadPreviewData[]> => {
      const response = await api.get<ThreadPreviewData[]>("/threads");
      return response.data.slice(0, limit);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useThread = (threadId: number) => {
  return useQuery({
    queryKey: ["threads", threadId],
    queryFn: async (): Promise<ThreadData> => {
      const response = await api.get<ThreadData>(`/threads/${threadId}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!threadId, // Only fetch if threadId exists
  });
};

// Mutations for creating comments
export const useCreateComment = (threadId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentData: CreateCommentData) => {
      const response = await api.post(`/threads/${threadId}/comments`, commentData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch thread to get updated comments
      queryClient.invalidateQueries({ queryKey: ["threads", threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
};

// Mutations for liking/unliking threads
export const useLikeThread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: number) => {
      const response = await api.post(`/threads/${threadId}/like`);
      return response.data;
    },
    onSuccess: (_, threadId) => {
      // Invalidate queries to refetch with updated like status
      queryClient.invalidateQueries({ queryKey: ["threads", threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
};

export const useUnlikeThread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: number) => {
      const response = await api.delete(`/threads/${threadId}/unlike`);
      return response.data;
    },
    onSuccess: (_, threadId) => {
      // Invalidate queries to refetch with updated like status
      queryClient.invalidateQueries({ queryKey: ["threads", threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
};

// Mutations for liking/unliking comments
export const useLikeComment = (threadId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: number) => {
      const response = await api.post(`/threads/${threadId}/comments/${commentId}/like`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate thread query to refetch with updated comment likes
      queryClient.invalidateQueries({ queryKey: ["threads", threadId] });
    },
  });
};

export const useUnlikeComment = (threadId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: number) => {
      const response = await api.delete(`/threads/${threadId}/comments/${commentId}/unlike`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads", threadId] });
    },
  });
};

export const useThreadCategories = () => {
  return useQuery({
    queryKey: ["threadCategories"],
    queryFn: async (): Promise<ThreadCategoryData[]> => {
      const response = await api.get<ThreadCategoryData[]>("/threads/categories");
      return response.data;
    },
  });
};
