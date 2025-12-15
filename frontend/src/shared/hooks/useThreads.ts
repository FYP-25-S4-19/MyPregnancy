import { useQuery } from "@tanstack/react-query";
import api from "@/src/shared/api";
import { ThreadPreviewData } from "@/src/shared/typesAndInterfaces";

export const useThreads = () => {
  return useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const response = await api.get<ThreadPreviewData[]>("/threads");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useThreadsPreviews = (limit: number = 5) => {
  return useQuery({
    queryKey: ["threads", "preview", limit],
    queryFn: async () => {
      const response = await api.get<ThreadPreviewData[]>("/threads");
      return response.data.slice(0, limit);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
