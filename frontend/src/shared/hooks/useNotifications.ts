import { useQuery } from "@tanstack/react-query";
import api from "@/src/shared/api";
import useAuthStore from "@/src/shared/authStore";

export const useUnreadNotifications = (enabled: boolean = true) => {
  const me = useAuthStore((state) => state.me);

  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async (): Promise<boolean> => {
      const response = await api.get<{ has_unread: boolean }>("/notifications/has-unread");
      return response.data.has_unread;
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
    enabled: enabled && !!me,
  });
};
