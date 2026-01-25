import { router, usePathname, useRootNavigationState, useSegments } from "expo-router";
import useAuthStore from "../authStore";
import { useCallback, useEffect } from "react";
import utils from "../utils";

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

  useEffect(() => {
    // Wait for hydration and navigation to be ready
    if (!isHydrated) return;
    if (!rootNavigationState?.key) return;

    // Analyze where the user is trying to go
    const inAuthGroup = segment0 === "(intro)"; // Login/Register
    const inMainGroup = segment0 === "main"; // The App
    const inGuestRoute = segment1 === "guest"; // specifically /main/guest

    // Not logged-in (Guest) or invalid JWT ---
    if (!accessToken || utils.safeDecodeUnexpiredJWT(accessToken) === null) {
      // If they are trying to access /main...
      if (inMainGroup) {
        // ...and it is NOT the guest route -> Kick to Login
        if (!inGuestRoute) {
          safeReplace("/(intro)");
        }
        // If it IS the guest route, do nothing. Let them stay.
      }
      return;
    }

    // --- LOGGED IN (USER) ---
    // If a logged-in user is on the Login page OR the Guest page -> Redirect to their Home
    if (inAuthGroup || (inMainGroup && inGuestRoute)) {
      if (me?.role === "PREGNANT_WOMAN") safeReplace("/main/mother");
      else if (me?.role === "NUTRITIONIST") safeReplace("/main/nutritionist");
      else if (me?.role === "VOLUNTEER_DOCTOR") safeReplace("/main/doctor");
      else if (me?.role === "MERCHANT") safeReplace("/main/merchant");
    }
  }, [accessToken, isHydrated, me?.role, rootNavigationState?.key, safeReplace, segment0, segment1]);
}
