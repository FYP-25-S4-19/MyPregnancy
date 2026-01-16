import { Stack } from "expo-router";
import useAuthStore from "@/src/shared/authStore";
import { CallListener } from "@/src/components/CallListener";
import { useProtectedRoute } from "@/src/shared/hooks/useProtectedRoute";
import GuestGateModal from "@/src/components/modals/GuestGateModal";
import React from "react";

export default function MainLayout() {
  const me = useAuthStore((state) => state.me);

  // ✅ This enforces auth rules (and now triggers guest modal instead of hard redirect)
  useProtectedRoute();

  return (
    <>
      {/* Only mount call listener if logged in (not guest) */}
      {me && <CallListener />}

      {/* ✅ Modal is global */}
      <GuestGateModal />

      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}