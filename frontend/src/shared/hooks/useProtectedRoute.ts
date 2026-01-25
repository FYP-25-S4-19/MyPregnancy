import { router, useRootNavigationState, useSegments } from "expo-router";
import useAuthStore from "../authStore";
import { useEffect } from "react";
import utils from "../utils";
import { useGuestGate } from "./useGuestGate";
import { isDevice } from "expo-device";

export function useProtectedRoute() {
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  const accessToken = useAuthStore((state) => state.accessToken);
  const me = useAuthStore((state) => state.me);
  const isHydrated = useAuthStore.persist.hasHydrated();

  const openGuestGate = useGuestGate((s) => s.open);

  useEffect(() => {
    if (!isHydrated) return;
    if (!rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === "(intro)";
    const inMainGroup = segments[0] === "main";
    const inGuestRoute = segments[1] === "guest"; // /main/guest/...

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
        router.replace("/main/guest");
      }
      return;
    }

    // --------- LOGGED IN ----------
    if (inAuthGroup || (inMainGroup && inGuestRoute)) {
      if (me?.role === "PREGNANT_WOMAN") router.replace("/main/mother");
      else if (me?.role === "NUTRITIONIST") router.replace("/main/nutritionist");
      else if (me?.role === "VOLUNTEER_DOCTOR") router.replace("/main/doctor");
      else if (me?.role === "MERCHANT") router.replace("/main/merchant");
    }
  }, [accessToken, segments, isHydrated, me?.role, rootNavigationState?.key, openGuestGate]);
}
