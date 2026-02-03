// src/shared/hooks/useProtectedRoute.ts

import { isDevice } from "expo-device";
import { router, usePathname, useRootNavigationState, useSegments } from "expo-router";
import { useCallback, useEffect } from "react";
import useAuthStore from "../authStore";
import utils from "../utils";
import { useGuestGate } from "./useGuestGate";

export function useProtectedRoute() {
  const segments = useSegments();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();

  const accessToken = useAuthStore((state) => state.accessToken);
  const me = useAuthStore((state) => state.me);
  const isHydrated = useAuthStore.persist.hasHydrated();

  const segment0 = segments[0];
  const segment1 = segments[1];

  const safeReplace = useCallback(
    (to: string) => {
      if (!pathname) return;
      if (pathname === to || pathname.startsWith(`${to}/`)) return;
      router.replace(to as any);
    },
    [pathname],
  );

  const openGuestGate = useGuestGate((s) => s.open);

  // ✅ Guest-readable routes allowlist (no auth required)
  const isGuestAllowedRoute = useCallback(() => {
    // Examples:
    // /main/(notab)/threads
    // /main/(notab)/threads/123
    const inMain = segment0 === "main";
    const inNotab = segment1 === "(notab)";
    const isThreads = segments[2] === "threads";

    return inMain && inNotab && isThreads;
  }, [segment0, segment1, segments]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!rootNavigationState?.key) return;

    const inAuthGroup = segment0 === "(intro)";
    const inMainGroup = segment0 === "main";
    const inGuestRoute = segment1 === "guest"; // /main/guest

    const attemptedPath = "/" + segments.join("/");

    if (me?.id && isDevice) {
      console.log("Registering for push notif....");
      utils.registerForPushNofificationsAsync(me.id);
      console.log("Registered for push notif");
    }

    // --------- GUEST / NOT LOGGED IN ----------
    if (!accessToken || utils.safeDecodeUnexpiredJWT(accessToken) === null) {
      if (inMainGroup && !inGuestRoute) {
        // ✅ Allow guest-readable routes (threads browsing)
        if (isGuestAllowedRoute()) return;

        // Otherwise gate + bounce to guest home
        openGuestGate(attemptedPath);
        safeReplace("/main/guest");
      }
      return;
    }

    // --------- LOGGED IN ----------
    if (inAuthGroup || (inMainGroup && inGuestRoute)) {
      if (me?.role === "PREGNANT_WOMAN") safeReplace("/main/mother");
      else if (me?.role === "NUTRITIONIST") safeReplace("/main/nutritionist");
      else if (me?.role === "VOLUNTEER_DOCTOR") safeReplace("/main/doctor");
      else if (me?.role === "MERCHANT") safeReplace("/main/merchant");
    }
  }, [
    accessToken,
    segments,
    isHydrated,
    me?.role,
    me?.id,
    rootNavigationState?.key,
    openGuestGate,
    safeReplace,
    segment0,
    segment1,
    isGuestAllowedRoute,
  ]);
}