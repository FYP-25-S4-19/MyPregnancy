import { router, usePathname, useRootNavigationState, useSegments } from "expo-router";
import useAuthStore from "../authStore";
import { useCallback, useEffect } from "react";
import utils from "../utils";
import { useGuestGate } from "./useGuestGate";
import { isDevice } from "expo-device";

export function useProtectedRoute() {
  const segments = useSegments();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();

  const accessToken = useAuthStore((state) => state.accessToken);
  const me = useAuthStore((state) => state.me);
  const isHydrated = useAuthStore.persist.hasHydrated();

  // ✅ new
  const isSigningOut = useAuthStore((state) => state.isSigningOut);

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

  useEffect(() => {
    if (!isHydrated) return;
    if (!rootNavigationState?.key) return;

    // ✅ If we’re logging out, do NOTHING. Let handleSignOut navigate to /(intro).
    if (isSigningOut) return;

    const inAuthGroup = segment0 === "(intro)";
    const inMainGroup = segment0 === "main";
    const inGuestRoute = segment1 === "guest";

    const attemptedPath = "/" + segments.join("/");

    if (me?.id && isDevice) {
      console.log("Registering for push notif....");
      utils.registerForPushNofificationsAsync(me.id);
      console.log("Registered for push notif");
    }

    // --------- GUEST / NOT LOGGED IN ----------
    if (!accessToken || utils.safeDecodeUnexpiredJWT(accessToken) === null) {
      if (inMainGroup && !inGuestRoute) {
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
    isSigningOut, // ✅
  ]);
}