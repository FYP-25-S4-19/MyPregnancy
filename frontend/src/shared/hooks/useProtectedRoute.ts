import { router, useRootNavigationState, useSegments } from "expo-router";
import useAuthStore from "../authStore";
import { useEffect } from "react";
import utils from "../utils";

export function useProtectedRoute() {
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  const accessToken = useAuthStore((state) => state.accessToken);
  const me = useAuthStore((state) => state.me);
  const isHydrated = useAuthStore.persist.hasHydrated();

  useEffect(() => {
    // Wait for hydration and navigation to be ready
    if (!isHydrated) return;
    if (!rootNavigationState?.key) return;

    // Analyze where the user is trying to go
    const inAuthGroup = segments[0] === "(intro)"; // Login/Register
    const inMainGroup = segments[0] === "main"; // The App
    const inGuestRoute = segments[1] === "guest"; // specifically /main/guest

    // Not logged-in (Guest) or invalid JWT ---
    if (!accessToken || utils.safeDecodeUnexpiredJWT(accessToken) === null) {
      // If they are trying to access /main...
      if (inMainGroup) {
        // ...and it is NOT the guest route -> Kick to Login
        if (!inGuestRoute) {
          router.replace("/(intro)");
        }
        // If it IS the guest route, do nothing. Let them stay.
      }
      return;
    }

    // --- LOGGED IN (USER) ---
    // If a logged-in user is on the Login page OR the Guest page -> Redirect to their Home
    if (inAuthGroup || (inMainGroup && inGuestRoute)) {
      if (me?.role === "PREGNANT_WOMAN") router.replace("/main/mother");
      else if (me?.role === "NUTRITIONIST") router.replace("/main/nutritionist");
      else if (me?.role === "VOLUNTEER_DOCTOR") router.replace("/main/doctor");
      else if (me?.role === "MERCHANT") router.replace("/main/merchant");
    }
  }, [accessToken, segments, isHydrated, me?.role, rootNavigationState?.key]);
}
