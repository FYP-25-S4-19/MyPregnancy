import useAuthStore from "@/src/shared/authStore";
import { Stack } from "expo-router";

export default function MainLayout() {
  const me = useAuthStore((state) => state.me);

  return (
    <>
      {/* CallListener is mounted inside StreamClientProvider (only when StreamVideo is ready). */}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
