import useAuthStore from "@/src/shared/authStore";
import { useProtectedRoute } from "@/src/shared/hooks/useProtectedRoute";
import { Stack } from "expo-router";

export default function MainLayout() {
  const me = useAuthStore((state) => state.me);

  // ✅ This enforces auth rules (and now triggers guest modal instead of hard redirect)
  useProtectedRoute();

  return (
    <>
      {/* CallListener is mounted inside StreamClientProvider (only when StreamVideo is ready). */}

      {/* ✅ Modal is global */}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}