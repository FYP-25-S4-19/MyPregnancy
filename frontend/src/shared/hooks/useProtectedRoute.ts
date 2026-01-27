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

  const segment0 = segments[0];
  const segment1 = segments[1];

  const safeReplace = useCallback(
    (to: string) => {
      // Prevent repeated replaces to the same destination during navigation transitions.
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

    // Analyze where the user is trying to go
    const inAuthGroup = segment0 === "(intro)"; // Login/Register
    const inMainGroup = segment0 === "main"; // The App
    const inGuestRoute = segment1 === "guest"; // specifically /main/guest

    const attemptedPath = "/" + segments.join("/");

    if (me?.id && isDevice) {
      console.log("Registering for push notif....");
      utils.registerForPushNofificationsAsync(me.id);
      console.log("Registered for push notif");
    }

    // --------- GUEST / NOT LOGGED IN ----------
    if (!accessToken || utils.safeDecodeUnexpiredJWT(accessToken) === null) {
      if (inMainGroup && !inGuestRoute) {
        // ✅ Instead of kicking to login immediately:
        // 1) show modal
        // 2) bounce back to guest home
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
  }, [accessToken, segments, isHydrated, me?.role, rootNavigationState?.key, openGuestGate, safeReplace, segment0, segment1]);
}
