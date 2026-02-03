import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api";

export const useGetProfileImgUrl = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["profileImageUrl"],
    queryFn: async () => {
      const response = await api.get<{ url: string | null }>(`/accounts/me/profile-img-url`);
      // Add timestamp to bust React Native Image cache
      const url = response.data.url;
      if (url) {
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}_t=${Date.now()}`;
      }
      return null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled,
  });
};

export const useUpdateProfileImgMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.put(`/accounts/me/profile-img`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: async () => {
      // Invalidate and refetch to get the new presigned URL
      await queryClient.invalidateQueries({ queryKey: ["profileImageUrl"] });
      await queryClient.refetchQueries({ queryKey: ["profileImageUrl"] });
    },
  });
};
