import {
  ThreadPreviewData,
  ThreadData,
  CreateCommentData,
  ThreadCategoryData,
  CreateThreadData,
} from "@/src/shared/typesAndInterfaces";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/src/shared/api";

// export const useThreads = () => {
//   return useQuery({
//     queryKey: ["threads"],
//     queryFn: async (): Promise<ThreadPreviewData[]> => {
//       const response = await api.get<ThreadPreviewData[]>("/threads");
//       return response.data;
//     },
//     staleTime: 1000 * 60 * 5, // 5 minutes
//   });
// };

export const useMyThreads = () => {
  return useQuery({
    queryKey: ["threads", "my-threads"],
    queryFn: async (): Promise<ThreadPreviewData[]> => {
      const response = await api.get<ThreadPreviewData[]>("/threads/my-threads");
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
    onMutate: async (threadId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["threads"] });

      // Snapshot previous values
      const previousThread = queryClient.getQueryData<ThreadData>(["threads", threadId]);
      const previousThreadsList = queryClient.getQueryData<ThreadPreviewData[]>(["threads"]);
      const previousThreadsPreviewQueries: { key: readonly unknown[]; data: ThreadPreviewData[] }[] = [];

      // Get all thread preview queries
      queryClient.getQueriesData<ThreadPreviewData[]>({ queryKey: ["threads", "preview"] }).forEach(([key, data]) => {
        if (data) {
          previousThreadsPreviewQueries.push({ key, data });
        }
      });

      // Optimistically update individual thread
      if (previousThread) {
        queryClient.setQueryData<ThreadData>(["threads", threadId], {
          ...previousThread,
          is_liked_by_current_user: true,
          like_count: previousThread.like_count + 1,
        });
      }

      // Optimistically update threads list
      if (previousThreadsList) {
        queryClient.setQueryData<ThreadPreviewData[]>(
          ["threads"],
          previousThreadsList.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  is_liked_by_current_user: true,
                  like_count: thread.like_count + 1,
                }
              : thread,
          ),
        );
      }

      // Optimistically update all thread preview queries
      previousThreadsPreviewQueries.forEach(({ key }) => {
        const data = queryClient.getQueryData<ThreadPreviewData[]>(key);
        if (data) {
          queryClient.setQueryData<ThreadPreviewData[]>(
            key,
            data.map((thread) =>
              thread.id === threadId
                ? {
                    ...thread,
                    is_liked_by_current_user: true,
                    like_count: thread.like_count + 1,
                  }
                : thread,
            ),
          );
        }
      });

      return { previousThread, previousThreadsList, previousThreadsPreviewQueries };
    },
    onError: (err, threadId, context) => {
      // Rollback on error
      if (context?.previousThread) {
        queryClient.setQueryData(["threads", threadId], context.previousThread);
      }
      if (context?.previousThreadsList) {
        queryClient.setQueryData(["threads"], context.previousThreadsList);
      }
      context?.previousThreadsPreviewQueries.forEach(({ key, data }) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: (_, __, threadId) => {
      // Always refetch to ensure data is in sync
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
    onMutate: async (threadId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["threads"] });

      // Snapshot previous values
      const previousThread = queryClient.getQueryData<ThreadData>(["threads", threadId]);
      const previousThreadsList = queryClient.getQueryData<ThreadPreviewData[]>(["threads"]);
      const previousThreadsPreviewQueries: { key: readonly unknown[]; data: ThreadPreviewData[] }[] = [];

      // Get all thread preview queries
      queryClient.getQueriesData<ThreadPreviewData[]>({ queryKey: ["threads", "preview"] }).forEach(([key, data]) => {
        if (data) {
          previousThreadsPreviewQueries.push({ key, data });
        }
      });

      // Optimistically update individual thread
      if (previousThread) {
        queryClient.setQueryData<ThreadData>(["threads", threadId], {
          ...previousThread,
          is_liked_by_current_user: false,
          like_count: Math.max(0, previousThread.like_count - 1),
        });
      }

      // Optimistically update threads list
      if (previousThreadsList) {
        queryClient.setQueryData<ThreadPreviewData[]>(
          ["threads"],
          previousThreadsList.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  is_liked_by_current_user: false,
                  like_count: Math.max(0, thread.like_count - 1),
                }
              : thread,
          ),
        );
      }

      // Optimistically update all thread preview queries
      previousThreadsPreviewQueries.forEach(({ key }) => {
        const data = queryClient.getQueryData<ThreadPreviewData[]>(key);
        if (data) {
          queryClient.setQueryData<ThreadPreviewData[]>(
            key,
            data.map((thread) =>
              thread.id === threadId
                ? {
                    ...thread,
                    is_liked_by_current_user: false,
                    like_count: Math.max(0, thread.like_count - 1),
                  }
                : thread,
            ),
          );
        }
      });

      return { previousThread, previousThreadsList, previousThreadsPreviewQueries };
    },
    onError: (err, threadId, context) => {
      // Rollback on error
      if (context?.previousThread) {
        queryClient.setQueryData(["threads", threadId], context.previousThread);
      }
      if (context?.previousThreadsList) {
        queryClient.setQueryData(["threads"], context.previousThreadsList);
      }
      context?.previousThreadsPreviewQueries.forEach(({ key, data }) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: (_, __, threadId) => {
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
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ["threads", threadId] });

      const previousThread = queryClient.getQueryData<ThreadData>(["threads", threadId]);

      if (previousThread) {
        const updatedComments = previousThread.comments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                is_liked_by_current_user: true,
                like_count: comment.like_count + 1,
              }
            : comment,
        );

        queryClient.setQueryData<ThreadData>(["threads", threadId], {
          ...previousThread,
          comments: updatedComments,
        });
      }

      return { previousThread };
    },
    onError: (err, commentId, context) => {
      if (context?.previousThread) {
        queryClient.setQueryData(["threads", threadId], context.previousThread);
      }
    },
    onSettled: () => {
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
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ["threads", threadId] });

      const previousThread = queryClient.getQueryData<ThreadData>(["threads", threadId]);

      if (previousThread) {
        const updatedComments = previousThread.comments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                is_liked_by_current_user: false,
                like_count: Math.max(0, comment.like_count - 1),
              }
            : comment,
        );

        queryClient.setQueryData<ThreadData>(["threads", threadId], {
          ...previousThread,
          comments: updatedComments,
        });
      }

      return { previousThread };
    },
    onError: (err, commentId, context) => {
      if (context?.previousThread) {
        queryClient.setQueryData(["threads", threadId], context.previousThread);
      }
    },
    onSettled: () => {
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

export const useCreateThread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadData: CreateThreadData) => {
      const response = await api.post("/threads", threadData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["threads", "my-threads"] });
    },
  });
};

export const useUpdateThread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, threadData }: { threadId: number; threadData: CreateThreadData }) => {
      const response = await api.put(`/threads/${threadId}`, threadData);
      return response.data;
    },
    onSuccess: (_, { threadId }) => {
      queryClient.invalidateQueries({ queryKey: ["threads", threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["threads", "my-threads"] });
    },
  });
};

export const useDeleteThread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: number) => {
      const response = await api.delete(`/threads/${threadId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["threads", "my-threads"] });
    },
  });
};
